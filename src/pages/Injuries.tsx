import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { fetchTeamsData } from '../lib/data';
import type { Team } from '../types';

interface InjuryItem {
  id: string;
  athleteId: string;
  name: string;
  jersey?: string;
  position: string;
  positionGroup: 'Offense' | 'Defense' | 'Special Teams' | 'Other';
  headshot?: string;
  teamId: string;
  teamName: string;
  teamAbbr: string;
  teamColor?: string;
  status: string;
  statusType: string;
  injuryType: string;
  location?: string;
  side?: string;
  detail?: string;
  returnDate?: string;
  notes?: string;
  date?: string;
}

const OFFENSE_POS = ['QB', 'RB', 'FB', 'WR', 'TE', 'OT', 'OG', 'C', 'OL', 'T', 'G'];
const DEFENSE_POS = ['DE', 'DT', 'NT', 'DL', 'EDGE', 'LB', 'ILB', 'OLB', 'CB', 'S', 'SS', 'FS', 'DB'];
const SPECIAL_POS = ['K', 'P', 'LS', 'H', 'PR', 'KR'];

function categorizePosition(pos: string): 'Offense' | 'Defense' | 'Special Teams' | 'Other' {
  const p = (pos || '').toUpperCase();
  if (OFFENSE_POS.includes(p)) return 'Offense';
  if (DEFENSE_POS.includes(p)) return 'Defense';
  if (SPECIAL_POS.includes(p)) return 'Special Teams';
  return 'Other';
}

function getStatusBadgeClass(status: string) {
  const s = status.toLowerCase();
  if (s.includes('out') || s.includes('ir') || s.includes('reserve') || s.includes('pup')) {
    return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  }
  if (s.includes('doubt')) {
    return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
  }
  if (s.includes('question')) {
    return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  }
  return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
}

