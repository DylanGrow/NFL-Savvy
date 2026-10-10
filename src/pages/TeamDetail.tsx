import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { getTeamSalaries, formatSalary, NFL_CAP_2025, getTeamCapAllocated } from '../lib/salary';
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton';
import { Badge } from '../components/ui/Badge';
import { DonutChart } from '../components/ui/DonutChart';
import { CoachCard } from '../components/team/CoachCard';
import { PlayerCard } from '../components/player/PlayerCard';
import { fetchTeamsData, fetchStadiumsData } from '../lib/data';
import type { Team, Coach } from '../types';

export default function TeamDetail() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();

  const [team, setTeam] = useState<Team | null>(null);
  const [rawTeam, setRawTeam] = useState<any>(null);
  const [rosterGroups, setRosterGroups] = useState<any | null>(null);
  const [injuries, setInjuries] = useState<any[]>([]);
  const [staticTeams, setStaticTeams] = useState<any[]>([]);
  const [stadiums, setStadiums] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [rosterTab, setRosterTab] = useState<'ALL' | 'OFFENSE' | 'DEFENSE' | 'SPECIAL TEAMS'>('ALL');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [injuriesExpanded, setInjuriesExpanded] = useState<boolean>(false);

  const loadData = async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);

    try {
      const results = await Promise.allSettled([
        api.fetchTeam(teamId),
        api.fetchRoster(teamId),
        api.fetchInjuries(teamId),
        fetchTeamsData(),
        fetchStadiumsData()
      ]);

      const [teamRes, rosterRes, injuriesRes, teamsRes, stadiumsRes] = results;

      if (teamRes.status === 'fulfilled') {
        setTeam(teamRes.value.team);
        setRawTeam(teamRes.value);
      }
      if (rosterRes.status === 'fulfilled') setRosterGroups(rosterRes.value);
      if (injuriesRes.status === 'fulfilled') setInjuries(injuriesRes.value.injuries || []);
      if (teamsRes.status === 'fulfilled') setStaticTeams(teamsRes.value);
      if (stadiumsRes.status === 'fulfilled') setStadiums(stadiumsRes.value);

      if (teamRes.status === 'rejected') {
        throw new Error('Failed to load primary team data');
      }

      if (teamRes.status === 'fulfilled') {
        document.title = `${teamRes.value.team.name} | NFL Hub`;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading team data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const allPlayers = useMemo(() => {
    if (!rosterGroups) return [];
    let players: any[] = [];
    if (rosterGroups.athletes) {
      rosterGroups.athletes.forEach((group: any) => {
        players = players.concat(group.items);
      });
    }
    return players;
  }, [rosterGroups]);

  const filteredRoster = useMemo(() => {
    if (!rosterGroups) return [];
    let players: any[] = [];
    if (rosterTab === 'ALL') {
      return allPlayers;
    }
    
    const groupName = rosterTab === 'OFFENSE' ? 'Offense' : rosterTab === 'DEFENSE' ? 'Defense' : 'Special Teams';
    const group = rosterGroups.athletes?.find((g: any) => g.position === groupName);
    players = group ? group.items : [];
    
    if (sortConfig) {
      players = [...players].sort((a, b) => {
        let aVal: any = '';
        let bVal: any = '';
        
        switch (sortConfig.key) {
          case 'name':
            aVal = a.fullName;
            bVal = b.fullName;
            break;
          case 'number':
            aVal = parseInt(a.jersey || '0', 10);
            bVal = parseInt(b.jersey || '0', 10);
            break;
          case 'position':
            aVal = a.position?.abbreviation || '';
            bVal = b.position?.abbreviation || '';
            break;
          case 'age':
            aVal = a.age || 0;
            bVal = b.age || 0;
            break;
          case 'exp':
            aVal = a.experience?.years || 0;
            bVal = b.experience?.years || 0;
            break;
          default:
            break;
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return players;
  }, [allPlayers, rosterGroups, rosterTab, sortConfig]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const capAllocated = teamId ? getTeamCapAllocated(teamId) : 0;
  const capPercent = (capAllocated / NFL_CAP_2025) * 100;
  const salaries = teamId ? getTeamSalaries(teamId) : [];

  const capData = useMemo(() => {
    const groups: Record<string, number> = {
      'QB': 0, 'WR': 0, 'RB/TE': 0, 'OL': 0,
      'DL/EDGE': 0, 'LB': 0, 'DB': 0, 'ST': 0, 'Other': 0
    };

    salaries.forEach(sal => {
      const player = allPlayers.find((p: any) => p.id === sal.playerId);
      const pos = player?.position?.abbreviation || '';
      if (['QB'].includes(pos)) groups['QB'] += sal.capHit;
      else if (['WR'].includes(pos)) groups['WR'] += sal.capHit;
      else if (['RB', 'TE', 'FB'].includes(pos)) groups['RB/TE'] += sal.capHit;
      else if (['T', 'G', 'C', 'OT', 'OG', 'OL'].includes(pos)) groups['OL'] += sal.capHit;
      else if (['DE', 'DT', 'NT', 'DL', 'EDGE'].includes(pos)) groups['DL/EDGE'] += sal.capHit;
      else if (['ILB', 'OLB', 'LB'].includes(pos)) groups['LB'] += sal.capHit;
      else if (['CB', 'S', 'FS', 'SS', 'DB'].includes(pos)) groups['DB'] += sal.capHit;
      else if (['K', 'P', 'LS'].includes(pos)) groups['ST'] += sal.capHit;
      else groups['Other'] += sal.capHit;
    });

    return [
      { label: 'QB', value: groups['QB'], color: '#3b82f6' },
      { label: 'WR', value: groups['WR'], color: '#8b5cf6' },
      { label: 'RB/TE', value: groups['RB/TE'], color: '#ec4899' },
      { label: 'OL', value: groups['OL'], color: '#f59e0b' },
      { label: 'DL/EDGE', value: groups['DL/EDGE'], color: '#ef4444' },
      { label: 'LB', value: groups['LB'], color: '#10b981' },
      { label: 'DB', value: groups['DB'], color: '#06b6d4' },
      { label: 'ST', value: groups['ST'], color: '#64748b' },
    ].filter(d => d.value > 0);
  }, [salaries]);

  const highlightOffense = useMemo(() => {
    return allPlayers.find((p: any) => p.position?.parent?.name === 'Offense') || null;
  }, [allPlayers]);

  const highlightDefense = useMemo(() => {
    return allPlayers.find((p: any) => p.position?.parent?.name === 'Defense') || null;
  }, [allPlayers]);

  if (loading) {
    return (
      <div className="bg-gray-950 min-h-screen text-gray-100 p-8 space-y-8">
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="bg-gray-950 min-h-screen flex flex-col items-center justify-center text-gray-100 p-8">
        <h2 className="text-2xl font-bold mb-4">Error Loading Team</h2>
        <p className="text-gray-400 mb-6">{error}</p>
        <button onClick={loadData} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
          Retry
        </button>
      </div>
    );
  }

  const primaryColor = team.primaryColor ? `#${team.primaryColor}` : '#1f2937';

  return (
    <div className="bg-gray-950 min-h-screen text-gray-100 pb-16 font-sans">
      {/* 1. Team Header */}
      <div 
        className="relative pt-12 sm:pt-16 pb-6 sm:pb-8 px-4 sm:px-8 flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 text-center sm:text-left shadow-lg"
        style={{ backgroundColor: primaryColor }}
      >
        <button 
          onClick={() => navigate('/teams')}
          className="absolute top-4 left-4 sm:top-6 sm:left-6 text-white/90 hover:text-white flex items-center gap-2 text-xs sm:text-sm font-semibold bg-black/30 hover:bg-black/50 px-3 py-1.5 rounded-lg backdrop-blur-sm transition-colors touch-target min-h-[38px] focus-visible:ring-2 focus-visible:ring-white"
        >
          &larr; Back to Teams
        </button>
        <img 
          src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/${team.abbreviation?.toLowerCase()}.png&w=80&h=80`}
          alt={`${team.name} logo`}
          className="w-20 h-20 sm:w-24 sm:h-24 object-contain bg-white/10 rounded-full p-2 border border-white/20 shadow-md"
        />
        <div className="flex-1">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white mb-1 tracking-tight">{team.name}</h1>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-white/90 text-xs sm:text-sm font-medium">
            <span>{team.city}</span>
            <span>&bull;</span>
            <span className="bg-black/20 px-2 py-0.5 rounded text-white font-mono">{team.conference} {team.division}</span>
          </div>
        </div>
      </div>

      <div className="app-container py-6 sm:py-10 space-y-10 sm:space-y-14">
        
        {/* 6. Highlight Players */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
            <span className="text-yellow-400">⭐</span> Team Highlights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {highlightOffense && (
              <div className="relative">
                <Badge variant="warning" label="OFFENSE" className="absolute -top-3 -right-3 z-10 shadow-lg" />
                <PlayerCard player={highlightOffense} />
              </div>
            )}
            {highlightDefense && (
              <div className="relative">
                <Badge variant="info" label="DEFENSE" className="absolute -top-3 -right-3 z-10 shadow-lg" />
                <PlayerCard player={highlightDefense} />
              </div>
            )}
          </div>
        </section>

        {/* 2. Coaching Staff */}
        <section>
          <h2 className="text-xl font-bold mb-4 text-white">Coaching Staff</h2>
          {rawTeam?.team?.coaches && rawTeam.team.coaches.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-3.5 sm:gap-4">
              {rawTeam.team.coaches.map((coach: Coach, i: number) => (
                <CoachCard key={i} coach={coach} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">Coaching data unavailable</p>
          )}
        </section>

        {/* 3. Cap Allocation */}
        <section className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <h2 className="text-xl font-semibold mb-8">Cap Allocation</h2>
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="w-64 h-64 flex-shrink-0">
              <DonutChart segments={capData} />
            </div>
            <div className="flex-1 w-full">
              <div className="mb-4 flex justify-between items-end">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Total Cap Used</p>
                  <p className="text-3xl font-bold">{formatSalary(capAllocated)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400 mb-1">Cap Limit</p>
                  <p className="text-xl font-medium text-gray-300">{formatSalary(NFL_CAP_2025)}</p>
                </div>
              </div>
              <div className="h-4 bg-gray-800 rounded-full overflow-hidden mb-6">
                <div 
                  className={`h-full rounded-full ${capPercent > 95 ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(capPercent, 100)}%` }}
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {capData.map(d => (
                  <div key={d.label} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-sm text-gray-400 w-16">{d.label}</span>
                    <span className="text-sm font-medium">{formatSalary(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 5. Injury Report */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Injury Report ({injuries.length})</h2>
            <button 
              onClick={() => setInjuriesExpanded(!injuriesExpanded)}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              {injuriesExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
          {injuriesExpanded && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              {injuries.length > 0 ? (
                <div className="divide-y divide-gray-800">
                  {injuries.map((inj, i) => (
                    <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors">
                      <div>
                        <p className="font-medium">{inj.athlete?.displayName || 'Unknown Player'}</p>
                        <p className="text-sm text-gray-400">{inj.athlete?.position?.abbreviation} &bull; {inj.type}</p>
                      </div>
                      <Badge variant={inj.status === 'OUT' ? 'danger' : inj.status === 'Questionable' ? 'warning' : 'default'} label={inj.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-6 text-center text-gray-500 italic">No injuries reported.</p>
              )}
            </div>
          )}
        </section>

        {/* 4. Roster Table */}
        <section>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h2 className="text-xl font-bold text-white">Team Roster</h2>
            <div className="flex overflow-x-auto touch-scroll bg-gray-900 rounded-xl p-1 border border-gray-800 w-full sm:w-auto scrollbar-none">
              {(['ALL', 'OFFENSE', 'DEFENSE', 'SPECIAL TEAMS'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setRosterTab(tab)}
                  className={`flex-1 sm:flex-initial px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap touch-target min-h-[40px] ${
                    rosterTab === tab ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden overflow-x-auto touch-scroll shadow-lg">
            <table className="w-full text-left whitespace-nowrap min-w-[650px]">
              <thead className="bg-gray-950 border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  <th 
                    className="px-4 py-3.5 cursor-pointer hover:text-white select-none focus-visible:ring-1 focus-visible:ring-blue-400" 
                    tabIndex={0} 
                    role="button"
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSort('number'); } }}
                    onClick={() => handleSort('number')}
                  >
                    #
                  </th>
                  <th className="px-4 py-3.5">Photo</th>
                  <th 
                    className="px-4 py-3.5 cursor-pointer hover:text-white select-none focus-visible:ring-1 focus-visible:ring-blue-400" 
                    tabIndex={0} 
                    role="button"
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSort('name'); } }}
                    onClick={() => handleSort('name')}
                  >
                    Name
                  </th>
                  <th 
                    className="px-4 py-3.5 cursor-pointer hover:text-white select-none focus-visible:ring-1 focus-visible:ring-blue-400" 
                    tabIndex={0} 
                    role="button"
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSort('position'); } }}
                    onClick={() => handleSort('position')}
                  >
                    Pos
                  </th>
                  <th 
                    className="px-4 py-3.5 cursor-pointer hover:text-white select-none focus-visible:ring-1 focus-visible:ring-blue-400" 
                    tabIndex={0} 
                    role="button"
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSort('age'); } }}
                    onClick={() => handleSort('age')}
                  >
                    Age
                  </th>
                  <th 
                    className="px-4 py-3.5 cursor-pointer hover:text-white select-none focus-visible:ring-1 focus-visible:ring-blue-400" 
                    tabIndex={0} 
                    role="button"
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSort('exp'); } }}
                    onClick={() => handleSort('exp')}
                  >
                    Exp
                  </th>
                  <th className="px-4 py-3.5">Cap Hit</th>
                  <th className="px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-sm">
                {filteredRoster.map((player: any) => {
                  const salary = salaries.find(s => s.playerId === player.id);
                  const injury = injuries.find(i => i.athlete?.id === player.id);
                  
                  return (
                    <tr key={player.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 text-gray-400">{player.jersey || '--'}</td>
                      <td className="px-6 py-4">
                        <img 
                          src={player.headshot?.href || `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${player.id}.png&w=48&h=48`}
                          alt={player.fullName}
                          className="w-10 h-10 rounded-full bg-gray-800 object-cover"
                          onError={(e) => { e.currentTarget.src = 'https://a.espncdn.com/combiner/i?img=/i/headshots/noplayer.png&w=48&h=48'; }}
                        />
                      </td>
                      <td className="px-6 py-4 font-medium text-blue-400 hover:text-blue-300">
                        <Link to={`/players/${player.id}`}>{player.fullName}</Link>
                      </td>
                      <td className="px-6 py-4">{player.position?.abbreviation || '--'}</td>
                      <td className="px-6 py-4 text-gray-400">{player.age || '--'}</td>
                      <td className="px-6 py-4 text-gray-400">{player.experience?.years || 0}</td>
                      <td className="px-6 py-4 text-gray-300 font-medium">
                        {salary ? formatSalary(salary.capHit) : '--'}
                      </td>
                      <td className="px-6 py-4">
                        {injury ? (
                          <Badge variant={injury.status === 'OUT' ? 'danger' : 'warning'} label={injury.status} />
                        ) : (
                          <Badge variant="success" label="Active" />
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredRoster.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500 italic">
                      No players found in this group.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}
