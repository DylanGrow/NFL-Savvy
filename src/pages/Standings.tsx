import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { fetchTeamsData } from '../lib/data';
import type { Team } from '../types';

interface ParsedEntry {
  team: any;
  stats: Record<string, any>;
  division: string;
  conference: string;
  seed: number;
}

const SkeletonRow = () => (
  <div className="animate-pulse flex items-center bg-gray-800 h-10 w-full mb-1.5 rounded-lg"></div>
);

export default function Standings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conferences, setConferences] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'division' | 'conference'>('division');
  const [teamMetaMap, setTeamMetaMap] = useState<Map<string, Team>>(new Map());

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [standingsRes, teamsRes] = await Promise.all([
        api.fetchStandings().catch(() => fetch('https://site.api.espn.com/apis/v2/sports/football/nfl/standings?season=2026').then(r => r.json())),
        fetchTeamsData().catch(() => [] as Team[])
      ]);

      const map = new Map<string, Team>();
      teamsRes.forEach(t => {
        map.set(String(t.id), t);
        if (t.espnId) map.set(String(t.espnId), t);
      });
      setTeamMetaMap(map);

      const children = standingsRes?.children || [];
      setConferences(children);
    } catch (err: any) {
      setError(err?.message || 'Failed to load standings data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = '2026 Standings | NFL Savvy';
    loadData();
  }, []);

  const parseEntries = (entries: any[] = []): ParsedEntry[] => {
    return entries.map(entry => {
      const t = entry.team;
      const meta = teamMetaMap.get(String(t?.id));
      const stats: Record<string, any> = {};

      (entry.stats || []).forEach((s: any) => {
        if (s.name) stats[s.name] = s.displayValue ?? s.value;
        if (s.abbreviation) stats[s.abbreviation] = s.displayValue ?? s.value;
      });

      const seed = Number(stats.playoffSeed || stats.SEED || 99);

      return {
        team: t,
        stats,
        division: meta?.division || 'Other',
        conference: meta?.conference || (t?.displayName?.includes('AFC') ? 'AFC' : 'NFC'),
        seed,
      };
    });
  };

  if (loading) {
    return (
      <div className="app-container py-4 sm:py-8 text-gray-100 max-w-7xl mx-auto space-y-6">
        <div className="h-10 bg-gray-800 animate-pulse rounded-xl w-1/3"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-2"><SkeletonRow/><SkeletonRow/><SkeletonRow/><SkeletonRow/><SkeletonRow/></div>
          <div className="space-y-2"><SkeletonRow/><SkeletonRow/><SkeletonRow/><SkeletonRow/><SkeletonRow/></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container py-12 text-center text-red-400">
        <p className="text-base font-semibold">{error}</p>
        <button 
          onClick={loadData} 
          className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const divisionOrder = ['East', 'North', 'South', 'West'];

  return (
    <div className="app-container py-4 sm:py-8 text-gray-100 font-sans space-y-6">
      {/* Header and View Controls */}
      <div className="bg-gray-900 border border-gray-800 p-4 sm:p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <span>🏆</span> 2026 NFL Standings
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Official divisional race, playoff seeding, point differential, and streaks
          </p>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800 self-stretch sm:self-auto">
          <button
            onClick={() => setViewMode('division')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition touch-target min-h-[40px] ${
              viewMode === 'division' 
                ? 'bg-blue-600 text-white shadow' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            By Division
          </button>
          <button
            onClick={() => setViewMode('conference')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition touch-target min-h-[40px] ${
              viewMode === 'conference' 
                ? 'bg-blue-600 text-white shadow' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Playoff Picture
          </button>
        </div>
      </div>

      {/* Main Standings Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
        {conferences.map((conf, confIdx) => {
          const confName = conf.name || (confIdx === 0 ? 'American Football Conference' : 'National Football Conference');
          const isAfc = confName.includes('AFC') || confName.includes('American');
          const confShort = isAfc ? 'AFC' : 'NFC';
          const entries = parseEntries(conf.standings?.entries || []);

          return (
            <div key={confIdx} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-6">
              {/* Conference Banner */}
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                  <span className={`w-3.5 h-3.5 rounded-full ${isAfc ? 'bg-red-500 shadow-red-500/50 shadow-md' : 'bg-blue-500 shadow-blue-500/50 shadow-md'}`} />
                  {confName}
                </h2>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded ${isAfc ? 'bg-red-950/80 text-red-300 border border-red-800/60' : 'bg-blue-950/80 text-blue-300 border border-blue-800/60'}`}>
                  {confShort}
                </span>
              </div>

              {/* Mode 1: By Division */}
              {viewMode === 'division' && (
                <div className="space-y-6">
                  {divisionOrder.map(divName => {
                    const divTeams = entries.filter(e => e.division.toLowerCase() === divName.toLowerCase());
                    if (divTeams.length === 0) return null;

                    return (
                      <div key={divName} className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 bg-gray-950/80 border border-gray-800 px-2.5 py-1 rounded-md">
                            {confShort} {divName}
                          </h3>
                        </div>

                        <div className="overflow-x-auto touch-scroll">
                          <table className="w-full text-sm text-left min-w-[500px]">
                            <thead className="text-[11px] text-gray-400 uppercase bg-gray-950/90 rounded border-b border-gray-800">
                              <tr>
                                <th className="px-3 py-2 text-left">Team</th>
                                <th className="px-2 py-2 text-right font-mono">W</th>
                                <th className="px-2 py-2 text-right font-mono">L</th>
                                <th className="px-2 py-2 text-right font-mono">T</th>
                                <th className="px-2 py-2 text-right font-mono">PCT</th>
                                <th className="px-2 py-2 text-right font-mono hidden sm:table-cell">DIFF</th>
                                <th className="px-2 py-2 text-right font-mono hidden sm:table-cell">STRK</th>
                                <th className="px-2 py-2 text-right font-mono">DIV</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50">
                              {divTeams.map((entry, idx) => {
                                const t = entry.team;
                                const s = entry.stats;
                                const isLeader = idx === 0;

                                return (
                                  <tr
                                    key={t?.id || idx}
                                    tabIndex={0}
                                    role="button"
                                    aria-label={`View ${t?.displayName} roster and details`}
                                    onClick={() => navigate(`/teams/${t?.id}`)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        navigate(`/teams/${t?.id}`);
                                      }
                                    }}
                                    className="hover:bg-gray-800/60 cursor-pointer transition focus-visible:bg-gray-800 focus-visible:outline-none min-h-[44px]"
                                  >
                                    <td className="px-3 py-2.5 flex items-center gap-2.5">
                                      {isLeader ? (
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" title="Division Leader" />
                                      ) : (
                                        <div className="w-2 h-2 rounded-full bg-transparent flex-shrink-0" />
                                      )}
                                      {t?.logos?.[0]?.href && (
                                        <img src={t.logos[0].href} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
                                      )}
                                      <span className="font-semibold text-gray-200 text-xs sm:text-sm truncate">
                                        {t?.displayName || t?.name || t?.abbreviation}
                                      </span>
                                    </td>
                                    <td className="px-2 py-2.5 text-right font-mono text-xs sm:text-sm font-bold text-gray-100">{s.wins ?? s.W ?? 0}</td>
                                    <td className="px-2 py-2.5 text-right font-mono text-xs sm:text-sm text-gray-300">{s.losses ?? s.L ?? 0}</td>
                                    <td className="px-2 py-2.5 text-right font-mono text-xs sm:text-sm text-gray-400">{s.ties ?? s.T ?? 0}</td>
                                    <td className="px-2 py-2.5 text-right font-mono text-xs sm:text-sm font-semibold text-blue-400">{s.winPercent ?? s.PCT ?? '.000'}</td>
                                    <td className="px-2 py-2.5 text-right font-mono text-xs hidden sm:table-cell text-gray-300">{s.pointDifferential ?? s.DIFF ?? s.differential ?? '0'}</td>
                                    <td className="px-2 py-2.5 text-right font-mono text-xs hidden sm:table-cell text-emerald-400 font-semibold">{s.streak ?? s.STRK ?? '-'}</td>
                                    <td className="px-2 py-2.5 text-right font-mono text-xs text-gray-400">{s.divisionRecord ?? s.DIV ?? '-'}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Mode 2: Playoff Picture (1 to 16 ranked) */}
              {viewMode === 'conference' && (
                <div className="overflow-x-auto touch-scroll">
                  <table className="w-full text-sm text-left min-w-[500px]">
                    <thead className="text-[11px] text-gray-400 uppercase bg-gray-950/90 rounded border-b border-gray-800">
                      <tr>
                        <th className="px-2 py-2 text-center w-8">Seed</th>
                        <th className="px-3 py-2 text-left">Team</th>
                        <th className="px-2 py-2 text-right font-mono">W-L-T</th>
                        <th className="px-2 py-2 text-right font-mono">PCT</th>
                        <th className="px-2 py-2 text-right font-mono hidden sm:table-cell">DIFF</th>
                        <th className="px-2 py-2 text-right font-mono">STRK</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {[...entries].sort((a, b) => a.seed - b.seed).map((entry, idx) => {
                        const t = entry.team;
                        const s = entry.stats;
                        const seed = entry.seed !== 99 ? entry.seed : idx + 1;
                        const isDivLeader = seed <= 4;
                        const isWildcard = seed > 4 && seed <= 7;
                        const isCutoffLine = seed === 7;

                        return (
                          <tr
                            key={t?.id || idx}
                            tabIndex={0}
                            role="button"
                            aria-label={`View ${t?.displayName} roster and details`}
                            onClick={() => navigate(`/teams/${t?.id}`)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                navigate(`/teams/${t?.id}`);
                              }
                            }}
                            className={`hover:bg-gray-800/60 cursor-pointer transition focus-visible:bg-gray-800 focus-visible:outline-none min-h-[44px] ${
                              isCutoffLine ? 'border-b-2 border-dashed border-emerald-500/60' : ''
                            }`}
                          >
                            <td className="px-2 py-2.5 text-center font-mono font-bold text-xs">
                              {isDivLeader ? (
                                <span className="inline-block bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded px-1.5 py-0.5 text-[10px]">
                                  #{seed}
                                </span>
                              ) : isWildcard ? (
                                <span className="inline-block bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded px-1.5 py-0.5 text-[10px]">
                                  #{seed}
                                </span>
                              ) : (
                                <span className="text-gray-500">#{seed}</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 flex items-center gap-2.5">
                              {t?.logos?.[0]?.href && (
                                <img src={t.logos[0].href} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
                              )}
                              <div>
                                <span className="font-semibold text-gray-200 text-xs sm:text-sm">
                                  {t?.displayName || t?.name || t?.abbreviation}
                                </span>
                                <span className="text-[10px] text-gray-500 ml-1.5 hidden xs:inline">
                                  ({entry.division})
                                </span>
                              </div>
                            </td>
                            <td className="px-2 py-2.5 text-right font-mono text-xs sm:text-sm font-bold text-gray-100">
                              {s.wins ?? s.W ?? 0}-{s.losses ?? s.L ?? 0}{s.ties ? `-${s.ties}` : ''}
                            </td>
                            <td className="px-2 py-2.5 text-right font-mono text-xs sm:text-sm font-semibold text-blue-400">
                              {s.winPercent ?? s.PCT ?? '.000'}
                            </td>
                            <td className="px-2 py-2.5 text-right font-mono text-xs hidden sm:table-cell text-gray-300">
                              {s.pointDifferential ?? s.DIFF ?? s.differential ?? '0'}
                            </td>
                            <td className="px-2 py-2.5 text-right font-mono text-xs text-emerald-400 font-semibold">
                              {s.streak ?? s.STRK ?? '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500 px-1 border-t border-gray-800/80 pt-2">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" /> Seeds 1–4: Division Leaders
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" /> Seeds 5–7: Wild Card
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
