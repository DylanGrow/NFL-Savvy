import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SALARIES, NFL_CAP_2026, formatSalary, PLAYER_METADATA } from '../lib/salary';
import { fetchTeamSalariesData, fetchTeamsData } from '../lib/data';
import type { Team } from '../types';

const TEAM_MAP: Record<string, string> = {
  '1': 'ATL', '2': 'BUF', '3': 'CHI', '4': 'CIN', '5': 'CLE', '6': 'DAL', '7': 'DEN', '8': 'DET',
  '9': 'GB', '10': 'TEN', '11': 'IND', '12': 'KC', '13': 'LV', '14': 'LAR', '15': 'MIA', '16': 'MIN',
  '17': 'NE', '18': 'NO', '19': 'NYG', '20': 'NYJ', '21': 'PHI', '22': 'ARI', '23': 'PIT', '24': 'LAC',
  '25': 'SF', '26': 'SEA', '27': 'TB', '28': 'WSH', '29': 'CAR', '30': 'JAX', '33': 'BAL', '34': 'HOU'
};

type ViewMode = 'team' | 'player';
type SortCol = 'Cap Hit' | 'AAV' | 'Total Value' | 'Guaranteed';
type TeamSort = 'capSpent' | 'capRoom' | 'capPercent';

interface TeamSalaryItem {
  teamId: string;
  teamAbbr: string;
  teamName: string;
  conference?: string;
  division?: string;
  primaryColor?: string;
  capLimit: number;
  capRoom: number;
  capSpent: number;
  capPercent: number;
}

