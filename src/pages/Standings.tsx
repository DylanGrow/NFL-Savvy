import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { fetchStandingsData } from '../lib/data';

interface ParsedEntry {
  team: any;
  stats: Record<string, any>;
  division: string;
  conference: string;
  seed: number;
}

/** Complete 32-team NFL division and conference mapping */
const NFL_TEAM_DIVISIONS: Record<string, { conference: 'AFC' | 'NFC'; division: 'East' | 'North' | 'South' | 'West'; abbr: string }> = {
  // AFC East
  '2':  { conference: 'AFC', division: 'East',  abbr: 'BUF' },
  '15': { conference: 'AFC', division: 'East',  abbr: 'MIA' },
  '17': { conference: 'AFC', division: 'East',  abbr: 'NE' },
  '20': { conference: 'AFC', division: 'East',  abbr: 'NYJ' },
  // AFC North
  '33': { conference: 'AFC', division: 'North', abbr: 'BAL' },
  '4':  { conference: 'AFC', division: 'North', abbr: 'CIN' },
  '5':  { conference: 'AFC', division: 'North', abbr: 'CLE' },
  '23': { conference: 'AFC', division: 'North', abbr: 'PIT' },
  // AFC South
  '34': { conference: 'AFC', division: 'South', abbr: 'HOU' },
  '11': { conference: 'AFC', division: 'South', abbr: 'IND' },
  '30': { conference: 'AFC', division: 'South', abbr: 'JAX' },
  '10': { conference: 'AFC', division: 'South', abbr: 'TEN' },
  // AFC West
  '7':  { conference: 'AFC', division: 'West',  abbr: 'DEN' },
  '12': { conference: 'AFC', division: 'West',  abbr: 'KC' },
  '13': { conference: 'AFC', division: 'West',  abbr: 'LV' },
  '24': { conference: 'AFC', division: 'West',  abbr: 'LAC' },
  // NFC East
  '6':  { conference: 'NFC', division: 'East',  abbr: 'DAL' },
  '19': { conference: 'NFC', division: 'East',  abbr: 'NYG' },
  '21': { conference: 'NFC', division: 'East',  abbr: 'PHI' },
  '28': { conference: 'NFC', division: 'East',  abbr: 'WSH' },
  // NFC North
  '3':  { conference: 'NFC', division: 'North', abbr: 'CHI' },
  '8':  { conference: 'NFC', division: 'North', abbr: 'DET' },
  '9':  { conference: 'NFC', division: 'North', abbr: 'GB' },
  '16': { conference: 'NFC', division: 'North', abbr: 'MIN' },
  // NFC South
  '1':  { conference: 'NFC', division: 'South', abbr: 'ATL' },
  '29': { conference: 'NFC', division: 'South', abbr: 'CAR' },
  '18': { conference: 'NFC', division: 'South', abbr: 'NO' },
  '27': { conference: 'NFC', division: 'South', abbr: 'TB' },
  // NFC West
  '22': { conference: 'NFC', division: 'West',  abbr: 'ARI' },
  '14': { conference: 'NFC', division: 'West',  abbr: 'LAR' },
  '25': { conference: 'NFC', division: 'West',  abbr: 'SF' },
  '26': { conference: 'NFC', division: 'West',  abbr: 'SEA' },
};

// Also index by abbreviation
const ABBR_TO_DIVISION: Record<string, { conference: 'AFC' | 'NFC'; division: 'East' | 'North' | 'South' | 'West' }> = {};
Object.entries(NFL_TEAM_DIVISIONS).forEach(([id, meta]) => {
  ABBR_TO_DIVISION[meta.abbr.toUpperCase()] = { conference: meta.conference, division: meta.division };
  ABBR_TO_DIVISION[id] = { conference: meta.conference, division: meta.division };
});

const SkeletonRow = () => (
  <div className="animate-pulse flex items-center bg-gray-800 h-10 w-full mb-1.5 rounded-lg"></div>
);

