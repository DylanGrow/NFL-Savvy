import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { getTeamSalaries, formatSalary, NFL_CAP_2026, getTeamCapAllocated, PLAYER_METADATA } from '../lib/salary';
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton';
import { Badge } from '../components/ui/Badge';
import { DonutChart } from '../components/ui/DonutChart';
import { CoachCard } from '../components/team/CoachCard';
import { PlayerCard } from '../components/player/PlayerCard';
import { fetchTeamsData, fetchStadiumsData, fetchCoachesData } from '../lib/data';
import type { Team, Coach } from '../types';

export default function TeamDetail() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();

  // Local static team (from teams.json) — primary source of name/city/colors
  const [team, setTeam] = useState<Team | null>(null);
  // Raw ESPN team response — supplementary (record, espn coaches if any)
  const [espnTeam, setEspnTeam] = useState<any>(null);
  const [rosterGroups, setRosterGroups] = useState<any | null>(null);
  const [injuries, setInjuries] = useState<any[]>([]);
  const [stadiums, setStadiums] = useState<any[]>([]);
  const [coachesData, setCoachesData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [rosterTab, setRosterTab] = useState<'ALL' | 'OFFENSE' | 'DEFENSE' | 'SPECIAL TEAMS'>('ALL');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [injuriesExpanded, setInjuriesExpanded] = useState<boolean>(false);

  const loadData = async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Load local teams.json first — multi-tier match (ID, abbr, full name, nickname)
      const allTeams = await fetchTeamsData();
      const norm = (teamId || '').trim().toLowerCase();
      const staticTeam =
        allTeams.find(t => t.id.toLowerCase() === norm || String(t.espnId).toLowerCase() === norm) ||
        allTeams.find(t => t.abbreviation.toLowerCase() === norm) ||
        allTeams.find(t => t.name.toLowerCase() === norm) ||
        allTeams.find(t => t.name.toLowerCase().split(' ').pop() === norm) ||
        allTeams.find(t => t.name.toLowerCase().includes(norm));

      if (!staticTeam) {
        throw new Error(`Team "${teamId}" not found. Try browsing from the Teams page.`);
      }
      setTeam(staticTeam);
      document.title = `${staticTeam.name} | NFL Hub`;

      // 2. Resolve ESPN numeric ID (teams.json stores it as espnId or id)
      const espnId = staticTeam.espnId ?? staticTeam.id;

      // 3. Parallel-fetch everything else — failures are non-fatal
      const [espnRes, rosterRes, injuriesRes, stadiumsRes, coachesRes] = await Promise.allSettled([
        api.fetchTeam(String(espnId)),
        api.fetchRoster(String(espnId)),
        api.fetchInjuries(String(espnId)),
        fetchStadiumsData(),
        fetchCoachesData(),
      ]);

      if (espnRes.status === 'fulfilled') setEspnTeam(espnRes.value?.team ?? espnRes.value);
      if (rosterRes.status === 'fulfilled') setRosterGroups(rosterRes.value);
      if (injuriesRes.status === 'fulfilled') setInjuries(injuriesRes.value?.injuries ?? []);
      if (stadiumsRes.status === 'fulfilled') setStadiums(stadiumsRes.value);
      if (coachesRes.status === 'fulfilled') setCoachesData(coachesRes.value);
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

  // ── Roster helpers ────────────────────────────────────────
  const allPlayers = useMemo(() => {
    if (!rosterGroups?.athletes) return [];
    return rosterGroups.athletes.flatMap((g: any) => g.items ?? []);
  }, [rosterGroups]);

  const filteredRoster = useMemo(() => {
    if (!rosterGroups?.athletes) return [];
    let players: any[] = [];
    if (rosterTab === 'ALL') {
      players = allPlayers;
    } else {
      const target = rosterTab === 'OFFENSE' ? 'offense' : rosterTab === 'DEFENSE' ? 'defense' : 'special';
      const matchedGroups = rosterGroups.athletes.filter((g: any) => {
        const pos = (g.position || g.name || '').toLowerCase();
        return pos.includes(target);
      });
      players = matchedGroups.flatMap((g: any) => g.items ?? []);

      // Fallback: check athlete position parent name if group matching yielded 0
      if (players.length === 0) {
        players = allPlayers.filter((p: any) => {
          const parentName = (p.position?.parent?.name || '').toLowerCase();
          return parentName.includes(target);
        });
      }
    }

    if (sortConfig) {
      players = [...players].sort((a, b) => {
        let aVal: string | number = '';
        let bVal: string | number = '';
        switch (sortConfig.key) {
          case 'name':   aVal = a.fullName ?? ''; bVal = b.fullName ?? ''; break;
          case 'number': aVal = parseInt(a.jersey ?? '0', 10); bVal = parseInt(b.jersey ?? '0', 10); break;
          case 'position': aVal = a.position?.abbreviation ?? ''; bVal = b.position?.abbreviation ?? ''; break;
          case 'age':    aVal = a.age ?? 0; bVal = b.age ?? 0; break;
          case 'exp':    aVal = a.experience?.years ?? 0; bVal = b.experience?.years ?? 0; break;
        }
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return players;
  }, [allPlayers, rosterGroups, rosterTab, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(prev =>
      prev?.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  };

  // ── Salary / cap ─────────────────────────────────────────
  const espnId = team ? (team.espnId ?? team.id) : teamId ?? '';
  const capAllocated = getTeamCapAllocated(String(espnId));
  const capPercent = (capAllocated / NFL_CAP_2026) * 100;
  const salaries = getTeamSalaries(String(espnId));

  const capData = useMemo(() => {
    const groups: Record<string, number> = {
      QB: 0, WR: 0, 'RB/TE': 0, OL: 0, 'DL/EDGE': 0, LB: 0, DB: 0, ST: 0, Other: 0,
    };
    salaries.forEach(sal => {
      const player = allPlayers.find((p: any) => p.id === sal.playerId);
      const meta = PLAYER_METADATA[sal.playerId];
      const pos = player?.position?.abbreviation || meta?.position || '';
      if (['QB'].includes(pos)) groups.QB += sal.capHit;
      else if (['WR'].includes(pos)) groups.WR += sal.capHit;
      else if (['RB', 'TE', 'FB'].includes(pos)) groups['RB/TE'] += sal.capHit;
      else if (['T', 'G', 'C', 'OT', 'OG', 'OL'].includes(pos)) groups.OL += sal.capHit;
      else if (['DE', 'DT', 'NT', 'DL', 'EDGE'].includes(pos)) groups['DL/EDGE'] += sal.capHit;
      else if (['ILB', 'OLB', 'LB'].includes(pos)) groups.LB += sal.capHit;
      else if (['CB', 'S', 'FS', 'SS', 'DB'].includes(pos)) groups.DB += sal.capHit;
      else if (['K', 'P', 'LS'].includes(pos)) groups.ST += sal.capHit;
      else groups.Other += sal.capHit;
    });
    return [
      { label: 'QB',      value: groups.QB,        color: '#3b82f6' },
      { label: 'WR',      value: groups.WR,        color: '#8b5cf6' },
      { label: 'RB/TE',   value: groups['RB/TE'],  color: '#ec4899' },
      { label: 'OL',      value: groups.OL,        color: '#f59e0b' },
      { label: 'DL/EDGE', value: groups['DL/EDGE'],color: '#ef4444' },
      { label: 'LB',      value: groups.LB,        color: '#10b981' },
      { label: 'DB',      value: groups.DB,        color: '#06b6d4' },
      { label: 'ST',      value: groups.ST,        color: '#64748b' },
    ].filter(d => d.value > 0);
  }, [salaries, allPlayers]);

  // ── Coaching staff ────────────────────────────────────────
  const teamCoaches = useMemo<Coach[]>(() => {
    // Local coaches.json has 100% verified HC, OC, and DC with tactical scheme intelligence
    const filtered = coachesData.filter(
      (c: any) => c.teamId === String(espnId) || c.teamAbbr === team?.abbreviation
    );
    if (filtered.length > 0) {
      return filtered.map((c: any) => ({
        ...c,
        id: c.id,
        fullName: c.fullName || `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || 'Coach',
        role: c.role || 'Coach',
        teamId: c.teamId || String(espnId),
        teamAbbr: c.teamAbbr || team?.abbreviation,
        teamName: c.teamName || team?.name,
        yearsExperience: c.yearsExperience ?? c.experience,
        record: c.record,
      }));
    }

    // Fallback: ESPN raw coaches (if present in ESPN response)
    if (espnTeam?.coaches && espnTeam.coaches.length > 0) {
      return espnTeam.coaches.map((c: any, idx: number) => ({
        id: c.id || `coach-${idx}`,
        fullName: c.fullName || `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || 'Coach',
        role: c.role || c.titles?.[0]?.position || 'Coach',
        teamId: String(espnId),
        teamAbbr: team?.abbreviation,
        teamName: team?.name,
        yearsExperience: c.yearsExperience ?? c.experience,
        record: c.record,
      }));
    }

    return [];
  }, [espnTeam, coachesData, espnId, team]);

  // ── Highlight players ─────────────────────────────────────
  const highlightOffense = useMemo(() => {
    if (!allPlayers.length) return null;
    // Prefer marquee player from metadata
    const marquee = allPlayers.find((p: any) => {
      const meta = PLAYER_METADATA[String(p.id)];
      return meta && ['QB', 'WR', 'RB', 'TE'].includes(meta.position);
    });
    if (marquee) return marquee;
    // Next prefer skill positions
    const skill = allPlayers.find((p: any) => ['QB', 'WR', 'RB', 'TE'].includes(p.position?.abbreviation || ''));
    if (skill) return skill;
    return allPlayers.find((p: any) => (p.position?.parent?.name || '').toLowerCase() === 'offense') || null;
  }, [allPlayers]);

  const highlightDefense = useMemo(() => {
    if (!allPlayers.length) return null;
    // Prefer marquee defense
    const marquee = allPlayers.find((p: any) => {
      const meta = PLAYER_METADATA[String(p.id)];
      return meta && ['LB', 'EDGE', 'DE', 'DT', 'CB', 'S'].includes(meta.position);
    });
    if (marquee) return marquee;
    // Next prefer frontline / secondary defenders
    const def = allPlayers.find((p: any) => ['EDGE', 'LB', 'DE', 'DT', 'CB', 'S'].includes(p.position?.abbreviation || ''));
    if (def) return def;
    return allPlayers.find((p: any) => (p.position?.parent?.name || '').toLowerCase() === 'defense') || null;
  }, [allPlayers]);

  // ── Stadium ────────────────────────────────────────────────
  const stadium = useMemo(() => {
    if (!team || !stadiums.length) return null;
    return stadiums.find((s: any) => s.id === team.stadiumId || s.teamId === team.id) ?? null;
  }, [team, stadiums]);

  // ── Loading / error ────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-gray-950 min-h-screen text-gray-100 p-8 space-y-8">
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="bg-gray-950 min-h-screen flex flex-col items-center justify-center text-gray-100 p-8 text-center">
        <p className="text-5xl mb-4">🏈</p>
        <h2 className="text-2xl font-bold mb-4">Error Loading Team</h2>
        <p className="text-gray-400 mb-6 max-w-md">{error ?? 'Team not found.'}</p>
        <div className="flex gap-3">
          <button onClick={loadData} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">
            Retry
          </button>
          <button onClick={() => navigate('/teams')} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors">
            All Teams
          </button>
        </div>
      </div>
    );
  }

  const primaryColor = team.primaryColor || '#1f2937';
  const colorHex = primaryColor.startsWith('#') ? primaryColor : `#${primaryColor}`;

  // ESPN season record if available
  const record = espnTeam?.record?.items?.[0]?.summary ?? null;

  return (
    <div className="bg-gray-950 min-h-screen text-gray-100 pb-16 font-sans">

      {/* ── 1. Team Header ─────────────────────────────────── */}
      <div
        className="relative pt-12 sm:pt-16 pb-8 px-4 sm:px-8 flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 text-center sm:text-left shadow-xl"
        style={{ backgroundColor: colorHex }}
      >
        {/* Back button */}
        <button
          onClick={() => navigate('/teams')}
          className="absolute top-4 left-4 sm:top-6 sm:left-6 text-white/90 hover:text-white flex items-center gap-2 text-xs sm:text-sm font-semibold bg-black/30 hover:bg-black/50 px-3 py-1.5 rounded-lg backdrop-blur-sm transition-colors touch-target min-h-[38px] focus-visible:ring-2 focus-visible:ring-white"
        >
          ← Back to Teams
        </button>

        {/* Logo */}
        <img
          src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/${team.abbreviation.toLowerCase()}.png&w=96&h=96`}
          alt={`${team.name} logo`}
          className="w-20 h-20 sm:w-24 sm:h-24 object-contain bg-white/10 rounded-full p-2 border border-white/20 shadow-md"
        />

        {/* Team info */}
        <div className="flex-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-1 tracking-tight">
            {team.name}
          </h1>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-white/90 text-sm font-medium">
            <span>{team.city}</span>
            <span>•</span>
            <span className="bg-black/20 px-2 py-0.5 rounded font-mono">
              {team.conference} · {team.division}
            </span>
            {record && (
              <>
                <span>•</span>
                <span className="font-bold text-white">{record}</span>
              </>
            )}
            {stadium?.isDome && (
              <>
                <span>•</span>
                <span>🏟️ Dome</span>
              </>
            )}
          </div>
          {stadium && (
            <p className="text-white/70 text-xs mt-1">
              📍 {stadium.name}{stadium.capacity ? ` · Cap. ${stadium.capacity.toLocaleString()}` : ''}
              {stadium.surface ? ` · ${stadium.surface}` : ''}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
            <Link
              to={`/depth-charts?team=${team.id}`}
              className="inline-flex items-center gap-1.5 bg-black/40 hover:bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-white/20 backdrop-blur-sm transition-all shadow"
            >
              <span>📋</span> View Depth Chart
            </Link>
            <Link
              to={`/salaries?team=${team.id}`}
              className="inline-flex items-center gap-1.5 bg-black/20 hover:bg-black/40 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-sm transition-all"
            >
              <span>💰</span> Team Salaries
            </Link>
          </div>
        </div>
      </div>

      <div className="app-container py-6 sm:py-10 space-y-10 sm:space-y-14">

        {/* ── 2. Highlight Players ──────────────────────────── */}
        {(highlightOffense || highlightDefense) && (
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
        )}

        {/* ── 3. Coaching Staff ─────────────────────────────── */}
        <section>
          <h2 className="text-xl font-bold mb-4 text-white">Coaching Staff</h2>
          {teamCoaches.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3.5 sm:gap-4">
              {teamCoaches.map((coach: Coach, i: number) => (
                <CoachCard key={coach.id || i} coach={coach} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">Coaching data unavailable</p>
          )}
        </section>

        {/* ── 4. Cap Allocation ─────────────────────────────── */}
        <section className="bg-gray-900 rounded-2xl p-6 sm:p-8 border border-gray-800">
          <h2 className="text-xl font-semibold mb-6">Cap Allocation</h2>
          {capData.length > 0 ? (
            <div className="flex flex-col lg:flex-row gap-10 items-center">
              <div className="w-56 h-56 sm:w-64 sm:h-64 flex-shrink-0">
                <DonutChart segments={capData} />
              </div>
              <div className="flex-1 w-full">
                <div className="mb-4 flex justify-between items-end">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Total Cap Used</p>
                    <p className="text-3xl font-bold">{formatSalary(capAllocated)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400 mb-1">2026 Cap Limit</p>
                    <p className="text-xl font-medium text-gray-300">{formatSalary(NFL_CAP_2026)}</p>
                  </div>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden mb-6">
                  <div
                    className={`h-full rounded-full transition-all ${capPercent > 95 ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(capPercent, 100)}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {capData.map(d => (
                    <div key={d.label} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-sm text-gray-400 w-16 shrink-0">{d.label}</span>
                      <span className="text-sm font-medium">{formatSalary(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic text-center py-6">
              No salary data available for this team in our dataset.
            </p>
          )}
        </section>

        {/* ── 5. Injury Report ─────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>🏥</span> Injury Report ({injuries.length})
              </h2>
              <Link
                to="/injuries"
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2"
              >
                League Injury Wire &rarr;
              </Link>
            </div>
            {injuries.length > 0 && (
              <button
                onClick={() => setInjuriesExpanded(!injuriesExpanded)}
                className="text-xs sm:text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors px-3 py-1 bg-gray-900 border border-gray-800 rounded-lg"
              >
                {injuriesExpanded ? 'Collapse ▲' : 'Expand All ▼'}
              </button>
            )}
          </div>
          {injuries.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center text-gray-500">
              <p>No active injuries reported on official NFL wire for {team.name}.</p>
            </div>
          ) : injuriesExpanded ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="divide-y divide-gray-800">
                {injuries.map((inj, i) => {
                  const athlete = inj.athlete || {};
                  const st = inj.status?.name || inj.type?.description || (typeof inj.status === 'string' ? inj.status : 'Injured');
                  const bodyPart = inj.details?.type || (typeof inj.type === 'string' ? inj.type : '');
                  const note = inj.longComment || inj.shortComment || '';
                  const stLower = st.toLowerCase();
                  const isOut = stLower.includes('out') || stLower.includes('ir') || stLower.includes('reserve');
                  const isQ = stLower.includes('question') || stLower.includes('doubt');

                  return (
                    <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-800/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <img
                          src={athlete.headshot?.href || `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${athlete.id}.png&w=48&h=48`}
                          alt=""
                          className="w-10 h-10 rounded-full bg-gray-800 object-cover shrink-0 border border-gray-700"
                          onError={e => { e.currentTarget.src = 'https://a.espncdn.com/combiner/i?img=/i/headshots/noplayer.png&w=48&h=48'; }}
                        />
                        <div>
                          <Link
                            to={athlete.id ? `/players/${athlete.id}` : '#'}
                            className="font-bold text-sm text-gray-200 hover:text-blue-400 transition"
                          >
                            {athlete.displayName ?? 'Unknown Player'}
                          </Link>
                          <p className="text-xs text-gray-400 mt-0.5">
                            <span className="text-amber-400 font-semibold">{athlete.position?.abbreviation}</span>
                            {bodyPart && <span> · 🩺 {bodyPart}</span>}
                            {inj.details?.returnDate && <span className="text-emerald-400 font-mono"> · Target: {inj.details.returnDate}</span>}
                          </p>
                          {note && (
                            <p className="text-[11px] text-gray-400 mt-1 line-clamp-1 italic max-w-xl">
                              "{note}"
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant={isOut ? 'danger' : isQ ? 'warning' : 'default'}
                        label={st}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
              <span className="text-gray-400 text-xs sm:text-sm">
                {injuries.length} player{injuries.length === 1 ? '' : 's'} on official injury list.
              </span>
              <button
                onClick={() => setInjuriesExpanded(true)}
                className="text-xs text-blue-400 hover:text-blue-300 font-bold"
              >
                View Details &rarr;
              </button>
            </div>
          )}
        </section>

        {/* ── 6. Roster Table ──────────────────────────────── */}
        <section>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">
                Team Roster {allPlayers.length > 0 && <span className="text-gray-400 text-base font-normal">({allPlayers.length} players)</span>}
              </h2>
              <Link
                to={`/depth-charts?team=${team.id}`}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2 flex items-center gap-1"
              >
                <span>📋</span> Depth Chart
              </Link>
            </div>
            <div className="flex overflow-x-auto touch-scroll bg-gray-900 rounded-xl p-1 border border-gray-800 w-full sm:w-auto scrollbar-none">
              {(['ALL', 'OFFENSE', 'DEFENSE', 'SPECIAL TEAMS'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setRosterTab(tab)}
                  className={`flex-1 sm:flex-initial px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap min-h-[40px] ${
                    rosterTab === tab ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {allPlayers.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center text-gray-500">
              <p className="text-3xl mb-3">📋</p>
              <p>Roster data could not be loaded from ESPN.</p>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden overflow-x-auto touch-scroll shadow-lg">
              <table className="w-full text-left whitespace-nowrap min-w-[600px]">
                <thead className="bg-gray-950 border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                  <tr>
                    {[['#', 'number'], ['Name', 'name'], ['Pos', 'position'], ['Age', 'age'], ['Exp', 'exp']].map(([label, key]) => (
                      <th
                        key={key}
                        className="px-4 py-3.5 cursor-pointer hover:text-white select-none focus-visible:ring-1 focus-visible:ring-blue-400"
                        tabIndex={0}
                        role="button"
                        onClick={() => handleSort(key)}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSort(key); } }}
                      >
                        {label}
                        {sortConfig?.key === key && (
                          <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </th>
                    ))}
                    <th className="px-4 py-3.5">Cap Hit</th>
                    <th className="px-4 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-sm">
                  {filteredRoster.map((player: any) => {
                    const salary = salaries.find(s => s.playerId === player.id);
                    const injury = injuries.find(i => String(i.athlete?.id) === String(player.id));
                    const injDesc = injury ? (injury.status?.name || injury.type?.description || (typeof injury.status === 'string' ? injury.status : 'Injured')) : '';
                    const isOut = injDesc.toLowerCase().includes('out') || injDesc.toLowerCase().includes('ir') || injDesc.toLowerCase().includes('reserve');
                    const isQ = injDesc.toLowerCase().includes('question') || injDesc.toLowerCase().includes('doubt');

                    return (
                      <tr key={player.id} className="hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3 text-gray-400 font-mono">{player.jersey ?? '--'}</td>
                        <td className="px-4 py-3 font-medium text-blue-400 hover:text-blue-300">
                          <Link to={`/players/${player.id}`} className="flex items-center gap-2">
                            <img
                              src={player.headshot?.href ?? `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${player.id}.png&w=48&h=48`}
                              alt={player.fullName}
                              className="w-8 h-8 rounded-full bg-gray-800 object-cover shrink-0"
                              onError={e => { e.currentTarget.src = 'https://a.espncdn.com/combiner/i?img=/i/headshots/noplayer.png&w=48&h=48'; }}
                            />
                            {player.fullName}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-300">{player.position?.abbreviation ?? '--'}</td>
                        <td className="px-4 py-3 text-gray-400">{player.age ?? '--'}</td>
                        <td className="px-4 py-3 text-gray-400">{player.experience?.years ?? 0}y</td>
                        <td className="px-4 py-3 text-gray-300 font-medium">
                          {salary ? formatSalary(salary.capHit) : '--'}
                        </td>
                        <td className="px-4 py-3">
                          {injury ? (
                            <Badge variant={isOut ? 'danger' : isQ ? 'warning' : 'info'} label={injDesc} />
                          ) : (
                            <Badge variant="success" label="Active" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredRoster.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500 italic">
                        No players in this group.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
