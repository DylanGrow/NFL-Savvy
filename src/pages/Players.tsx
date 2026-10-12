import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { getSalary, formatSalary } from '../lib/salary';
import { Skeleton } from '../components/ui/Skeleton';
import { fetchTeamsData } from '../lib/data';
import type { Team } from '../types';

const POSITIONS = ['ALL', 'QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K'] as const;

const POSITION_GROUP_MAP: Record<string, string[]> = {
  QB: ['QB'],
  RB: ['RB', 'FB', 'HB'],
  WR: ['WR'],
  TE: ['TE'],
  OL: ['OL', 'OT', 'OG', 'G', 'C', 'LT', 'LG', 'RG', 'RT', 'T'],
  DL: ['DL', 'DE', 'DT', 'NT', 'EDGE', 'LDE', 'RDE', 'LDT', 'RDT'],
  LB: ['LB', 'ILB', 'OLB', 'MLB', 'WLB', 'SLB', 'LILB', 'RILB'],
  CB: ['CB', 'LCB', 'RCB', 'NB', 'DB'],
  S: ['S', 'SS', 'FS', 'SAF', 'DB'],
  K: ['K', 'PK', 'P', 'LS', 'H'],
};

export default function Players() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const [positionFilter, setPositionFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [sortBy, setSortBy] = useState<'Name' | 'Position' | 'Cap Hit' | 'Age'>('Name');
  const [sortDesc, setSortDesc] = useState(false);

  useEffect(() => {
    document.title = 'Players | NFL Hub';
    fetchTeamsData()
      .then((data: Team[]) => {
        setTeams(data);
        const urlTeam = searchParams.get('team')?.trim().toLowerCase();
        if (urlTeam) {
          const matched =
            data.find((t) => t.id.toLowerCase() === urlTeam || String(t.espnId).toLowerCase() === urlTeam) ||
            data.find((t) => t.abbreviation.toLowerCase() === urlTeam) ||
            data.find((t) => t.name.toLowerCase().includes(urlTeam));
          if (matched) {
            setSelectedTeam(matched.id);
            return;
          }
        }
        if (data.length > 0) setSelectedTeam(data[0].id);
      })
      .catch(() => {});
  }, [searchParams]);

  const handleSelectTeam = (id: string) => {
    setSelectedTeam(id);
    setSearchParams({ team: id });
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(handler);
  }, [search]);

  const loadRoster = useCallback(async () => {
    if (!selectedTeam) return;
    setLoading(true);
    setError(false);
    try {
      const data = await api.fetchRoster(selectedTeam);
      const rawItems = (data?.athletes || []).flatMap((g: any) => g.items || []);
      // Deduplicate by player ID
      const seen = new Set<string>();
      const uniquePlayers = rawItems.filter((p: any) => {
        if (!p?.id || seen.has(String(p.id))) return false;
        seen.add(String(p.id));
        return true;
      });
      setRoster(uniquePlayers);
    } catch {
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
      const allowed = POSITION_GROUP_MAP[positionFilter] || [positionFilter];
      result = result.filter((p) => {
        const abbr = (p.position?.abbreviation || '').toUpperCase();
        return allowed.includes(abbr);
      });
    }
    if (debouncedSearch) {
      const lower = debouncedSearch.toLowerCase();
      result = result.filter(
        (p) =>
          (p.fullName || p.displayName || '').toLowerCase().includes(lower) ||
          (p.college?.name || '').toLowerCase().includes(lower) ||
          String(p.jersey || '') === lower.replace('#', '')
      );
    }
    return [...result].sort((a, b) => {
      let valA: any;
      let valB: any;
      if (sortBy === 'Name') {
        valA = a.fullName || a.displayName || '';
        valB = b.fullName || b.displayName || '';
      } else if (sortBy === 'Position') {
        valA = a.position?.abbreviation || '';
        valB = b.position?.abbreviation || '';
      } else if (sortBy === 'Age') {
        valA = a.age || 99;
        valB = b.age || 99;
      } else {
        valA = getSalary(a.id)?.capHit || 0;
        valB = getSalary(b.id)?.capHit || 0;
      }

      if (valA < valB) return sortDesc ? 1 : -1;
      if (valA > valB) return sortDesc ? -1 : 1;
      return 0;
    });
  }, [roster, positionFilter, debouncedSearch, sortBy, sortDesc]);

  const toggleSort = (col: 'Name' | 'Position' | 'Cap Hit' | 'Age') => {
    if (sortBy === col) setSortDesc(!sortDesc);
    else {
      setSortBy(col);
      setSortDesc(col === 'Cap Hit');
    }
  };

  const getInjuryBadge = (status: string) => {
    if (!status || status.toLowerCase() === 'active') {
      return <span className="text-emerald-400/80 text-xs font-medium">Active</span>;
    }
    const s = status.toLowerCase();
    let cls = 'bg-amber-950/70 text-amber-300 border-amber-700/60';
    if (s.includes('out') || s.includes('doubtful')) {
      cls = 'bg-rose-950/70 text-rose-300 border-rose-700/60';
    } else if (s.includes('reserve') || s.includes('ir') || s.includes('pup')) {
      cls = 'bg-purple-950/70 text-purple-300 border-purple-700/60';
    }
    return (
      <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded border ${cls}`}>
        {status}
      </span>
    );
  };

  const activeTeamObj = useMemo(() => teams.find((t) => t.id === selectedTeam), [teams, selectedTeam]);

  return (
    <div className="app-container py-4 sm:py-8 min-h-screen text-gray-100 font-sans space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-900 border border-gray-800 p-4 sm:p-6 rounded-2xl shadow-lg">
        <div className="flex items-center gap-4">
          {activeTeamObj && (
            <img
              src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/${activeTeamObj.abbreviation.toLowerCase()}.png&w=72&h=72`}
              alt={activeTeamObj.name}
              className="w-12 h-12 sm:w-14 sm:h-14 object-contain bg-gray-950 p-1.5 rounded-xl border border-gray-800"
            />
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {activeTeamObj ? `${activeTeamObj.name} Roster` : 'Players Database'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              {filteredRoster.length} Players • Deep 2026 rosters, cap hits, injury designations & profiles
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <select
            value={selectedTeam}
            onChange={(e) => handleSelectTeam(e.target.value)}
            className="w-full sm:w-60 bg-gray-950 text-white px-4 py-2.5 rounded-xl border border-gray-800 text-sm font-semibold focus:ring-2 focus:ring-blue-500 min-h-[44px]"
          >
            <option value="" disabled>
              Select Team
            </option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.city} {t.name} ({t.abbreviation})
              </option>
            ))}
          </select>
          {activeTeamObj && (
            <Link
              to={`/depth-charts?team=${activeTeamObj.id}`}
              className="px-3.5 py-2.5 bg-gray-950 hover:bg-gray-800 text-blue-400 border border-gray-800 rounded-xl text-xs font-bold text-center whitespace-nowrap flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              <span>📋</span> Depth Chart
            </Link>
          )}
        </div>
      </div>

      {/* Position Filter Chips & Search Input */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex overflow-x-auto touch-scroll gap-1.5 pb-1 scrollbar-none">
          {POSITIONS.map((pos) => (
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

        <div className="w-full md:w-72 relative">
          <input
            type="text"
            placeholder="Search player name, #jersey, or college..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900 text-white pl-9 pr-4 py-2.5 rounded-xl border border-gray-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 min-h-[40px]"
          />
          <span className="absolute left-3 top-2.5 text-gray-500 text-xs">🔍</span>
        </div>
      </div>

      {error ? (
        <div className="bg-red-900/30 border border-red-500/40 rounded-2xl p-8 text-center">
          <p className="text-red-200 mb-4">Failed to load roster data.</p>
          <button
            onClick={loadRoster}
            className="bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-xl transition touch-target"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto touch-scroll bg-gray-900 rounded-2xl shadow-lg border border-gray-800">
          <table className="w-full text-left border-collapse min-w-[700px] text-xs sm:text-sm">
            <thead>
              <tr className="bg-gray-950 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-800">
                <th className="p-3.5 w-16">Photo</th>
                <th className="p-3.5 w-12">#</th>
                <th
                  className="p-3.5 cursor-pointer hover:text-white select-none"
                  onClick={() => toggleSort('Name')}
                >
                  Name {sortBy === 'Name' && (sortDesc ? '↓' : '↑')}
                </th>
                <th
                  className="p-3.5 cursor-pointer hover:text-white select-none"
                  onClick={() => toggleSort('Position')}
                >
                  Pos {sortBy === 'Position' && (sortDesc ? '↓' : '↑')}
                </th>
                <th
                  className="p-3.5 cursor-pointer hover:text-white select-none"
                  onClick={() => toggleSort('Age')}
                >
                  Age {sortBy === 'Age' && (sortDesc ? '↓' : '↑')}
                </th>
                <th className="p-3.5">Ht / Wt</th>
                <th className="p-3.5">College</th>
                <th
                  className="p-3.5 cursor-pointer hover:text-white select-none"
                  onClick={() => toggleSort('Cap Hit')}
                >
                  Cap Hit {sortBy === 'Cap Hit' && (sortDesc ? '↓' : '↑')}
                </th>
                <th className="p-3.5">Status</th>
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
                    <td className="p-4"><Skeleton className="w-20 h-4" /></td>
                    <td className="p-4"><Skeleton className="w-24 h-4" /></td>
                    <td className="p-4"><Skeleton className="w-16 h-4" /></td>
                    <td className="p-4"><Skeleton className="w-20 h-4" /></td>
                  </tr>
                ))
              ) : filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-500">
                    No players found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredRoster.map((player) => {
                  const salary = getSalary(player.id);
                  const capHitDisplay = salary ? formatSalary(salary.capHit) : '—';
                  const injuryStatus =
                    player.injuries?.[0]?.status || player.status?.type?.shortDetail || 'Active';

                  return (
                    <tr key={player.id} className="hover:bg-gray-800/50 transition-colors group">
                      <td className="p-3.5">
                        <img
                          src={`https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${player.id}.png&w=48&h=35`}
                          alt=""
                          className="w-11 h-8 object-cover bg-gray-800 rounded-md border border-gray-700"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </td>
                      <td className="p-3.5 font-mono text-gray-400">{player.jersey ? `#${player.jersey}` : '-'}</td>
                      <td className="p-3.5 font-semibold">
                        <Link to={`/players/${player.id}`} className="text-blue-400 hover:text-blue-300 hover:underline">
                          {player.fullName || player.displayName}
                        </Link>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-gray-300">{player.position?.abbreviation}</td>
                      <td className="p-3.5 text-gray-400">{player.age || '-'}</td>
                      <td className="p-3.5 text-gray-400 whitespace-nowrap">
                        {player.displayHeight ? `${player.displayHeight} / ${player.displayWeight}` : '-'}
                      </td>
                      <td className="p-3.5 text-gray-400 max-w-[140px] truncate">{player.college?.name || '-'}</td>
                      <td className="p-3.5 font-mono text-gray-200">{capHitDisplay}</td>
                      <td className="p-3.5">{getInjuryBadge(injuryStatus)}</td>
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