export default function Injuries() {
  const [allInjuries, setAllInjuries] = useState<InjuryItem[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [posGroupFilter, setPosGroupFilter] = useState('ALL');
  const [groupByTeam, setGroupByTeam] = useState(true);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    document.title = '2026 NFL Injury Report & Tracker | NFL Savvy';

    async function load() {
      try {
        setLoading(true);
        const [injRes, teamsData] = await Promise.allSettled([
          api.fetchLeagueInjuries(),
          fetchTeamsData(),
        ]);

        let teamsList: Team[] = [];
        if (teamsData.status === 'fulfilled' && Array.isArray(teamsData.value)) {
          teamsList = teamsData.value;
          setTeams(teamsList);
        }

        const teamMetaMap = new Map<string, Team>();
        teamsList.forEach(t => {
          teamMetaMap.set(String(t.id), t);
          if (t.espnId) teamMetaMap.set(String(t.espnId), t);
          teamMetaMap.set(t.abbreviation.toUpperCase(), t);
        });

        if (injRes.status === 'fulfilled' && injRes.value?.injuries) {
          const rawTeams = injRes.value.injuries;
          const flattened: InjuryItem[] = [];

          rawTeams.forEach((tObj: any) => {
            const tid = String(tObj.id);
            const meta = teamMetaMap.get(tid);
            const teamName = meta?.name || tObj.displayName || 'NFL Team';
            const teamAbbr = meta?.abbreviation || tObj.abbreviation || 'NFL';
            const teamColor = meta?.primaryColor;

            (tObj.injuries || []).forEach((inj: any) => {
              const athlete = inj.athlete || {};
              const posAbbr = athlete.position?.abbreviation || 'ATH';
              const stDesc = inj.status?.name || inj.type?.description || 'Questionable';
              const noteText = inj.longComment || inj.shortComment || inj.notes?.items?.[0]?.text;

              flattened.push({
                id: String(inj.id || `${tid}-${athlete.id}`),
                athleteId: String(athlete.id || ''),
                name: athlete.displayName || 'Athlete',
                jersey: athlete.jersey,
                position: posAbbr,
                positionGroup: categorizePosition(posAbbr),
                headshot: athlete.headshot?.href || `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${athlete.id}.png&w=96&h=70`,
                teamId: tid,
                teamName,
                teamAbbr,
                teamColor,
                status: stDesc,
                statusType: inj.type?.abbreviation || inj.status?.type || 'Q',
                injuryType: inj.details?.type || 'Undisclosed',
                location: inj.details?.location,
                side: inj.details?.side,
                detail: inj.details?.detail,
                returnDate: inj.details?.returnDate,
                notes: noteText,
                date: inj.date,
              });
            });
          });

          setAllInjuries(flattened);
        } else {
          throw new Error('Could not load official NFL injury database');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load live injury data');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // Filtered injuries
  const filteredInjuries = useMemo(() => {
    return allInjuries.filter(item => {
      // Team filter
      if (selectedTeam !== 'ALL') {
        if (item.teamId !== selectedTeam && item.teamAbbr !== selectedTeam) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        const s = item.status.toLowerCase();
        if (statusFilter === 'OUT' && !s.includes('out')) return false;
        if (statusFilter === 'QUESTIONABLE' && !s.includes('question')) return false;
        if (statusFilter === 'DOUBTFUL' && !s.includes('doubt')) return false;
        if (statusFilter === 'IR' && !s.includes('ir') && !s.includes('reserve')) return false;
      }

      // Position group filter
      if (posGroupFilter !== 'ALL') {
        if (item.positionGroup !== posGroupFilter) return false;
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesTeam = item.teamName.toLowerCase().includes(q) || item.teamAbbr.toLowerCase().includes(q);
        const matchesInjury = item.injuryType.toLowerCase().includes(q) || (item.location || '').toLowerCase().includes(q);
        const matchesPos = item.position.toLowerCase().includes(q);
        if (!matchesName && !matchesTeam && !matchesInjury && !matchesPos) return false;
      }

      return true;
    });
  }, [allInjuries, selectedTeam, statusFilter, posGroupFilter, search]);

  // Grouping by team
  const groupedByTeam = useMemo(() => {
    const map = new Map<string, { teamName: string; teamAbbr: string; teamId: string; teamColor?: string; items: InjuryItem[] }>();

    filteredInjuries.forEach(item => {
      if (!map.has(item.teamId)) {
        map.set(item.teamId, {
          teamName: item.teamName,
          teamAbbr: item.teamAbbr,
          teamId: item.teamId,
          teamColor: item.teamColor,
          items: [],
        });
      }
      map.get(item.teamId)!.items.push(item);
    });

    return Array.from(map.values()).sort((a, b) => b.items.length - a.items.length || a.teamName.localeCompare(b.teamName));
  }, [filteredInjuries]);

  // Summary counts
  const summaryCounts = useMemo(() => {
    let outCount = 0;
    let qCount = 0;
    let irCount = 0;
    allInjuries.forEach(i => {
      const s = i.status.toLowerCase();
      if (s.includes('out')) outCount++;
      else if (s.includes('question')) qCount++;
      else if (s.includes('ir') || s.includes('reserve')) irCount++;
    });
    return { total: allInjuries.length, outCount, qCount, irCount };
  }, [allInjuries]);

  const toggleNotes = (id: string) => {
    setExpandedNotes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="app-container py-4 sm:py-8 text-gray-100 font-sans space-y-6 sm:space-y-8">
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 p-4 sm:p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-2xl sm:text-3xl" aria-hidden="true">🏥</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              2026 NFL Injury Report & Medical Wire
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-400">
            Live official injury tracker across all 32 NFL franchises · Practice statuses, designations, and RotoWire medical insights
          </p>
        </div>

        {/* Quick summary stat pills */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="bg-gray-950 border border-gray-800 px-3 py-1.5 rounded-xl text-center flex-1 md:flex-initial">
            <div className="text-base sm:text-lg font-bold font-mono text-white">{summaryCounts.total}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Total On Wire</div>
          </div>
          <div className="bg-gray-950 border border-rose-900/50 px-3 py-1.5 rounded-xl text-center flex-1 md:flex-initial">
            <div className="text-base sm:text-lg font-bold font-mono text-rose-400">{summaryCounts.outCount}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Ruled Out</div>
          </div>
          <div className="bg-gray-950 border border-amber-900/50 px-3 py-1.5 rounded-xl text-center flex-1 md:flex-initial">
            <div className="text-base sm:text-lg font-bold font-mono text-amber-400">{summaryCounts.qCount}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Questionable</div>
          </div>
          <div className="bg-gray-950 border border-purple-900/50 px-3 py-1.5 rounded-xl text-center flex-1 md:flex-initial">
            <div className="text-base sm:text-lg font-bold font-mono text-purple-400">{summaryCounts.irCount}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">IR / Reserve</div>
          </div>
        </div>
      </div>

      {/* ── Filters & Search Toolbar ────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 p-4 sm:p-5 rounded-2xl space-y-4 shadow-lg">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search injured player, team, injury (e.g. Hamstring, Ankle, Concussion)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Team Filter Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="team-filter" className="text-xs text-gray-400 font-semibold whitespace-nowrap">
              Team:
            </label>
            <select
              id="team-filter"
              value={selectedTeam}
              onChange={e => setSelectedTeam(e.target.value)}
              className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium min-h-[44px]"
            >
              <option value="ALL">All 32 Franchises</option>
              {teams.map(t => (
                <option key={t.id} value={String(t.id)}>
                  {t.name} ({t.abbreviation})
                </option>
              ))}
            </select>

            {/* View Mode Toggle: Grouped by Team vs Flat List */}
            <button
              onClick={() => setGroupByTeam(prev => !prev)}
              className="px-3 py-2 bg-gray-950 border border-gray-800 hover:bg-gray-800 rounded-xl text-xs font-semibold text-gray-300 transition whitespace-nowrap min-h-[44px]"
              title="Toggle Grouping"
            >
              {groupByTeam ? '📂 Grouped' : '📄 Flat List'}
            </button>
          </div>
        </div>

        {/* Filter Chips: Status & Position */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-800/60">
          {/* Status Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mr-1">Status:</span>
            {[
              { id: 'ALL', label: 'All' },
              { id: 'OUT', label: 'Out' },
              { id: 'QUESTIONABLE', label: 'Questionable' },
              { id: 'DOUBTFUL', label: 'Doubtful' },
              { id: 'IR', label: 'IR' },
            ].map(chip => (
              <button
                key={chip.id}
                onClick={() => setStatusFilter(chip.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === chip.id
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-gray-950 text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Position Group Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mr-1">Unit:</span>
            {['ALL', 'Offense', 'Defense', 'Special Teams'].map(pos => (
              <button
                key={pos}
                onClick={() => setPosGroupFilter(pos)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  posGroupFilter === pos
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-gray-950 text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Injury Content ─────────────────────────────── */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-28 bg-gray-900 border border-gray-800 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-40 bg-gray-900 border border-gray-800 rounded-2xl animate-pulse" />
            <div className="h-40 bg-gray-900 border border-gray-800 rounded-2xl animate-pulse" />
          </div>
        </div>
      ) : error && allInjuries.length === 0 ? (
        <div className="bg-red-950/40 border border-red-800/60 p-8 rounded-2xl text-center text-red-300">
          <p className="text-base font-semibold mb-2">Failed to load live injury data</p>
          <p className="text-xs text-red-400">{error}</p>
        </div>
      ) : filteredInjuries.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 p-12 rounded-2xl text-center text-gray-400">
          <p className="text-4xl mb-2">🩹</p>
          <p className="text-base font-bold text-white">No matching injuries found</p>
          <p className="text-xs text-gray-500 mt-1">Try clearing your search query or adjusting your filters.</p>
          <button
            onClick={() => { setSearch(''); setSelectedTeam('ALL'); setStatusFilter('ALL'); setPosGroupFilter('ALL'); }}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
          >
            Reset Filters
          </button>
        </div>
      ) : groupByTeam ? (
        /* ── VIEW 1: Grouped by Team ──────────────────────── */
        <div className="space-y-6">
          {groupedByTeam.map(group => (
            <div key={group.teamId} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
              {/* Team Section Header */}
              <div
                className="p-4 sm:p-5 flex items-center justify-between border-b border-gray-800 bg-gradient-to-r from-gray-950 to-gray-900"
                style={{ borderLeftWidth: '5px', borderLeftColor: group.teamColor || '#3b82f6' }}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/${group.teamAbbr.toLowerCase()}.png&w=40&h=40`}
                    alt=""
                    className="w-8 h-8 object-contain shrink-0"
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                  />
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-white">
                      {group.teamName}
                    </h2>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {group.items.length} injured player{group.items.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>

                <Link
                  to={`/teams/${group.teamId}`}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                >
                  <span>Team Hub</span> &rarr;
                </Link>
              </div>

              {/* Injury Items Grid */}
              <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {group.items.map(inj => {
                  const isExpanded = expandedNotes[inj.id];
                  return (
                    <div
                      key={inj.id}
                      className="bg-gray-950/70 border border-gray-800/80 rounded-xl p-3.5 hover:border-gray-700 transition flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            to={inj.athleteId ? `/players/${inj.athleteId}` : '#'}
                            className="flex items-center gap-2.5 group min-w-0"
                          >
                            <img
                              src={inj.headshot}
                              alt=""
                              className="w-10 h-10 rounded-full bg-gray-800 object-cover shrink-0 border border-gray-700 group-hover:border-blue-400 transition"
                              onError={e => { e.currentTarget.src = 'https://a.espncdn.com/combiner/i?img=/i/headshots/noplayer.png&w=48&h=48'; }}
                            />
                            <div className="min-w-0">
                              <h3 className="font-bold text-xs sm:text-sm text-gray-200 group-hover:text-blue-400 transition truncate">
                                {inj.name}
                              </h3>
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-mono">
                                <span className="text-amber-400 font-semibold">{inj.position}</span>
                                {inj.jersey && <span>#{inj.jersey}</span>}
                              </div>
                            </div>
                          </Link>

                          {/* Status Badge */}
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border uppercase tracking-wider shrink-0 ${getStatusBadgeClass(inj.status)}`}>
                            {inj.status}
                          </span>
                        </div>

                        {/* Injury details */}
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-300">
                          <span className="bg-gray-900 border border-gray-800 px-2 py-0.5 rounded text-[11px] font-medium text-gray-200">
                            🩺 {inj.injuryType}
                          </span>
                          {inj.side && (
                            <span className="bg-gray-900/60 border border-gray-800 px-1.5 py-0.5 rounded text-[10px] text-gray-400">
                              {inj.side} side
                            </span>
                          )}
                          {inj.returnDate && (
                            <span className="text-[10px] text-emerald-400 font-mono ml-auto">
                              Target: {inj.returnDate}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Doctor / RotoWire medical update note */}
                      {inj.notes && (
                        <div className="pt-2 border-t border-gray-850 text-xs">
                          <p className={`text-gray-400 leading-relaxed text-[11px] ${isExpanded ? '' : 'line-clamp-2'}`}>
                            {inj.notes}
                          </p>
                          <button
                            onClick={() => toggleNotes(inj.id)}
                            className="mt-1 text-[10px] text-blue-400 hover:text-blue-300 font-semibold"
                          >
                            {isExpanded ? 'Show less ▲' : 'Read medical update ▼'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── VIEW 2: Flat List ────────────────────────────── */
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto touch-scroll">
            <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap min-w-[700px]">
              <thead className="bg-gray-950 border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Player</th>
                  <th className="px-3 py-3.5">Team</th>
                  <th className="px-3 py-3.5">Pos</th>
                  <th className="px-3 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Injury</th>
                  <th className="px-4 py-3.5">Return Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-gray-300">
                {filteredInjuries.map(inj => (
                  <tr key={inj.id} className="hover:bg-gray-800/40 transition">
                    <td className="px-4 py-3">
                      <Link to={inj.athleteId ? `/players/${inj.athleteId}` : '#'} className="flex items-center gap-2.5 group">
                        <img
                          src={inj.headshot}
                          alt=""
                          className="w-8 h-8 rounded-full bg-gray-800 object-cover shrink-0 border border-gray-700"
                          onError={e => { e.currentTarget.src = 'https://a.espncdn.com/combiner/i?img=/i/headshots/noplayer.png&w=48&h=48'; }}
                        />
                        <div>
                          <span className="font-semibold text-white group-hover:text-blue-400 transition block">
                            {inj.name}
                          </span>
                          {inj.jersey && <span className="text-[10px] text-gray-500 font-mono">#{inj.jersey}</span>}
                        </div>
                      </Link>
                    </td>
                    <td className="px-3 py-3 font-semibold text-gray-200">
                      <Link to={`/teams/${inj.teamId}`} className="hover:text-blue-400 transition">
                        {inj.teamAbbr}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-amber-400 font-mono font-bold">{inj.position}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border uppercase tracking-wider ${getStatusBadgeClass(inj.status)}`}>
                        {inj.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-200">{inj.injuryType}</td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-400">
                      {inj.returnDate ? <span className="text-emerald-400">{inj.returnDate}</span> : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