export default function Salaries() {
  const [viewMode, setViewMode] = useState<ViewMode>('team');
  const [teamList, setTeamList] = useState<TeamSalaryItem[]>([]);
  const [teamsMeta, setTeamsMeta] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for Team View
  const [confFilter, setConfFilter] = useState<'ALL' | 'AFC' | 'NFC'>('ALL');
  const [teamSort, setTeamSort] = useState<TeamSort>('capRoom');
  const [teamSearch, setTeamSearch] = useState('');
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  // Filters for Player View
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('ALL');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<SortCol>('Cap Hit');
  const [playerSearch, setPlayerSearch] = useState('');

  useEffect(() => {
    document.title = 'Salaries & Cap Allocation | NFL Hub';

    Promise.allSettled([fetchTeamSalariesData(), fetchTeamsData()])
      .then(([salRes, teamsRes]) => {
        if (salRes.status === 'fulfilled' && Array.isArray(salRes.value)) {
          setTeamList(salRes.value);
        }
        if (teamsRes.status === 'fulfilled' && Array.isArray(teamsRes.value)) {
          setTeamsMeta(teamsRes.value);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // ── Team View Computed Data ────────────────────────────────
  const sortedAndFilteredTeams = useMemo(() => {
    let list = [...teamList];

    if (confFilter !== 'ALL') {
      list = list.filter(t => t.conference === confFilter);
    }

    if (teamSearch.trim()) {
      const q = teamSearch.toLowerCase();
      list = list.filter(t =>
        t.teamName.toLowerCase().includes(q) ||
        t.teamAbbr.toLowerCase().includes(q) ||
        (t.division || '').toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => {
      if (teamSort === 'capRoom') return b.capRoom - a.capRoom; // most space first
      if (teamSort === 'capSpent') return b.capSpent - a.capSpent; // highest payroll first
      return b.capPercent - a.capPercent;
    });
  }, [teamList, confFilter, teamSort, teamSearch]);

  // ── Player View Computed Data ──────────────────────────────
  const positions = useMemo(() => {
    const posSet = new Set<string>();
    Object.values(PLAYER_METADATA).forEach(p => {
      if (p.position && p.position !== 'UNK') posSet.add(p.position);
    });
    return ['ALL', ...Array.from(posSet).sort()];
  }, []);

  const allTeamsOptions = useMemo(() => {
    const map = new Map<string, string>();
    teamsMeta.forEach(t => map.set(t.abbreviation, t.name));
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [teamsMeta]);

  const sortedAndFilteredPlayers = useMemo(() => {
    let result = [...SALARIES];

    // Filter by team
    if (selectedTeamFilter !== 'ALL') {
      result = result.filter(s => {
        const abbr = TEAM_MAP[s.teamId] || s.teamId;
        return abbr === selectedTeamFilter || s.teamId === selectedTeamFilter;
      });
    }

    // Filter by position
    if (positionFilter !== 'ALL') {
      result = result.filter(s => {
        const meta = PLAYER_METADATA[s.playerId];
        return meta?.position === positionFilter;
      });
    }

    // Search by player or team name
    if (playerSearch.trim()) {
      const q = playerSearch.toLowerCase();
      result = result.filter(s => {
        const meta = PLAYER_METADATA[s.playerId];
        const name = (meta?.name || '').toLowerCase();
        const tm = (meta?.teamAbbr || TEAM_MAP[s.teamId] || '').toLowerCase();
        return name.includes(q) || tm.includes(q);
      });
    }

    return result.sort((a, b) => {
      const valA = a[sortBy === 'Cap Hit' ? 'capHit' : sortBy === 'AAV' ? 'aav' : sortBy === 'Total Value' ? 'totalValue' : 'guaranteedMoney'] || 0;
      const valB = b[sortBy === 'Cap Hit' ? 'capHit' : sortBy === 'AAV' ? 'aav' : sortBy === 'Total Value' ? 'totalValue' : 'guaranteedMoney'] || 0;
      return valB - valA;
    });
  }, [selectedTeamFilter, positionFilter, sortBy, playerSearch]);

  // League totals
  const totalTrackedCap = SALARIES.reduce((sum, s) => sum + s.capHit, 0);
  const totalLeagueCap = NFL_CAP_2026 * 32;

  return (
    <div className="app-container py-4 sm:py-8 min-h-screen text-gray-100 font-sans space-y-6">

      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 p-4 sm:p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1 text-white">
            2026 NFL Salaries & Team Cap Tracker
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Official 2026 Salary Cap: <span className="text-white font-semibold">{formatSalary(NFL_CAP_2026)}</span> per franchise · Verified OverTheCap data
          </p>
        </div>

        {/* View Mode Toggle: BY TEAM vs BY PLAYER */}
        <div className="flex bg-gray-950 p-1.5 rounded-xl border border-gray-800 self-stretch md:self-auto">
          <button
            onClick={() => setViewMode('team')}
            className={`flex-1 md:flex-initial px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              viewMode === 'team'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>🛡️</span> By Team (32 Franchises)
          </button>
          <button
            onClick={() => setViewMode('player')}
            className={`flex-1 md:flex-initial px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              viewMode === 'player'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>👤</span> By Player (Top Contracts)
          </button>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════
          VIEW 1: BY TEAM
      ═════════════════════════════════════════════════════════ */}
      {viewMode === 'team' && (
        <div className="space-y-6 animate-in fade-in duration-150">

          {/* Controls: Search, Conference, Sort */}
          <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Conference Tabs */}
            <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800">
              {(['ALL', 'AFC', 'NFC'] as const).map(conf => (
                <button
                  key={conf}
                  onClick={() => setConfFilter(conf)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                    confFilter === conf
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {conf} {conf === 'ALL' ? '(32)' : '(16)'}
                </button>
              ))}
            </div>

            {/* Sort & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-semibold whitespace-nowrap">Sort by:</span>
                <select
                  value={teamSort}
                  onChange={e => setTeamSort(e.target.value as TeamSort)}
                  className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="capRoom">Most Cap Space Remaining</option>
                  <option value="capSpent">Highest Payroll (Cap Spent)</option>
                  <option value="capPercent">% Cap Utilization</option>
                </select>
              </div>

              <input
                type="text"
                placeholder="Search team or division..."
                value={teamSearch}
                onChange={e => setTeamSearch(e.target.value)}
                className="px-3.5 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-60"
              />
            </div>
          </div>

          {/* Team Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedAndFilteredTeams.map((team, idx) => {
              const teamPlayers = SALARIES.filter(s => {
                const abbr = TEAM_MAP[s.teamId] || s.teamId;
                return abbr === team.teamAbbr || s.teamId === team.teamId;
              });

              const isExpanded = expandedTeam === team.teamAbbr;

              return (
                <div
                  key={team.teamAbbr}
                  className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition flex flex-col justify-between shadow-md"
                >
                  <div>
                    {/* Header: Logo, Name, Cap Room Badge */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/${team.teamAbbr.toLowerCase()}.png&w=48&h=48`}
                          alt={team.teamName}
                          className="w-11 h-11 object-contain shrink-0 bg-white/5 p-1 rounded-xl border border-white/10"
                        />
                        <div>
                          <Link
                            to={`/teams/${team.teamId || team.teamAbbr}`}
                            className="font-bold text-base text-white hover:text-blue-400 transition-colors flex items-center gap-1.5"
                          >
                            <span>{team.teamName}</span>
                            <span className="text-gray-500 text-xs font-mono">#{idx + 1}</span>
                          </Link>
                          <div className="text-xs text-gray-400 font-medium">
                            {team.conference} · {team.division}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-[11px] text-gray-400 font-mono">Cap Space</div>
                        <div className={`text-sm font-extrabold font-mono ${
                          team.capRoom > 15000000 ? 'text-emerald-400' :
                          team.capRoom > 5000000 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {formatSalary(team.capRoom)}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 my-3">
                      <div className="flex justify-between text-xs font-mono text-gray-400">
                        <span>Payroll: <strong className="text-gray-200">{formatSalary(team.capSpent)}</strong></span>
                        <span>{team.capPercent}% used</span>
                      </div>
                      <div className="w-full bg-gray-950 rounded-full h-2.5 overflow-hidden border border-gray-800">
                        <div
                          className={`h-full rounded-full transition-all ${
                            team.capPercent > 98 ? 'bg-red-500' :
                            team.capPercent > 90 ? 'bg-amber-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(100, team.capPercent)}%` }}
                        />
                      </div>
                    </div>

                    {/* Quick Marquee Player Preview */}
                    {teamPlayers.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-gray-800/80 space-y-2">
                        <div className="flex justify-between items-center text-xs text-gray-400">
                          <span className="font-semibold uppercase text-[10px] tracking-wider text-gray-500">
                            Tracked Marquee Contracts ({teamPlayers.length})
                          </span>
                          <button
                            onClick={() => setExpandedTeam(isExpanded ? null : team.teamAbbr)}
                            className="text-blue-400 hover:text-blue-300 font-medium text-[11px]"
                          >
                            {isExpanded ? 'Hide ▲' : 'Show ▼'}
                          </button>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="space-y-1.5 pt-1">
                            {teamPlayers.map(p => {
                              const meta = PLAYER_METADATA[p.playerId];
                              return (
                                <div key={p.playerId} className="flex justify-between items-center bg-gray-950/80 px-2.5 py-1.5 rounded-lg text-xs">
                                  <Link to={`/players/${p.playerId}`} className="text-gray-200 hover:text-blue-400 font-medium truncate max-w-[160px]">
                                    {meta?.name || `Player ${p.playerId}`}
                                    <span className="ml-1 text-[10px] text-gray-500 font-mono">({meta?.position})</span>
                                  </Link>
                                  <span className="font-mono font-bold text-emerald-400">{formatSalary(p.capHit)}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer: View Team Profile */}
                  <div className="mt-4 pt-3 border-t border-gray-800/60 flex justify-between items-center">
                    <span className="text-[11px] text-gray-500 font-mono">Cap Limit: $301.2M</span>
                    <Link
                      to={`/teams/${team.teamId || team.teamAbbr}`}
                      className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                    >
                      Team Details &rarr;
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════
          VIEW 2: BY PLAYER
      ═════════════════════════════════════════════════════════ */}
      {viewMode === 'player' && (
        <div className="space-y-6 animate-in fade-in duration-150">

          {/* Overview Banner */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 shadow-md">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-3 text-gray-400">Total Tracked Marquee Payroll</h2>
            <div className="flex flex-col sm:flex-row justify-between text-xs sm:text-sm mb-2 font-mono gap-1">
              <span className="text-blue-400 font-bold">{formatSalary(totalTrackedCap)} tracked contracts</span>
              <span className="text-gray-500">{formatSalary(totalLeagueCap)} league-wide 32-team cap space</span>
            </div>
            <div className="w-full bg-gray-950 rounded-full h-3 overflow-hidden border border-gray-800">
              <div
                className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(1, (totalTrackedCap / totalLeagueCap) * 100)}%` }}
              />
            </div>
          </div>

          {/* Player Filters: Team Dropdown, Position Chips, Sort, Search */}
          <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              {/* Team Selector Dropdown */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-xs text-gray-400 font-semibold whitespace-nowrap">Filter Team:</span>
                <select
                  value={selectedTeamFilter}
                  onChange={e => setSelectedTeamFilter(e.target.value)}
                  className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium w-full md:w-56"
                >
                  <option value="ALL">All 32 Teams</option>
                  {allTeamsOptions.map(([abbr, name]) => (
                    <option key={abbr} value={abbr}>{name} ({abbr})</option>
                  ))}
                </select>
              </div>

              {/* Player Search Input */}
              <input
                type="text"
                placeholder="Search player name or team..."
                value={playerSearch}
                onChange={e => setPlayerSearch(e.target.value)}
                className="px-3.5 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
              />
            </div>

            {/* Position Chips */}
            <div className="flex overflow-x-auto touch-scroll gap-1.5 pb-1 scrollbar-none">
              {positions.map(pos => (
                <button
                  key={pos}
                  onClick={() => setPositionFilter(pos)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap min-h-[36px] ${
                    positionFilter === pos
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-950 text-gray-300 hover:bg-gray-800 border border-gray-800'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>

            {/* Sort Controls */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-800/80">
              <span className="text-gray-400 text-xs font-semibold mr-1">Sort Metric:</span>
              {(['Cap Hit', 'AAV', 'Total Value', 'Guaranteed'] as SortCol[]).map(col => (
                <button
                  key={col}
                  onClick={() => setSortBy(col)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    sortBy === col
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 font-bold'
                      : 'bg-gray-950 border border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {col}
                </button>
              ))}
            </div>
          </div>

          {/* Player Table */}
          <div className="overflow-x-auto touch-scroll bg-gray-900 rounded-2xl shadow-lg border border-gray-800">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[700px]">
              <thead>
                <tr className="bg-gray-950 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-800">
                  <th className="p-3.5 w-16">Rank</th>
                  <th className="p-3.5">Player</th>
                  <th className="p-3.5">Team</th>
                  <th className="p-3.5">Pos</th>
                  <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => setSortBy('Cap Hit')}>
                    Cap Hit {sortBy === 'Cap Hit' && '↓'}
                  </th>
                  <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => setSortBy('AAV')}>
                    AAV {sortBy === 'AAV' && '↓'}
                  </th>
                  <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => setSortBy('Total Value')}>
                    Total Value {sortBy === 'Total Value' && '↓'}
                  </th>
                  <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => setSortBy('Guaranteed')}>
                    Guaranteed {sortBy === 'Guaranteed' && '↓'}
                  </th>
                  <th className="p-3.5">Yrs Left</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-sm">
                {sortedAndFilteredPlayers.map((s, index) => {
                  const meta = PLAYER_METADATA[s.playerId];
                  const teamAbbr = meta?.teamAbbr || TEAM_MAP[s.teamId] || s.teamId;

                  return (
                    <tr key={`${s.playerId}-${index}`} className="hover:bg-gray-800/50 transition-colors">
                      <td className="p-4 text-gray-500 font-mono">{index + 1}</td>
                      <td className="p-4 font-medium">
                        <Link to={`/players/${s.playerId}`} className="text-blue-400 hover:text-blue-300 font-bold">
                          {meta?.name || `Player ${s.playerId}`}
                        </Link>
                      </td>
                      <td className="p-4 font-mono">
                        <Link to={`/teams/${s.teamId}`} className="text-gray-300 hover:text-white flex items-center gap-1.5">
                          <img
                            src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/${teamAbbr.toLowerCase()}.png&w=20&h=20`}
                            alt=""
                            className="w-4 h-4 object-contain"
                          />
                          <span>{teamAbbr}</span>
                        </Link>
                      </td>
                      <td className="p-4 text-gray-400 font-mono">{meta?.position || '-'}</td>
                      <td className="p-4 font-mono font-bold text-white">{formatSalary(s.capHit)}</td>
                      <td className="p-4 font-mono text-gray-300">{s.aav ? formatSalary(s.aav) : '-'}</td>
                      <td className="p-4 font-mono text-gray-400">{s.totalValue ? formatSalary(s.totalValue) : '-'}</td>
                      <td className="p-4 font-mono text-gray-400">{s.guaranteedMoney ? formatSalary(s.guaranteedMoney) : '-'}</td>
                      <td className="p-4 font-mono text-gray-400">{s.yearsRemaining || '-'}</td>
                    </tr>
                  );
                })}
                {sortedAndFilteredPlayers.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-500 italic">
                      No contracts match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
