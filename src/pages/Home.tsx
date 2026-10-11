import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { fetchStandingsData } from '../lib/data';

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

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [scoreboard, setScoreboard] = useState<any[]>([]);
  const [currentWeek, setCurrentWeek] = useState<number | null>(null);
  const [offenseLeaders, setOffenseLeaders] = useState<any[]>([]);
  const [defenseLeaders, setDefenseLeaders] = useState<any[]>([]);
  const [injuries, setInjuries] = useState<any[]>(DEFAULT_INJURIES);
  const [standings, setStandings] = useState<any>(null);

  const loadData = useCallback(async () => {
    setError(null);

    // 1. Try to load local standings first for instant rendering
    fetchStandingsData()
      .then(st => {
        if (st) setStandings((prev: any) => prev || st);
      })
      .catch(() => {});

    try {
      const [scoresRes, offRes, defRes, standRes] = await Promise.allSettled([
        api.fetchScoreboard(),
        api.fetchLeagueLeaders('passing'),
        api.fetchLeagueLeaders('sacks'),
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

      // ── Process Offensive Leaders ───────────────────────────
      if (offRes.status === 'fulfilled' && Array.isArray(offRes.value) && offRes.value.length > 0) {
        setOffenseLeaders(offRes.value.slice(0, 3));
      } else if (scoresRes.status === 'fulfilled') {
        const gameOffLeaders: any[] = [];
        (scoresRes.value?.events || []).forEach((e: any) => {
          (e.competitions?.[0]?.leaders || []).forEach((cat: any) => {
            const top = cat.leaders?.[0];
            if (top?.athlete && (cat.name === 'passingYards' || cat.name === 'rushingYards')) {
              gameOffLeaders.push({
                name: top.athlete.displayName,
                headshot: top.athlete.headshot,
                team: top.team?.abbreviation || '',
                statLine: `${top.displayValue} ${cat.displayName || ''}`.trim(),
                athleteId: top.athlete.id,
              });
            }
          });
        });
        if (gameOffLeaders.length > 0) {
          setOffenseLeaders(gameOffLeaders.slice(0, 3));
        }
      }

      // ── Process Defensive Leaders ───────────────────────────
      if (defRes.status === 'fulfilled' && Array.isArray(defRes.value) && defRes.value.length > 0) {
        setDefenseLeaders(defRes.value.slice(0, 3));
      }

      // ── Process Standings ───────────────────────────────────
      if (standRes.status === 'fulfilled' && standRes.value?.children?.length > 0) {
        setStandings(standRes.value);
      } else {
        const localStandings = await fetchStandingsData().catch(() => null);
        if (localStandings) setStandings(localStandings);
      }

      // ── Fast Injury Check ───────────────────────────────────
      // Non-blocking query to keep Home page ultra-responsive
      api.fetchInjuries('6')
        .then(res => {
          const items = res?.injuries || [];
          if (items.length > 0) {
            const parsed = items.slice(0, 6).map((inj: any) => ({
              name: inj.athlete?.displayName || 'Player',
              team: 'DAL',
              status: inj.status || 'Questionable',
              id: inj.athlete?.id,
            }));
            setInjuries(parsed);
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

  const liveGamesCount = scoreboard.filter(e => e.status?.type?.state === 'in').length;

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
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <span>🏈</span> {currentWeek ? `Week ${currentWeek}` : 'Live'} Matchups & Scores (2026 Season)
          </h2>
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
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:bg-gray-850 hover:border-gray-700 transition-all shadow-md focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98]"
              >
                <div className="flex justify-between items-center text-xs mb-3 border-b border-gray-800/60 pb-2">
                  <span className={`font-semibold px-2 py-0.5 rounded-full ${
                    isLive ? 'bg-green-950 text-green-400 border border-green-800/60 animate-pulse' :
                    isFinal ? 'bg-gray-800 text-gray-400' : 'text-blue-400 font-medium'
                  }`}>
                    {status}
                  </span>
                  {dome && <span className="text-[11px] bg-gray-800 px-2 py-0.5 rounded text-gray-300">{dome}</span>}
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
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Highlights Grid ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Offensive Highlights */}
        <section>
          <h2 className="text-xl sm:text-2xl font-bold mb-4 border-b border-gray-800 pb-2 flex items-center gap-2">
            <span>🔥</span> Offensive Highlights
          </h2>
          <div className="space-y-3">
            {offenseLeaders.length > 0 ? offenseLeaders.map((l, i) => (
              <div
                key={i}
                onClick={() => l.athleteId && navigate(`/players/${l.athleteId}`)}
                className={`bg-gray-900 border border-gray-800 p-4 rounded-xl flex items-center gap-4 transition ${l.athleteId ? 'cursor-pointer hover:bg-gray-850 hover:border-gray-700' : ''}`}
              >
                <div className="w-12 h-12 bg-gray-800 rounded-full overflow-hidden shrink-0 border border-gray-700">
                  <img
                    src={l.headshot || 'https://a.espncdn.com/combiner/i?img=/i/headshots/noplayer.png&w=48&h=48'}
                    alt={l.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://a.espncdn.com/combiner/i?img=/i/headshots/noplayer.png&w=48&h=48'; }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-white truncate text-sm sm:text-base">
                    {l.name} <span className="text-gray-400 font-normal text-xs ml-1 font-mono">({l.team})</span>
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold text-blue-400 truncate mt-0.5">{l.statLine}</p>
                </div>
              </div>
            )) : (
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl text-center text-gray-500 text-sm">
                No offensive leaders available.
              </div>
            )}
          </div>
        </section>

        {/* Defensive Highlights */}
        <section>
          <h2 className="text-xl sm:text-2xl font-bold mb-4 border-b border-gray-800 pb-2 flex items-center gap-2">
            <span>🛡️</span> Defensive Highlights
          </h2>
          <div className="space-y-3">
            {defenseLeaders.length > 0 ? defenseLeaders.map((l, i) => (
              <div
                key={i}
                onClick={() => l.athleteId && navigate(`/players/${l.athleteId}`)}
                className={`bg-gray-900 border border-gray-800 p-4 rounded-xl flex items-center gap-4 transition ${l.athleteId ? 'cursor-pointer hover:bg-gray-850 hover:border-gray-700' : ''}`}
              >
                <div className="w-12 h-12 bg-gray-800 rounded-full overflow-hidden shrink-0 border border-gray-700">
                  <img
                    src={l.headshot || 'https://a.espncdn.com/combiner/i?img=/i/headshots/noplayer.png&w=48&h=48'}
                    alt={l.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://a.espncdn.com/combiner/i?img=/i/headshots/noplayer.png&w=48&h=48'; }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-white truncate text-sm sm:text-base">
                    {l.name} <span className="text-gray-400 font-normal text-xs ml-1 font-mono">({l.team})</span>
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold text-red-400 truncate mt-0.5">{l.statLine}</p>
                </div>
              </div>
            )) : (
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl text-center text-gray-500 text-sm">
                No defensive leaders available.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ── Injuries & Standings ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Injuries */}
        <section>
          <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <span>🏥</span> Notable Injuries
            </h2>
            <span className="text-xs text-gray-500 font-medium">Updated 2026 Season</span>
          </div>
          <ul className="bg-gray-900 border border-gray-800 rounded-2xl p-4 divide-y divide-gray-800">
            {injuries.map((inj, i) => (
              <li
                key={i}
                onClick={() => inj.id && navigate(`/players/${inj.id}`)}
                className={`py-3 flex justify-between items-center transition ${inj.id ? 'cursor-pointer hover:bg-gray-850 -mx-2 px-2 rounded-lg' : ''}`}
              >
                <span className="font-medium text-sm text-gray-200">
                  {inj.name} <span className="text-xs text-gray-400 font-normal ml-1 font-mono">({inj.team})</span>
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                  inj.status === 'Out' ? 'bg-red-950/80 text-red-400 border-red-800/60' :
                  inj.status === 'Questionable' ? 'bg-yellow-950/80 text-yellow-400 border-yellow-800/60' :
                  'bg-gray-800 text-gray-300 border-gray-700'
                }`}>
                  {inj.status}
                </span>
              </li>
            ))}
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
