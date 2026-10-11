import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { fetchTeamsData } from '../lib/data';
import type { Team, TeamDepthChart, DepthChartGroup, DepthChartPosition, DepthChartAthlete } from '../types';

export default function DepthCharts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [depthData, setDepthData] = useState<TeamDepthChart | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'Offense' | 'Defense' | 'Special Teams'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [injuriesOnly, setInjuriesOnly] = useState<boolean>(false);

  // 1. Initial Load: Teams list & URL query param matching
  useEffect(() => {
    document.title = 'Depth Charts | NFL Hub';
    fetchTeamsData()
      .then((data) => {
        const ts: Team[] = Array.isArray(data) ? data : (data as any).teams || [];
        setTeams(ts);

        const urlTeam = searchParams.get('team')?.trim().toLowerCase();
        if (urlTeam) {
          const matched =
            ts.find((t) => t.id.toLowerCase() === urlTeam || String(t.espnId).toLowerCase() === urlTeam) ||
            ts.find((t) => t.abbreviation.toLowerCase() === urlTeam) ||
            ts.find((t) => t.name.toLowerCase().includes(urlTeam));
          if (matched) {
            setSelectedTeamId(matched.id);
            return;
          }
        }

        // Default to first team if no URL param
        if (ts.length > 0) {
          setSelectedTeamId(ts[0].id);
        }
      })
      .catch(() => {});
  }, [searchParams]);

  // Handle team change: update state and URL query param
  const handleSelectTeam = (id: string) => {
    setSelectedTeamId(id);
    setSearchParams({ team: id });
  };

  // 2. Fetch official depth chart when selected team changes
  useEffect(() => {
    if (!selectedTeamId) return;
    setLoading(true);
    setError(null);
    setDepthData(null);

    api
      .fetchDepthChart(selectedTeamId)
      .then((res) => {
        setDepthData(res);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load depth chart');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedTeamId]);

  // Current active team metadata from teams.json
  const currentTeam = useMemo(() => {
    return teams.find((t) => t.id === selectedTeamId) || null;
  }, [teams, selectedTeamId]);

  // Dynamic filter for depth chart groups and positions
  const filteredGroups = useMemo(() => {
    if (!depthData?.groups) return [];

    return depthData.groups
      .filter((grp) => {
        if (activeCategory === 'ALL') return true;
        return grp.category === activeCategory;
      })
      .map((grp) => {
        const q = searchQuery.trim().toLowerCase();
        const filteredPositions = grp.positions.filter((pos) => {
          // If filtering by injuries only
          if (injuriesOnly) {
            const hasInjured = pos.athletes.some((a) => a.injuries && a.injuries.length > 0);
            if (!hasInjured) return false;
          }

          if (!q) return true;

          // Check position abbreviation or name
          const posMatches =
            pos.position.abbreviation.toLowerCase().includes(q) ||
            pos.position.displayName.toLowerCase().includes(q) ||
            (pos.key && pos.key.toLowerCase().includes(q));

          // Check any athlete name or jersey
          const athleteMatches = pos.athletes.some(
            (a) =>
              a.displayName.toLowerCase().includes(q) ||
              (a.shortName && a.shortName.toLowerCase().includes(q)) ||
              (a.jersey && a.jersey === q.replace('#', ''))
          );

          return posMatches || athleteMatches;
        });

        return {
          ...grp,
          positions: filteredPositions,
        };
      })
      .filter((grp) => grp.positions.length > 0);
  }, [depthData, activeCategory, searchQuery, injuriesOnly]);

  // Injury Badge Helper
  const renderInjuryBadge = (injuries?: DepthChartAthlete['injuries']) => {
    if (!injuries || injuries.length === 0) return null;
    const primary = injuries[0];
    const status = primary.status || primary.type?.description || 'Injured';
    const s = status.toLowerCase();

    let bg = 'bg-amber-950/70 text-amber-300 border-amber-800/60';
    if (s.includes('out') || s.includes('doubtful')) {
      bg = 'bg-rose-950/70 text-rose-300 border-rose-800/60';
    } else if (s.includes('reserve') || s.includes('ir') || s.includes('pup')) {
      bg = 'bg-purple-950/70 text-purple-300 border-purple-800/60';
    } else if (s.includes('susp')) {
      bg = 'bg-red-950/70 text-red-300 border-red-800/60';
    }

    return (
      <span
        title={primary.shortComment || primary.longComment || status}
        className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded border ${bg} leading-none ml-1.5 flex-shrink-0 cursor-help`}
      >
        {status}
      </span>
    );
  };

  // Single player card in depth table
  const renderPlayer = (p?: DepthChartAthlete) => {
    if (!p) {
      return <span className="text-gray-600 font-mono text-xs select-none">—</span>;
    }

    const fallbackImg = `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${p.id}.png&w=72&h=52`;
    const photoUrl = p.headshot?.href || fallbackImg;

    return (
      <div className="flex items-center justify-between gap-1.5 group py-0.5 max-w-[280px]">
        <Link
          to={`/players/${p.id}`}
          className="inline-flex items-center gap-2 text-gray-200 hover:text-blue-400 min-w-0 transition-colors"
        >
          {/* Avatar with Headshot */}
          <div className="w-7 h-7 rounded-full bg-gray-800/90 overflow-hidden flex-shrink-0 border border-gray-700/80 shadow-inner">
            <img
              src={photoUrl}
              alt=""
              loading="lazy"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== fallbackImg) {
                  target.src = fallbackImg;
                } else {
                  target.style.display = 'none';
                }
              }}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Jersey and Name */}
          <div className="flex items-baseline gap-1 truncate">
            {p.jersey && (
              <span className="text-[11px] font-mono text-gray-400 font-semibold flex-shrink-0">
                #{p.jersey}
              </span>
            )}
            <span className="truncate text-xs sm:text-sm font-medium group-hover:underline">
              {p.displayName || p.shortName}
            </span>
          </div>
        </Link>

        {/* Injury status badge if any */}
        {renderInjuryBadge(p.injuries)}
      </div>
    );
  };

  // Reserves / 4th String+ renderer
  const renderReserves = (reserves: DepthChartAthlete[]) => {
    if (!reserves || reserves.length === 0) {
      return <span className="text-gray-600 font-mono text-xs select-none">—</span>;
    }

    return (
      <div className="flex flex-wrap items-center gap-1.5 py-0.5">
        {reserves.map((p) => {
          const hasInj = p.injuries && p.injuries.length > 0;
          return (
            <Link
              key={p.id}
              to={`/players/${p.id}`}
              className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-md border transition-colors ${
                hasInj
                  ? 'bg-rose-950/40 text-rose-300 border-rose-800/50 hover:bg-rose-900/60'
                  : 'bg-gray-800/60 text-gray-300 border-gray-700/60 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {p.jersey ? `#${p.jersey} ` : ''}
              {p.shortName || p.displayName}
              {hasInj && <span className="ml-1 text-[9px] font-bold text-rose-400">({p.injuries![0].status})</span>}
            </Link>
          );
        })}
      </div>
    );
  };

  // Depth Chart Table renderer per group (Offense / Defense / Special Teams)
  const renderGroupTable = (grp: DepthChartGroup) => {
    if (!grp.positions || grp.positions.length === 0) return null;

    const accentColor =
      grp.category === 'Offense'
        ? 'from-blue-600 to-indigo-600'
        : grp.category === 'Defense'
        ? 'from-rose-600 to-amber-600'
        : 'from-emerald-600 to-teal-600';

    return (
      <div key={grp.id} className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-lg">
        {/* Unit Group Header */}
        <div className="bg-gray-950/90 px-4 sm:px-6 py-3.5 border-b border-gray-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className={`w-3 h-3 rounded-full bg-gradient-to-tr ${accentColor} shadow`} />
            <h2 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
              {grp.category} <span className="text-xs font-normal text-gray-400 font-mono">({grp.name})</span>
            </h2>
          </div>
          <span className="text-xs font-mono font-medium text-gray-400 bg-gray-800/80 px-2.5 py-1 rounded-full border border-gray-700/60">
            {grp.positions.length} Positions
          </span>
        </div>

        {/* Scrollable Table */}
        <div className="overflow-x-auto touch-scroll">
          <table className="w-full text-left text-xs sm:text-sm min-w-[760px]">
            <thead className="bg-gray-950/70 text-gray-400 border-b border-gray-800/80 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 sm:px-5 py-3 w-28 font-semibold">POS</th>
                <th className="px-4 sm:px-5 py-3 font-semibold text-blue-400/90">1st String (Starter)</th>
                <th className="px-4 sm:px-5 py-3 font-semibold text-gray-300">2nd String (Backup)</th>
                <th className="px-4 sm:px-5 py-3 font-semibold text-gray-300">3rd String (Depth)</th>
                <th className="px-4 sm:px-5 py-3 font-semibold text-gray-400">Reserves (4th+)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {grp.positions.map((posRow: DepthChartPosition, idx: number) => {
                const s1 = posRow.athletes[0];
                const s2 = posRow.athletes[1];
                const s3 = posRow.athletes[2];
                const reserves = posRow.athletes.slice(3);

                return (
                  <tr
                    key={posRow.key || idx}
                    className="hover:bg-gray-800/40 transition-colors group/row"
                  >
                    {/* Position Label Column */}
                    <td className="px-4 sm:px-5 py-3.5 align-middle">
                      <div className="flex flex-col">
                        <span className="font-extrabold font-mono text-white text-xs sm:text-sm tracking-wide">
                          {posRow.position.abbreviation}
                        </span>
                        <span className="text-[10px] text-gray-400 truncate max-w-[100px] leading-tight mt-0.5">
                          {posRow.position.displayName}
                        </span>
                      </div>
                    </td>

                    {/* 1st String */}
                    <td className="px-4 sm:px-5 py-3.5 align-middle bg-blue-950/10">
                      {renderPlayer(s1)}
                    </td>

                    {/* 2nd String */}
                    <td className="px-4 sm:px-5 py-3.5 align-middle">
                      {renderPlayer(s2)}
                    </td>

                    {/* 3rd String */}
                    <td className="px-4 sm:px-5 py-3.5 align-middle">
                      {renderPlayer(s3)}
                    </td>

                    {/* Reserves */}
                    <td className="px-4 sm:px-5 py-3.5 align-middle">
                      {renderReserves(reserves)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const primaryColor = currentTeam?.primaryColor || '#1e3a8a';
  const colorHex = primaryColor.startsWith('#') ? primaryColor : `#${primaryColor}`;

  return (
    <div className="app-container py-4 sm:py-8 text-white font-sans space-y-6">
      {/* ── 1. Header Banner & Team Selector ───────────────────────────── */}
      <div
        className="rounded-3xl p-5 sm:p-7 border border-gray-800 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all"
        style={{
          background: `linear-gradient(135deg, ${colorHex}26 0%, #111827 65%, #030712 100%)`,
          borderColor: `${colorHex}44`,
        }}
      >
        <div className="flex items-center gap-4 sm:gap-5 z-10">
          {currentTeam && (
            <img
              src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/${currentTeam.abbreviation.toLowerCase()}.png&w=96&h=96`}
              alt={currentTeam.name}
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain p-2 rounded-2xl bg-black/40 border border-white/10 shadow-lg flex-shrink-0"
            />
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/30">
                Official 2026 Season
              </span>
              {currentTeam && (
                <span className="text-[11px] font-mono text-gray-400">
                  {currentTeam.conference} {currentTeam.division}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              {currentTeam ? `${currentTeam.name} Depth Chart` : 'NFL Depth Charts'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-300/80 mt-1">
              100% vetted official starters, backups, and depth ranks across Offense, Defense & Special Teams.
            </p>
          </div>
        </div>

        {/* Team Dropdown Selector & Quick Links */}
        <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-3 z-10 w-full md:w-auto">
          <label htmlFor="team-select" className="sr-only">Select NFL Team</label>
          <select
            id="team-select"
            value={selectedTeamId}
            onChange={(e) => handleSelectTeam(e.target.value)}
            className="w-full md:w-64 bg-gray-950/90 border border-gray-700/80 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold shadow-inner min-h-[44px]"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.city} {t.name} ({t.abbreviation})
              </option>
            ))}
          </select>

          {currentTeam && (
            <div className="flex items-center gap-2 text-xs">
              <Link
                to={`/teams/${currentTeam.id}`}
                className="text-gray-300 hover:text-white bg-black/40 hover:bg-black/60 px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
              >
                Team Profile →
              </Link>
              <Link
                to={`/players?team=${currentTeam.id}`}
                className="text-gray-300 hover:text-white bg-black/40 hover:bg-black/60 px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
              >
                Full Roster →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. Category Tabs & Search Controls ─────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 p-3 sm:p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-md">
        {/* Category Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-gray-950 p-1 rounded-xl border border-gray-800/80 overflow-x-auto touch-scroll">
          {(['ALL', 'Offense', 'Defense', 'Special Teams'] as const).map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all flex-shrink-0 min-h-[38px] ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                {cat === 'ALL' ? 'All Units' : cat}
              </button>
            );
          })}
        </div>

        {/* Search input & Injury toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search player or pos (e.g. QB, Rodgers)..."
              className="w-full bg-gray-950 border border-gray-800 text-white placeholder-gray-500 rounded-xl pl-8 pr-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[38px]"
            />
            <span className="absolute left-2.5 top-2.5 text-gray-500 text-xs">🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-gray-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={() => setInjuriesOnly(!injuriesOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all min-h-[38px] ${
              injuriesOnly
                ? 'bg-rose-950/80 text-rose-300 border-rose-700/80 shadow'
                : 'bg-gray-950 text-gray-400 border-gray-800 hover:text-white hover:bg-gray-850'
            }`}
          >
            <span>🚑</span>
            <span>Injured Only</span>
          </button>
        </div>
      </div>

      {/* ── 3. Content States (Loading, Error, Tables) ──────────────────── */}
      {loading && (
        <div className="space-y-6 animate-pulse">
          <div className="h-64 bg-gray-900 rounded-2xl border border-gray-800"></div>
          <div className="h-64 bg-gray-900 rounded-2xl border border-gray-800"></div>
        </div>
      )}

      {error && (
        <div className="text-center py-12 bg-red-950/20 border border-red-800/40 rounded-2xl p-6">
          <p className="text-red-400 text-sm font-semibold mb-3">⚠️ {error}</p>
          <button
            onClick={() => setSelectedTeamId((prev) => prev)}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Retry Loading Depth Chart
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-6">
          {filteredGroups.length > 0 ? (
            filteredGroups.map((grp) => renderGroupTable(grp))
          ) : (
            <div className="text-center py-16 bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-3">
              <p className="text-gray-400 text-base font-semibold">
                No depth chart positions matched your filter.
              </p>
              {(searchQuery || injuriesOnly || activeCategory !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setInjuriesOnly(false);
                    setActiveCategory('ALL');
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Reset Filters
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
