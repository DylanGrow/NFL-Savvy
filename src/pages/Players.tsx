import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { getSalary, formatSalary } from '../lib/salary';
import { Skeleton, SkeletonCard, SkeletonTable } from '../components/ui/Skeleton';
import { fetchTeamsData } from '../lib/data';

interface Team {
  id: string;
  name: string;
  abbr: string;
}

const POSITIONS = ['ALL', 'QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K'];

export default function Players() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const [positionFilter, setPositionFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [sortBy, setSortBy] = useState<'Name' | 'Position' | 'Cap Hit'>('Name');
  const [sortDesc, setSortDesc] = useState(false);

  useEffect(() => {
    document.title = 'Players | NFL Hub';
    fetchTeamsData()
      .then((data: any[]) => {
        setTeams(data);
        if (data.length > 0) setSelectedTeam(data[0].id);
      })
      .catch(() => {
        // Fallback if the file doesn't exist locally during dev
        api.fetchTeams().then(data => {
          const t = data?.sports?.[0]?.leagues?.[0]?.teams?.map((teamWrapper: any) => ({
            id: teamWrapper.team.id,
            name: teamWrapper.team.displayName,
            abbr: teamWrapper.team.abbreviation
          })) || [];
          setTeams(t);
          if (t.length > 0) setSelectedTeam(t[0].id);
        }).catch(err => console.error(err));
      });
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const loadRoster = useCallback(async () => {
    if (!selectedTeam) return;
    setLoading(true);
    setError(false);
    try {
      const data = await api.fetchRoster(selectedTeam);
      const players = data?.athletes?.[0]?.items || [];
      const players2 = data?.athletes?.[1]?.items || [];
      const players3 = data?.athletes?.[2]?.items || [];
      const allPlayers = [...players, ...players2, ...players3];
      setRoster(allPlayers);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [selectedTeam]);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  const filteredRoster = useMemo(() => {
    let result = roster;
    if (positionFilter !== 'ALL') {
      result = result.filter(p => p.position?.abbreviation === positionFilter);
    }
    if (debouncedSearch) {
      const lower = debouncedSearch.toLowerCase();
      result = result.filter(p => p.fullName.toLowerCase().includes(lower));
    }
    return result.sort((a, b) => {
      let valA, valB;
      if (sortBy === 'Name') {
        valA = a.fullName;
        valB = b.fullName;
      } else if (sortBy === 'Position') {
        valA = a.position?.abbreviation || '';
        valB = b.position?.abbreviation || '';
      } else {
        const salA = getSalary(a.id)?.capHit || 0;
        const salB = getSalary(b.id)?.capHit || 0;
        valA = salA;
        valB = salB;
      }

      if (valA < valB) return sortDesc ? 1 : -1;
      if (valA > valB) return sortDesc ? -1 : 1;
      return 0;
    });
  }, [roster, positionFilter, debouncedSearch, sortBy, sortDesc]);

  const toggleSort = (col: 'Name' | 'Position' | 'Cap Hit') => {
    if (sortBy === col) setSortDesc(!sortDesc);
    else {
      setSortBy(col);
      setSortDesc(col === 'Cap Hit'); // default descending for cap hit
    }
  };

  const getInjuryColor = (status: string) => {
    if (status === 'OUT') return 'text-red-500 font-bold';
    if (status === 'Doubtful') return 'text-orange-500 font-bold';
    if (status === 'Questionable') return 'text-yellow-500 font-bold';
    return 'text-gray-400';
  };

  return (
    <div className="app-container py-4 sm:py-8 min-h-screen text-gray-100 font-sans space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-900 border border-gray-800 p-4 sm:p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Players Database</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">Deep rosters, cap hits, injury designations, and player profiles</p>
        </div>
        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          className="w-full sm:w-auto bg-gray-950 text-white px-4 py-2.5 rounded-xl border border-gray-800 text-sm focus:ring-2 focus:ring-blue-500 min-h-[44px]"
        >
          <option value="" disabled>Select Team</option>
          {teams.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Position Filter Chips with touch-friendly targets */}
      <div className="flex overflow-x-auto touch-scroll gap-1.5 pb-2 scrollbar-none">
        {POSITIONS.map(pos => (
          <button
            key={pos}
            onClick={() => setPositionFilter(pos)}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap min-h-[40px] touch-target ${
              positionFilter === pos
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-white border border-gray-800/80'
            }`}
          >
            {pos}
          </button>
        ))}
      </div>

      <div className="w-full sm:max-w-md">
        <input
          type="text"
          placeholder="Filter by player name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-gray-900 text-white px-4 py-2.5 rounded-xl border border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 min-h-[44px]"
        />
      </div>

      {error ? (
        <div className="bg-red-900/30 border border-red-500/40 rounded-2xl p-8 text-center">
          <p className="text-red-200 mb-4">{error || 'Failed to load roster data.'}</p>
          <button onClick={loadRoster} className="bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-xl transition touch-target">
            Retry
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto touch-scroll bg-gray-900 rounded-2xl shadow-lg border border-gray-800">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-gray-950 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-800">
                <th className="p-3.5 w-16">Photo</th>
                <th className="p-3.5 w-12">#</th>
                <th 
                  className="p-3.5 cursor-pointer hover:text-white select-none focus-visible:ring-1 focus-visible:ring-blue-400" 
                  tabIndex={0} 
                  role="button"
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSort('Name'); } }}
                  onClick={() => toggleSort('Name')}
                >
                  Name {sortBy === 'Name' && (sortDesc ? '↓' : '↑')}
                </th>
                <th 
                  className="p-3.5 cursor-pointer hover:text-white select-none focus-visible:ring-1 focus-visible:ring-blue-400" 
                  tabIndex={0} 
                  role="button"
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSort('Position'); } }}
                  onClick={() => toggleSort('Position')}
                >
                  Pos {sortBy === 'Position' && (sortDesc ? '↓' : '↑')}
                </th>
                <th className="p-3.5">Age</th>
                <th className="p-3.5">Exp</th>
                <th 
                  className="p-3.5 cursor-pointer hover:text-white select-none focus-visible:ring-1 focus-visible:ring-blue-400" 
                  tabIndex={0} 
                  role="button"
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSort('Cap Hit'); } }}
                  onClick={() => toggleSort('Cap Hit')}
                >
                  Cap Hit {sortBy === 'Cap Hit' && (sortDesc ? '↓' : '↑')}
                </th>
                <th className="p-3.5">Injury Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td className="p-4"><Skeleton className="w-12 h-9 rounded" /></td>
                    <td className="p-4"><Skeleton className="w-6 h-4" /></td>
                    <td className="p-4"><Skeleton className="w-32 h-4" /></td>
                    <td className="p-4"><Skeleton className="w-8 h-4" /></td>
                    <td className="p-4"><Skeleton className="w-8 h-4" /></td>
                    <td className="p-4"><Skeleton className="w-8 h-4" /></td>
                    <td className="p-4"><Skeleton className="w-16 h-4" /></td>
                    <td className="p-4"><Skeleton className="w-20 h-4" /></td>
                  </tr>
                ))
              ) : filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    No players found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredRoster.map(player => {
                  const salary = getSalary(player.id);
                  const capHitDisplay = salary ? formatSalary(salary.capHit) : 'N/A';
                  const injuryStatus = player.injuries?.[0]?.status || player.status?.type?.shortDetail || '';
                  
                  return (
                    <tr key={player.id} className="hover:bg-gray-800/50 transition-colors group">
                      <td className="p-4">
                        <img 
                          src={`https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${player.id}.png&w=48&h=35`} 
                          alt=""
                          className="w-12 h-[35px] object-contain bg-gray-800 rounded"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </td>
                      <td className="p-4 text-gray-400">{player.jersey || '-'}</td>
                      <td className="p-4 font-medium">
                        <Link to={`/players/${player.id}`} className="text-blue-400 hover:text-blue-300">
                          {player.fullName}
                        </Link>
                      </td>
                      <td className="p-4 text-gray-400">{player.position?.abbreviation}</td>
                      <td className="p-4 text-gray-400">{player.age || '-'}</td>
                      <td className="p-4 text-gray-400">{player.experience?.years || '0'}</td>
                      <td className="p-4 font-mono">{capHitDisplay}</td>
                      <td className={`p-4 ${getInjuryColor(injuryStatus)}`}>
                        {injuryStatus}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