export default function Standings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conferences, setConferences] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'division' | 'conference' | 'bracket'>('division');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      let standingsRes: any = null;

      try {
        standingsRes = await api.fetchStandings();
      } catch {
        // Fallback to local 2026 standings JSON
        standingsRes = await fetchStandingsData();
      }

      if (!standingsRes?.children || standingsRes.children.length === 0) {
        standingsRes = await fetchStandingsData();
      }

      const children = standingsRes?.children || [];
      if (children.length === 0) {
        throw new Error('Unable to load standings records');
      }
      setConferences(children);
    } catch (err: any) {
      try {
        const fallback = await fetchStandingsData();
        if (fallback?.children && fallback.children.length > 0) {
          setConferences(fallback.children);
          return;
        }
      } catch {}
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
      const tid = String(t?.id || '');
      const tabbr = String(t?.abbreviation || '').toUpperCase();

      const meta = NFL_TEAM_DIVISIONS[tid] || ABBR_TO_DIVISION[tabbr] || ABBR_TO_DIVISION[tid];
      const stats: Record<string, any> = {};

      (entry.stats || []).forEach((s: any) => {
        if (s.name) stats[s.name] = s.displayValue ?? s.value;
        if (s.abbreviation) stats[s.abbreviation] = s.displayValue ?? s.value;
      });

      const seed = Number(stats.playoffSeed || stats.SEED || 99);

      return {
        team: t,
        stats,
        division: meta?.division || 'East',
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

  if (error && conferences.length === 0) {
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
        <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800 self-stretch sm:self-auto overflow-x-auto">
          <button
            onClick={() => setViewMode('division')}
            className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition touch-target min-h-[40px] whitespace-nowrap ${
              viewMode === 'division' 
                ? 'bg-blue-600 text-white shadow' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            By Division
          </button>
          <button
            onClick={() => setViewMode('conference')}
            className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition touch-target min-h-[40px] whitespace-nowrap ${
              viewMode === 'conference' 
                ? 'bg-blue-600 text-white shadow' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Playoff Picture
          </button>
          <button
            onClick={() => setViewMode('bracket')}
            className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition touch-target min-h-[40px] whitespace-nowrap ${
              viewMode === 'bracket' 
                ? 'bg-blue-600 text-white shadow' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🏆 Playoff Bracket
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

                    // Sort division teams by win percentage, then wins, then differential
                    const sortedDivTeams = [...divTeams].sort((a, b) => {
                      const pctA = parseFloat(a.stats.winPercent ?? a.stats.PCT ?? '0');
                      const pctB = parseFloat(b.stats.winPercent ?? b.stats.PCT ?? '0');
                      if (pctB !== pctA) return pctB - pctA;
                      const winsA = parseInt(a.stats.wins ?? a.stats.W ?? '0', 10);
                      const winsB = parseInt(b.stats.wins ?? b.stats.W ?? '0', 10);
                      if (winsB !== winsA) return winsB - winsA;
                      const diffA = parseFloat(a.stats.pointDifferential ?? a.stats.DIFF ?? '0');
                      const diffB = parseFloat(b.stats.pointDifferential ?? b.stats.DIFF ?? '0');
                      return diffB - diffA;
                    });

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
                              {sortedDivTeams.map((entry, idx) => {
                                const t = entry.team;
                                const s = entry.stats;
                                const isLeader = idx === 0;
                                const strk = String(s.streak ?? s.STRK ?? '-');
                                const isWinStreak = strk.startsWith('W');

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
                                    <td className={`px-2 py-2.5 text-right font-mono text-xs hidden sm:table-cell font-semibold ${isWinStreak ? 'text-emerald-400' : 'text-gray-400'}`}>{strk}</td>
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
                        const strk = String(s.streak ?? s.STRK ?? '-');
                        const isWinStreak = strk.startsWith('W');

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
                            <td className={`px-2 py-2.5 text-right font-mono text-xs font-semibold ${isWinStreak ? 'text-emerald-400' : 'text-gray-400'}`}>
                              {strk}
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

              {/* Mode 3: Playoff Bracket & Matchups */}
              {viewMode === 'bracket' && (() => {
                const sorted = [...entries].sort((a, b) => a.seed - b.seed);
                const seed1 = sorted[0];
                const seed2 = sorted[1];
                const seed3 = sorted[2];
                const seed4 = sorted[3];
                const seed5 = sorted[4];
                const seed6 = sorted[5];
                const seed7 = sorted[6];
                const inTheHunt = sorted.slice(7, 11);

                const matchups = [
                  { highSeed: seed2, lowSeed: seed7, highNum: 2, lowNum: 7, label: 'Wild Card Game 1' },
                  { highSeed: seed3, lowSeed: seed6, highNum: 3, lowNum: 6, label: 'Wild Card Game 2' },
                  { highSeed: seed4, lowSeed: seed5, highNum: 4, lowNum: 5, label: 'Wild Card Game 3' },
                ];

                return (
                  <div className="space-y-4">
                    {/* #1 Seed Bye Card */}
                    {seed1 && (
                      <div className="bg-gradient-to-r from-emerald-950/40 via-gray-950 to-gray-900 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-md font-mono font-extrabold whitespace-nowrap">
                            #1 SEED
                          </span>
                          {seed1.team?.logos?.[0]?.href && (
                            <img src={seed1.team.logos[0].href} alt="" className="w-9 h-9 object-contain" />
                          )}
                          <div>
                            <h4 className="font-extrabold text-sm sm:text-base text-white">
                              {seed1.team?.displayName}
                            </h4>
                            <p className="text-[11px] text-emerald-400 font-mono">
                              {seed1.stats.wins ?? seed1.stats.W ?? 0}-{seed1.stats.losses ?? seed1.stats.L ?? 0} · First-Round Bye & Home-Field Advantage
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/teams/${seed1.team?.id}`)}
                          className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg text-xs font-semibold text-gray-200 transition"
                        >
                          Team Hub &rarr;
                        </button>
                      </div>
                    )}

                    {/* Matchup Cards */}
                    <div className="space-y-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
                        <span>Wild Card Weekend Projections</span>
                        <span className="text-[10px] text-gray-500 font-normal">Click Compare to simulate</span>
                      </div>

                      {matchups.map((m, mIdx) => {
                        if (!m.highSeed || !m.lowSeed) return null;
                        return (
                          <div
                            key={mIdx}
                            className="bg-gray-950/80 border border-gray-800 rounded-xl p-3.5 space-y-3 hover:border-gray-700 transition"
                          >
                            <div className="flex items-center justify-between text-[11px] text-gray-400 font-semibold border-b border-gray-850 pb-2">
                              <span className="text-gray-300 font-semibold">{m.label}</span>
                              <span className="text-blue-400 font-mono font-bold">#{m.lowNum} @ #{m.highNum}</span>
                            </div>

                            {/* Away (Low Seed) */}
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-mono font-bold">
                                  #{m.lowNum}
                                </span>
                                {m.lowSeed.team?.logos?.[0]?.href && (
                                  <img src={m.lowSeed.team.logos[0].href} alt="" className="w-5 h-5 object-contain" />
                                )}
                                <span className="font-semibold text-gray-200 truncate">
                                  {m.lowSeed.team?.displayName}
                                </span>
                              </div>
                              <span className="font-mono text-gray-400 text-xs font-bold">
                                {m.lowSeed.stats.wins ?? m.lowSeed.stats.W ?? 0}-{m.lowSeed.stats.losses ?? m.lowSeed.stats.L ?? 0}
                              </span>
                            </div>

                            {/* Home (High Seed) */}
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">
                                  #{m.highNum}
                                </span>
                                {m.highSeed.team?.logos?.[0]?.href && (
                                  <img src={m.highSeed.team.logos[0].href} alt="" className="w-5 h-5 object-contain" />
                                )}
                                <span className="font-semibold text-gray-200 truncate">
                                  {m.highSeed.team?.displayName}
                                </span>
                              </div>
                              <span className="font-mono text-gray-400 text-xs font-bold">
                                {m.highSeed.stats.wins ?? m.highSeed.stats.W ?? 0}-{m.highSeed.stats.losses ?? m.highSeed.stats.L ?? 0}
                              </span>
                            </div>

                            <div className="pt-2 border-t border-gray-850 flex items-center justify-between gap-2 text-xs">
                              <span className="text-[10px] text-gray-500">Host: #{m.highNum} {m.highSeed.team?.name}</span>
                              <button
                                onClick={() => navigate(`/comparator?mode=teams&teamA=${m.lowSeed.team?.id}&teamB=${m.highSeed.team?.id}`)}
                                className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                              >
                                ⚔️ Compare H2H
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* In The Hunt (Seeds #8 to #11) */}
                    {inTheHunt.length > 0 && (
                      <div className="bg-gray-950 border border-gray-800 rounded-xl p-3.5 space-y-2 mt-4">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                          <span>🎯</span> In The Hunt (Wild Card Chase)
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {inTheHunt.map((h, hIdx) => (
                            <div
                              key={h.team?.id || hIdx}
                              onClick={() => navigate(`/teams/${h.team?.id}`)}
                              className="bg-gray-900/60 p-2 rounded-lg border border-gray-850 flex items-center justify-between cursor-pointer hover:bg-gray-850 transition"
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="text-gray-500 font-mono text-[10px]">#{hIdx + 8}</span>
                                <span className="font-semibold text-gray-300 truncate">{h.team?.abbreviation || h.team?.name}</span>
                              </div>
                              <span className="font-mono text-gray-400 text-[11px]">
                                {h.stats.wins ?? h.stats.W ?? 0}-{h.stats.losses ?? h.stats.L ?? 0}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
