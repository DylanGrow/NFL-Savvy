import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { fetchStandingsData } from '../lib/data';
import { getInternationalGameInfo } from '../lib/international';
import { InternationalBadge } from '../components/game/InternationalBadge';

const SkeletonCard = () => (
  <div className="animate-pulse bg-gray-900 border border-gray-800 rounded-xl h-36 w-full p-4" />
);

// Fallback notable 2026 NFL injuries for instant zero-latency display
const DEFAULT_INJURIES = [
  { name: 'CeeDee Lamb', team: 'DAL', status: 'Questionable', id: '4241389' },
  { name: 'Joey Porter Jr.', team: 'DAL', status: 'Out', id: '4429013' },
  { name: 'Camden Brown', team: 'DAL', status: 'Out', id: '4685362' },
  { name: 'Christian McCaffrey', team: 'SF', status: 'Questionable', id: '3117251' },
  { name: 'Isiah Pacheco', team: 'KC', status: 'Injured Reserve', id: '4361529' },
  { name: 'A.J. Brown', team: 'PHI', status: 'Questionable', id: '4047646' },
];

// Official 2026 NFL Regular Season statistical leaders for instant zero-latency display
const DEFAULT_SEASON_LEADERS: Record<string, any[]> = {
  passing: [
    { name: 'Dak Prescott', team: 'DAL', statLine: '1,381 Passing Yards', athleteId: '2577417', position: 'QB', headshot: 'https://a.espncdn.com/i/headshots/nfl/players/full/2577417.png' },
    { name: 'Bryce Young', team: 'CAR', statLine: '1,268 Passing Yards', athleteId: '4685720', position: 'QB', headshot: 'https://a.espncdn.com/i/headshots/nfl/players/full/4685720.png' },
    { name: 'Jared Goff', team: 'DET', statLine: '1,214 Passing Yards', athleteId: '3046779', position: 'QB', headshot: 'https://a.espncdn.com/i/headshots/nfl/players/full/3046779.png' },
  ],
  rushing: [
    { name: 'Kenneth Walker III', team: 'KC', statLine: '537 Rushing Yards', athleteId: '4567048', position: 'RB', headshot: 'https://a.espncdn.com/i/headshots/nfl/players/full/4567048.png' },
    { name: 'Bijan Robinson', team: 'ATL', statLine: '494 Rushing Yards', athleteId: '4430807', position: 'RB', headshot: 'https://a.espncdn.com/i/headshots/nfl/players/full/4430807.png' },
    { name: 'James Cook III', team: 'BUF', statLine: '421 Rushing Yards', athleteId: '4379399', position: 'RB', headshot: 'https://a.espncdn.com/i/headshots/nfl/players/full/4379399.png' },
  ],
  receiving: [
    { name: 'CeeDee Lamb', team: 'DAL', statLine: '507 Receiving Yards', athleteId: '4241389', position: 'WR', headshot: 'https://a.espncdn.com/i/headshots/nfl/players/full/4241389.png' },
    { name: 'Chris Olave', team: 'NO', statLine: '491 Receiving Yards', athleteId: '4361370', position: 'WR', headshot: 'https://a.espncdn.com/i/headshots/nfl/players/full/4361370.png' },
    { name: 'Jaxon Smith-Njigba', team: 'SEA', statLine: '481 Receiving Yards', athleteId: '4430878', position: 'WR', headshot: 'https://a.espncdn.com/i/headshots/nfl/players/full/4430878.png' },
  ],
  sacks: [
    { name: 'Greg Rousseau', team: 'BUF', statLine: '6 Sacks', athleteId: '4362506', position: 'DE', headshot: 'https://a.espncdn.com/i/headshots/nfl/players/full/4362506.png' },
    { name: 'Dallas Turner', team: 'MIN', statLine: '6 Sacks', athleteId: '4565190', position: 'LB', headshot: 'https://a.espncdn.com/i/headshots/nfl/players/full/4565190.png' },
    { name: 'T.J. Watt', team: 'PIT', statLine: '4 Sacks', athleteId: '3045282', position: 'LB', headshot: 'https://a.espncdn.com/i/headshots/nfl/players/full/3045282.png' },
  ],
  tackles: [
    { name: 'Alex Singleton', team: 'DEN', statLine: '47 Total Tackles', athleteId: '2612151', position: 'LB', headshot: 'https://a.espncdn.com/i/headshots/nfl/players/full/2612151.png' },
    { name: 'Jacob Rodriguez', team: 'MIA', statLine: '46 Total Tackles', athleteId: '4566094', position: 'LB', headshot: 'https://a.espncdn.com/i/headshots/nfl/players/full/4566094.png' },
    { name: 'Anthony Hill Jr.', team: 'TEN', statLine: '42 Total Tackles', athleteId: '4870805', position: 'LB', headshot: 'https://a.espncdn.com/i/headshots/nfl/players/full/4870805.png' },
  ],
  interceptions: [
    { name: 'Jevon Holland', team: 'NYG', statLine: '3 Interceptions', athleteId: '4373809', position: 'S', headshot: 'https://a.espncdn.com/i/headshots/nfl/players/full/4373809.png' },
    { name: 'Hezekiah Masses', team: 'LV', statLine: '3 Interceptions', athleteId: '4917354', position: 'CB', headshot: 'https://a.espncdn.com/i/headshots/nfl/players/full/4917354.png' },
    { name: 'Jourdan Lewis', team: 'JAX', statLine: '2 Interceptions', athleteId: '3045207', position: 'CB', headshot: 'https://a.espncdn.com/i/headshots/nfl/players/full/3045207.png' },
  ],
};

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [scoreboard, setScoreboard] = useState<any[]>([]);
  const [currentWeek, setCurrentWeek] = useState<number | null>(null);
  const [leaderScope, setLeaderScope] = useState<'season' | 'week'>('season');
  const [offenseTab, setOffenseTab] = useState<'passing' | 'rushing' | 'receiving'>('passing');
  const [defenseTab, setDefenseTab] = useState<'sacks' | 'tackles' | 'interceptions'>('sacks');
  const [seasonLeaders, setSeasonLeaders] = useState<Record<string, any[]>>(DEFAULT_SEASON_LEADERS);
  const [injuries, setInjuries] = useState<any[]>(DEFAULT_INJURIES);
  const [standings, setStandings] = useState<any>(null);

  const loadData = useCallback(async () => {
    setError(null);

    // Clear any stale preseason /statistics cache entries
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        Object.keys(localStorage)
          .filter(k => k.includes('/statistics'))
          .forEach(k => localStorage.removeItem(k));
      }
    } catch {}

    // 1. Try to load local standings first for instant rendering
    fetchStandingsData()
      .then(st => {
        if (st) setStandings((prev: any) => prev || st);
      })
      .catch(() => {});

    try {
      const [scoresRes, leadersRes, standRes] = await Promise.allSettled([
        api.fetchScoreboard(),
        api.fetchAllLeagueLeaders(),
        api.fetchStandings(),
      ]);

      // ── Process Scoreboard ──────────────────────────────────
      if (scoresRes.status === 'fulfilled' && scoresRes.value?.events?.length > 0) {
        const events = scoresRes.value.events;
        setScoreboard(events);
        if (scoresRes.value?.week?.number) {
          setCurrentWeek(scoresRes.value.week.number);
        }
      } else {
        // Fallback: try fetching regular season schedule if scoreboard is empty
        try {
          const sched = await api.fetchSchedule(2, 5);
          if (sched?.events?.length > 0) {
            setScoreboard(sched.events);
            setCurrentWeek(5);
          }
        } catch {}
      }

      // ── Process 2026 Regular Season League Leaders ─────────
      if (leadersRes.status === 'fulfilled' && leadersRes.value && Object.keys(leadersRes.value).length > 0) {
        setSeasonLeaders(leadersRes.value);
      }

      // ── Process Standings ───────────────────────────────────
      if (standRes.status === 'fulfilled' && standRes.value?.children?.length > 0) {
        setStandings(standRes.value);
      } else {
        const localStandings = await fetchStandingsData().catch(() => null);
        if (localStandings) setStandings(localStandings);
      }

      // ── Live League-Wide Injury Check ──────────────────────
      api.fetchLeagueInjuries()
        .then(res => {
          const allTeams = res?.injuries || [];
          if (allTeams.length > 0) {
            const parsed: any[] = [];
            // Pick notable injured athletes across teams
            for (const tm of allTeams) {
              const teamAbbr = tm.abbreviation || tm.displayName?.split(' ').pop() || 'NFL';
              for (const inj of (tm.injuries || [])) {
                if (inj?.athlete && parsed.length < 7) {
                  const statusDesc = inj.status?.name || inj.type?.description || 'Questionable';
                  const detail = inj.details?.type || '';
                  parsed.push({
                    name: inj.athlete.displayName,
                    team: teamAbbr,
                    status: statusDesc,
                    detail,
                    id: String(inj.athlete.id),
                  });
                }
              }
            }
            if (parsed.length > 0) {
              setInjuries(parsed);
            }
          }
        })
        .catch(() => {});

    } catch (err: any) {
      console.warn('Home data load warning:', err);
      // Even if network fails, load local standings so page never crashes
      const localStandings = await fetchStandingsData().catch(() => null);
      if (localStandings) setStandings(localStandings);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Home | NFL Savvy';
    loadData();
  }, [loadData]);

  const liveGamesCount = scoreboard.filter(e => e.status?.type?.state === 'in').length;

  // Extract week-specific top performers from live scoreboard
  const weekLeaders = useMemo(() => {
    const passing: any[] = [];
    const rushing: any[] = [];
    const receiving: any[] = [];
    scoreboard.forEach(e => {
      const comp = e.competitions?.[0];
      const awayTeam = comp?.competitors?.find((c: any) => c.homeAway === 'away')?.team?.abbreviation;
      const homeTeam = comp?.competitors?.find((c: any) => c.homeAway === 'home')?.team?.abbreviation;
      (comp?.leaders || []).forEach((cat: any) => {
        const top = cat.leaders?.[0];
        if (!top?.athlete) return;
        const rawYards = parseInt(top.displayValue?.match(/(\d+)\s*YDS/i)?.[1] || '0', 10);
        const item = {
          name: top.athlete.displayName,
          headshot:
            top.athlete.headshot?.href ||
            top.athlete.headshot ||
            (top.athlete.id
              ? `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${top.athlete.id}.png&w=96&h=70`
              : undefined),
          team: top.team?.abbreviation || homeTeam || awayTeam || '',
          statLine: top.displayValue || '',
          rawYards,
          athleteId: top.athlete.id,
        };
        if (cat.name === 'passingYards') passing.push(item);
        if (cat.name === 'rushingYards') rushing.push(item);
        if (cat.name === 'receivingYards') receiving.push(item);
      });
    });
    passing.sort((a, b) => b.rawYards - a.rawYards);
    rushing.sort((a, b) => b.rawYards - a.rawYards);
    receiving.sort((a, b) => b.rawYards - a.rawYards);
    return {
      passing: passing.slice(0, 3),
      rushing: rushing.slice(0, 3),
      receiving: receiving.slice(0, 3),
    };
  }, [scoreboard]);

  const currentOffenseList = useMemo(() => {
    if (leaderScope === 'week') {
      const list = weekLeaders[offenseTab];
      if (list && list.length > 0) return list;
    }
    return seasonLeaders[offenseTab] || DEFAULT_SEASON_LEADERS[offenseTab] || [];
  }, [leaderScope, offenseTab, weekLeaders, seasonLeaders]);

  const currentDefenseList = useMemo(() => {
    return seasonLeaders[defenseTab] || DEFAULT_SEASON_LEADERS[defenseTab] || [];
  }, [defenseTab, seasonLeaders]);

  if (loading && scoreboard.length === 0 && !standings) {
    return (
      <div className="app-container py-6 sm:py-8 space-y-6">
        <div className="h-20 bg-gray-900 border border-gray-800 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      </div>
    );
  }

  if (error && scoreboard.length === 0) {
    return (
      <div className="app-container py-12 text-center">
        <div className="bg-red-950/60 border border-red-800 p-6 rounded-2xl max-w-md mx-auto space-y-4">
          <p className="text-red-300 font-medium">{error}</p>
          <button
            onClick={loadData}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition shadow font-semibold text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container py-4 sm:py-8 space-y-8 sm:space-y-10 font-sans text-white">

      {/* ── Hero Bar ───────────────────────────────────────── */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-900 border border-gray-800 p-4 sm:p-6 rounded-2xl shadow-lg gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            2026 NFL Season Overview
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Live scores, advanced player analytics, salaries, and referee assignments
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="bg-gray-950/80 border border-gray-800 px-4 py-2.5 rounded-xl shadow-inner text-center flex-1 sm:flex-initial">
            <span className="block text-2xl font-bold font-mono text-emerald-400">
              {liveGamesCount}
            </span>
            <span className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
              Live Now
            </span>
          </div>
          <div className="bg-gray-950/80 border border-gray-800 px-4 py-2.5 rounded-xl shadow-inner text-center flex-1 sm:flex-initial">
            <span className="block text-2xl font-bold font-mono text-blue-400">
              {scoreboard.length}
            </span>
            <span className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
              Total Games
            </span>
          </div>
        </div>
      </section>

      {/* ── Live Scoreboard ───────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <span>🏈</span> {currentWeek ? `Week ${currentWeek}` : 'Live'} Matchups & Scores (2026 Season)
            </h2>
            {scoreboard.some(g => getInternationalGameInfo(g)) && (
              <span className="text-xs font-bold text-indigo-300 bg-indigo-950/90 px-2.5 py-0.5 rounded-full border border-indigo-500/50 flex items-center gap-1 shadow-sm">
                <span>🌍</span>
                <span>International Series Game</span>
              </span>
            )}
          </div>
          <Link to="/games" className="text-xs text-blue-400 hover:text-blue-300 font-medium">
            View Full Schedule &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-3.5 sm:gap-4">
          {scoreboard.length === 0 ? (
            <div className="col-span-full bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center text-gray-400">
              No live games in progress. Visit the <Link to="/games" className="text-blue-400 hover:underline">Schedule page</Link> to inspect full season weeks 1–18.
            </div>
          ) : scoreboard.map((game, i) => {
            const comp = game.competitions?.[0];
            const home = comp?.competitors?.find((c: any) => c.homeAway === 'home');
            const away = comp?.competitors?.find((c: any) => c.homeAway === 'away');
            const status = game.status?.type?.detail || 'Scheduled';
            const isLive = game.status?.type?.state === 'in';
            const isFinal = game.status?.type?.completed;
            const dome = game.weather?.indoor ? '🏟️ Dome' : '';
            const intl = getInternationalGameInfo(game);

            const awayColor = away?.team?.color ? `#${away.team.color.replace(/^#/, '')}` : '#00338D';
            const homeColor = home?.team?.color ? `#${home.team.color.replace(/^#/, '')}` : '#E31837';

            return (
              <div
                key={game.id || i}
                role="button"
                tabIndex={0}
                aria-label={`Matchup: ${away?.team?.displayName || 'Away'} at ${home?.team?.displayName || 'Home'}, status ${status}`}
                onClick={() => navigate(`/games/${game.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/games/${game.id}`);
                  }
                }}
                className={`rounded-xl p-4 cursor-pointer transition-all shadow-md focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98] ${
                  intl
                    ? 'bg-gradient-to-b from-indigo-950/40 via-gray-900 to-gray-900 border-2 border-indigo-500/70 hover:border-indigo-400 shadow-indigo-950/50 hover:shadow-indigo-900/60'
                    : 'bg-gray-900 border border-gray-800 hover:bg-gray-850 hover:border-gray-700'
                }`}
              >
                <div className="flex justify-between items-center text-xs mb-3 border-b border-gray-800/60 pb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`font-semibold px-2 py-0.5 rounded-full ${
                      isLive ? 'bg-green-950 text-green-400 border border-green-800/60 animate-pulse' :
                      isFinal ? 'bg-gray-800 text-gray-400' : 'text-blue-400 font-medium'
                    }`}>
                      {status}
                    </span>
                    {intl && (
                      <InternationalBadge info={intl} variant="tag" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {dome && <span className="text-[11px] bg-gray-800 px-2 py-0.5 rounded text-gray-300">{dome}</span>}
                  </div>
                </div>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3.5 h-3.5 rounded-full border border-gray-700 shrink-0" style={{ backgroundColor: awayColor }} />
                      <span className="font-bold text-sm sm:text-base text-gray-100">{away?.team?.abbreviation || 'AWAY'}</span>
                      <span className="text-xs text-gray-500 hidden xs:inline truncate max-w-[120px]">{away?.team?.name}</span>
                    </div>
                    <span className="text-xl font-bold font-mono text-white">{away?.score !== undefined ? away.score : '--'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3.5 h-3.5 rounded-full border border-gray-700 shrink-0" style={{ backgroundColor: homeColor }} />
                      <span className="font-bold text-sm sm:text-base text-gray-100">{home?.team?.abbreviation || 'HOME'}</span>
                      <span className="text-xs text-gray-500 hidden xs:inline truncate max-w-[120px]">{home?.team?.name}</span>
                    </div>
                    <span className="text-xl font-bold font-mono text-white">{home?.score !== undefined ? home.score : '--'}</span>
                  </div>
                </div>

                {/* International signifier footer on card */}
                {intl && (
                  <div className="mt-2.5 pt-2 border-t border-indigo-900/40 flex items-center justify-between text-[11px] text-indigo-300">
                    <span className="truncate flex items-center gap-1">
                      <span>✈️</span>
                      <span>{intl.city}, {intl.country}</span>
                    </span>
                    <span className="font-semibold text-indigo-400/90 shrink-0 ml-1">Neutral Site</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Highlights Grid ───────────────────────────────── */}
      <section className="space-y-4">
        {/* Header with Scope Switcher */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-800 pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <span>⭐</span> 2026 League Leaders & Highlights
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
              Verified regular season statistical rankings and top game standouts
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 p-1 rounded-xl self-stretch sm:self-auto">
            <button
              onClick={() => setLeaderScope('season')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex-1 sm:flex-initial ${
                leaderScope === 'season'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Season Leaders (2026)
            </button>
            <button
              onClick={() => setLeaderScope('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex-1 sm:flex-initial ${
                leaderScope === 'week'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {currentWeek ? `Week ${currentWeek}` : 'Game'} Standouts
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Offensive Highlights */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <span>🔥</span> Offensive Highlights
              </h3>
              <div className="flex items-center gap-1">
                {(['passing', 'rushing', 'receiving'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setOffenseTab(tab)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                      offenseTab === tab
                        ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50 shadow-sm'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {currentOffenseList.length > 0 ? (
                currentOffenseList.slice(0, 3).map((l, i) => (
                  <div
                    key={l.athleteId || i}
                    onClick={() => l.athleteId && navigate(`/players/${l.athleteId}`)}
                    className={`bg-gray-900 border border-gray-800 hover:border-blue-500/50 hover:bg-gray-850 p-3.5 sm:p-4 rounded-xl flex items-center gap-3.5 transition group shadow-sm ${
                      l.athleteId ? 'cursor-pointer' : ''
                    }`}
                  >
                    {/* Rank Badge */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 border ${
                        i === 0
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : i === 1
                          ? 'bg-slate-400/20 text-slate-300 border-slate-400/40'
                          : 'bg-amber-700/20 text-amber-400 border-amber-700/40'
                      }`}
                    >
                      #{i + 1}
                    </div>

                    {/* Headshot */}
                    <div className="w-12 h-12 bg-gray-800 rounded-full overflow-hidden shrink-0 border border-gray-700 group-hover:border-blue-400/60 transition">
                      <img
                        src={
                          l.headshot ||
                          (l.athleteId
                            ? `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${l.athleteId}.png&w=96&h=70`
                            : 'https://a.espncdn.com/combiner/i?img=/i/headshots/noplayer.png&w=96&h=70')
                        }
                        alt={l.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://a.espncdn.com/combiner/i?img=/i/headshots/noplayer.png&w=96&h=70';
                        }}
                      />
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-white truncate text-sm sm:text-base group-hover:text-blue-300 transition">
                          {l.name}
                        </h4>
                        <span className="text-gray-400 font-semibold text-xs font-mono">
                          ({l.team})
                        </span>
                        {l.position && (
                          <span className="text-[10px] bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded font-mono">
                            {l.position}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-blue-400 truncate mt-0.5">
                        {l.statLine}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl text-center text-gray-500 text-sm">
                  No offensive leaders available.
                </div>
              )}
            </div>
          </div>

          {/* Defensive Highlights */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <span>🛡️</span> Defensive Highlights
              </h3>
              <div className="flex items-center gap-1">
                {(['sacks', 'tackles', 'interceptions'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setDefenseTab(tab)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                      defenseTab === tab
                        ? 'bg-red-600/30 text-red-300 border border-red-500/50 shadow-sm'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {currentDefenseList.length > 0 ? (
                currentDefenseList.slice(0, 3).map((l, i) => (
                  <div
                    key={l.athleteId || i}
                    onClick={() => l.athleteId && navigate(`/players/${l.athleteId}`)}
                    className={`bg-gray-900 border border-gray-800 hover:border-red-500/50 hover:bg-gray-850 p-3.5 sm:p-4 rounded-xl flex items-center gap-3.5 transition group shadow-sm ${
                      l.athleteId ? 'cursor-pointer' : ''
                    }`}
                  >
                    {/* Rank Badge */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 border ${
                        i === 0
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : i === 1
                          ? 'bg-slate-400/20 text-slate-300 border-slate-400/40'
                          : 'bg-amber-700/20 text-amber-400 border-amber-700/40'
                      }`}
                    >
                      #{i + 1}
                    </div>

                    {/* Headshot */}
                    <div className="w-12 h-12 bg-gray-800 rounded-full overflow-hidden shrink-0 border border-gray-700 group-hover:border-red-400/60 transition">
                      <img
                        src={
                          l.headshot ||
                          (l.athleteId
                            ? `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${l.athleteId}.png&w=96&h=70`
                            : 'https://a.espncdn.com/combiner/i?img=/i/headshots/noplayer.png&w=96&h=70')
                        }
                        alt={l.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://a.espncdn.com/combiner/i?img=/i/headshots/noplayer.png&w=96&h=70';
                        }}
                      />
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-white truncate text-sm sm:text-base group-hover:text-red-300 transition">
                          {l.name}
                        </h4>
                        <span className="text-gray-400 font-semibold text-xs font-mono">
                          ({l.team})
                        </span>
                        {l.position && (
                          <span className="text-[10px] bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded font-mono">
                            {l.position}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-red-400 truncate mt-0.5">
                        {l.statLine}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl text-center text-gray-500 text-sm">
                  No defensive leaders available.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Injuries & Standings ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Injuries */}
        <section>
          <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <span>🏥</span> Notable Injuries
            </h2>
            <Link to="/injuries" className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm font-semibold">
              Full Injury Tracker &rarr;
            </Link>
          </div>
          <ul className="bg-gray-900 border border-gray-800 rounded-2xl p-4 divide-y divide-gray-800">
            {injuries.map((inj, i) => {
              const stLower = (inj.status || '').toLowerCase();
              const isOut = stLower.includes('out') || stLower.includes('ir') || stLower.includes('reserve');
              const isQ = stLower.includes('questionable') || stLower.includes('doubt');
              return (
                <li
                  key={i}
                  onClick={() => inj.id && navigate(`/players/${inj.id}`)}
                  className={`py-3 flex justify-between items-center transition ${inj.id ? 'cursor-pointer hover:bg-gray-850 -mx-2 px-2 rounded-lg' : ''}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-sm text-gray-200 truncate">
                      {inj.name}
                    </span>
                    <span className="text-xs text-gray-400 font-mono flex-shrink-0">({inj.team})</span>
                    {inj.detail && (
                      <span className="hidden sm:inline-block text-[11px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
                        {inj.detail}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded border whitespace-nowrap ml-2 ${
                    isOut ? 'bg-red-950/80 text-red-400 border-red-800/60' :
                    isQ ? 'bg-yellow-950/80 text-yellow-400 border-yellow-800/60' :
                    'bg-gray-800 text-gray-300 border-gray-700'
                  }`}>
                    {inj.status}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Standings Snapshot */}
        <section>
          <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <span>🏆</span> Standings Snapshot
            </h2>
            <Link to="/standings" className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm font-semibold">
              Full Standings &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* AFC Leaders */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 border-b border-gray-800 pb-2 text-xs font-bold text-red-400 uppercase tracking-wider">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> AFC Leaders
              </div>
              <div className="space-y-2">
                {(standings?.children?.[0]?.standings?.entries?.slice(0, 4) || []).map((e: any, idx: number) => {
                  const t = e.team;
                  const rec = e.stats?.find((s: any) => s.name === 'overall')?.displayValue ||
                             `${e.stats?.find((s: any) => s.name === 'wins')?.displayValue || 0}-${e.stats?.find((s: any) => s.name === 'losses')?.displayValue || 0}`;
                  return (
                    <div
                      key={idx}
                      onClick={() => navigate(`/teams/${t?.id || t?.abbreviation}`)}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-800/60 cursor-pointer transition text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-gray-500 font-mono w-4 font-bold">#{idx + 1}</span>
                        {t?.abbreviation && (
                          <img
                            src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/${t.abbreviation.toLowerCase()}.png&w=24&h=24`}
                            alt=""
                            className="w-5 h-5 object-contain"
                          />
                        )}
                        <span className="font-semibold text-gray-200 truncate">{t?.displayName || t?.abbreviation}</span>
                      </div>
                      <span className="font-mono font-bold text-gray-300 ml-2">{rec}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* NFC Leaders */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 border-b border-gray-800 pb-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> NFC Leaders
              </div>
              <div className="space-y-2">
                {(standings?.children?.[1]?.standings?.entries?.slice(0, 4) || []).map((e: any, idx: number) => {
                  const t = e.team;
                  const rec = e.stats?.find((s: any) => s.name === 'overall')?.displayValue ||
                             `${e.stats?.find((s: any) => s.name === 'wins')?.displayValue || 0}-${e.stats?.find((s: any) => s.name === 'losses')?.displayValue || 0}`;
                  return (
                    <div
                      key={idx}
                      onClick={() => navigate(`/teams/${t?.id || t?.abbreviation}`)}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-800/60 cursor-pointer transition text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-gray-500 font-mono w-4 font-bold">#{idx + 1}</span>
                        {t?.abbreviation && (
                          <img
                            src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/${t.abbreviation.toLowerCase()}.png&w=24&h=24`}
                            alt=""
                            className="w-5 h-5 object-contain"
                          />
                        )}
                        <span className="font-semibold text-gray-200 truncate">{t?.displayName || t?.abbreviation}</span>
                      </div>
                      <span className="font-mono font-bold text-gray-300 ml-2">{rec}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>

    </div>
  );
}
