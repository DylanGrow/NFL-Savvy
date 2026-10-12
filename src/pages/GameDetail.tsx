import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { RefereeCard } from '../components/game/RefereeCard';
import { WeatherCard } from '../components/weather/WeatherCard';
import { fetchGameWeather } from '../lib/weather';
import { fetchStadiumsData, fetchRefereesData } from '../lib/data';
import { getInternationalGameInfo } from '../lib/international';
import { InternationalBadge } from '../components/game/InternationalBadge';
import type { Official, RefereeCrew, Weather } from '../types';

export default function GameDetail() {
  const { gameId } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stadiums, setStadiums] = useState<Record<string, any>>({});
  const [referees, setReferees] = useState<RefereeCrew[]>([]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Interactive Game Center Tabs
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'BOXSCORE' | 'DRIVES'>('OVERVIEW');
  const [boxScoreTeamIdx, setBoxScoreTeamIdx] = useState<number>(0);
  const [expandedDriveId, setExpandedDriveId] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Game Detail | NFL Hub';
    fetchStadiumsData()
      .then((arr) => {
        const map = arr.reduce((acc: any, s: any) => ({ ...acc, [s.name || s.fullName]: s }), {});
        setStadiums(map);
      })
      .catch(() => {});

    fetchRefereesData()
      .then(setReferees)
      .catch(() => {});

    if (!gameId) return;

    setLoading(true);
    setError(null);
    api
      .fetchGame(gameId)
      .then((res) => {
        setData(res);
        const comp = res?.header?.competitions?.[0];
        const awayAbbr = comp?.competitors?.find((c: any) => c.homeAway === 'away')?.team?.abbreviation;
        const homeAbbr = comp?.competitors?.find((c: any) => c.homeAway === 'home')?.team?.abbreviation;
        if (awayAbbr && homeAbbr) {
          document.title = `${awayAbbr} @ ${homeAbbr} | NFL Hub`;
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load game details');
        setLoading(false);
      });
  }, [gameId]);

  const header = data?.header?.competitions?.[0] || {};
  const venue = header.venue || data?.gameInfo?.venue;
  const venueName = venue?.fullName;

  const stadium = venueName
    ? Object.values(stadiums).find(
        (s: any) => s.name === venueName || s.fullName === venueName || venueName.includes(s.name)
      )
    : null;
  const isDome = stadium?.isDome || stadium?.type === 'dome' || stadium?.type === 'retractable';

  // Weather Hook MUST be above early returns so hook count never changes across renders
  useEffect(() => {
    if (!data || !stadium || isDome || !stadium.coordinates) {
      setWeather(null);
      setWeatherLoading(false);
      return;
    }

    const compDate = header.date || data?.header?.competitions?.[0]?.date;
    const gameDate = compDate ? compDate.split('T')[0] : new Date().toISOString().split('T')[0];

    setWeatherLoading(true);
    fetchGameWeather(stadium.coordinates.lat, stadium.coordinates.lon, gameDate)
      .then((w) => setWeather(w))
      .catch(() => setWeather(null))
      .finally(() => setWeatherLoading(false));
  }, [stadium, isDome, header.date, data]);

  if (loading) {
    return (
      <div className="app-container py-6 space-y-6">
        <div className="bg-gray-900 border border-gray-800 h-48 animate-pulse rounded-2xl"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gray-900 border border-gray-800 h-96 animate-pulse rounded-2xl lg:col-span-2"></div>
          <div className="bg-gray-900 border border-gray-800 h-96 animate-pulse rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container py-12 text-center">
        <div className="bg-red-950/30 border border-red-800/50 text-red-300 p-6 rounded-2xl max-w-xl mx-auto">
          <h2 className="text-lg font-bold mb-2">Unable to Load Game</h2>
          <p className="text-sm mb-4">{error}</p>
          <Link to="/games" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold">
            ← Back to Schedule
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const boxscore = data.boxscore || {};
  const scoringPlays = data.scoringPlays || [];
  const leaders = data.leaders || [];
  const drives: any[] = data.drives?.previous || [];
  const winProb: any[] = data.winprobability || [];
  const pickcenter = data.pickcenter?.[0];

  const home = header.competitors?.find((c: any) => c.homeAway === 'home');
  const away = header.competitors?.find((c: any) => c.homeAway === 'away');
  const status = header.status?.type?.detail || 'Scheduled';

  const awayLinescores: any[] = away?.linescores || [];
  const homeLinescores: any[] = home?.linescores || [];
  const maxPeriods = Math.max(4, awayLinescores.length, homeLinescores.length);

  const teamStats = boxscore.teams || [];
  const homeStats = teamStats.find((t: any) => t.team?.id === home?.team?.id)?.statistics || [];
  const awayStats = teamStats.find((t: any) => t.team?.id === away?.team?.id)?.statistics || [];

  const GAME_STAT_CONFIGS = [
    { key: 'totalYards', label: 'Total Yards', matchNames: ['totalyards', 'total yards'] },
    { key: 'netPassingYards', label: 'Pass Yards', matchNames: ['netpassingyards', 'passing', 'net passing yards', 'pass yards'] },
    { key: 'rushingYards', label: 'Rush Yards', matchNames: ['rushingyards', 'rushing', 'rushing yards', 'rush yards'] },
    { key: 'firstDowns', label: '1st Downs', matchNames: ['firstdowns', '1st downs', 'first downs'] },
    { key: 'thirdDownEff', label: '3rd Down Eff', matchNames: ['thirddowneff', '3rd down efficiency', 'third down eff', '3rd down%'] },
    { key: 'fourthDownEff', label: '4th Down Eff', matchNames: ['fourthdowneff', '4th down efficiency', 'fourth down eff'] },
    { key: 'turnovers', label: 'Turnovers', matchNames: ['turnovers'], isLowerBetter: true },
    { key: 'totalPenaltiesYards', label: 'Penalties', matchNames: ['totalpenaltiesyards', 'penalties', 'total penalties-yards', 'total penalties'] },
    { key: 'possessionTime', label: 'Possession', matchNames: ['possessiontime', 'possession', 'possession time', 'top'] },
    { key: 'completionAttempts', label: 'Comp / Att', matchNames: ['completionattempts', 'comp/att', 'completion attempts'] },
    { key: 'yardsPerPlay', label: 'Yards / Play', matchNames: ['yardsperplay', 'yards per play'] },
    { key: 'sacksYardsLost', label: 'Sacks-Yards', matchNames: ['sacksyardslost', 'sacks-yards lost', 'sacks'] },
  ];

  const getStatDisplay = (stats: any[], matchNames: string[]): string => {
    if (!stats || !Array.isArray(stats)) return '-';
    const item = stats.find((s: any) => {
      const n = (s.name || '').toLowerCase();
      const l = (s.label || '').toLowerCase();
      return matchNames.includes(n) || matchNames.includes(l);
    });
    return item?.displayValue || '-';
  };

  // Extract live officials from API
  const liveOfficials: Official[] = (data.gameInfo?.officials || header.officials || []).map((o: any) => ({
    displayName: o.displayName || o.fullName || 'Official',
    position: o.position?.displayName || o.position?.name || 'Official',
    jerseyNumber: o.order ? String(o.order) : undefined,
  }));

  const headRefOfficial = liveOfficials.find(
    (o) =>
      o.position?.toLowerCase().includes('referee') ||
      o.displayName?.toLowerCase().includes('referee')
  );

  const matchedCrew = headRefOfficial
    ? referees.find(
        (r) =>
          r.referee.toLowerCase() === headRefOfficial.displayName.toLowerCase() ||
          headRefOfficial.displayName.toLowerCase().includes(r.referee.toLowerCase())
      )
    : referees.length > 0
    ? referees[Math.abs(gameId ? gameId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : 0) % referees.length]
    : null;

  const intl = getInternationalGameInfo(data);

  // Render Pure SVG Win Probability Chart
  const renderWinProbChart = () => {
    if (!winProb || winProb.length < 3) return null;
    const width = 600;
    const height = 140;
    const padX = 10;
    const padY = 12;
    const plotW = width - padX * 2;
    const plotH = height - padY * 2;

    const points = winProb.map((wp: any, idx: number) => {
      const x = padX + (idx / (winProb.length - 1)) * plotW;
      // homeWinPercentage: 1.0 is top (Home 100%), 0.0 is bottom (Away 100%)
      const pct = typeof wp.homeWinPercentage === 'number' ? wp.homeWinPercentage : 0.5;
      const y = padY + (1 - pct) * plotH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const lastWp = winProb[winProb.length - 1];
    const lastHomePct = Math.round((lastWp?.homeWinPercentage ?? 0.5) * 100);
    const lastAwayPct = 100 - lastHomePct;

    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="font-bold text-base sm:text-lg text-white flex items-center gap-2">
            <span>📈</span> Win Probability Curve
          </h3>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-blue-400 font-bold">
              {home?.team?.abbreviation}: {lastHomePct}%
            </span>
            <span className="text-gray-600">|</span>
            <span className="text-amber-400 font-bold">
              {away?.team?.abbreviation}: {lastAwayPct}%
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase px-1 mb-1">
            <span>100% {home?.team?.abbreviation} (Home)</span>
            <span>{winProb.length} Plays Tracked</span>
          </div>

          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32 bg-gray-950/80 rounded-xl border border-gray-800/80 overflow-visible">
            {/* 50% Midline */}
            <line
              x1={padX}
              y1={height / 2}
              x2={width - padX}
              y2={height / 2}
              stroke="#374151"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            {/* Quarter dividers */}
            {[0.25, 0.5, 0.75].map((q) => (
              <line
                key={q}
                x1={padX + q * plotW}
                y1={padY}
                x2={padX + q * plotW}
                y2={height - padY}
                stroke="#1f2937"
                strokeWidth="1"
              />
            ))}
            {/* Win Prob Polyline */}
            <polyline
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2.2"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={points.join(' ')}
            />
          </svg>

          <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase px-1 mt-1">
            <span>100% {away?.team?.abbreviation} (Away)</span>
            <div className="flex gap-6 text-gray-500">
              <span>Q1</span>
              <span>Q2</span>
              <span>Q3</span>
              <span>Q4</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Player Box Score Tab Content
  const playerBoxTeams: any[] = boxscore.players || [];

  return (
    <div className="app-container py-4 sm:py-8 text-white font-sans space-y-6">
      {/* Back navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/games"
          className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5"
        >
          ← Back to Schedule
        </Link>
        {pickcenter && (
          <div className="flex items-center gap-3 text-xs font-mono bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-xl text-gray-300">
            {pickcenter.details && <span>Line: <strong className="text-white">{pickcenter.details}</strong></span>}
            {pickcenter.overUnder && <span>O/U: <strong className="text-white">{pickcenter.overUnder}</strong></span>}
          </div>
        )}
      </div>

      {/* Featured International Series Marquee Banner */}
      {intl && <InternationalBadge info={intl} variant="banner" />}

      {/* ── Scoreboard Header Card ────────────────────────────────────── */}
      <div
        className={`rounded-2xl p-4 sm:p-8 text-center shadow-xl transition-all ${
          intl
            ? 'bg-gradient-to-b from-indigo-950/40 via-gray-900 to-gray-900 border-2 border-indigo-500/60 shadow-indigo-950/40'
            : 'bg-gray-900 border border-gray-800'
        }`}
      >
        <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
          <div className="inline-block px-3 py-1 bg-gray-950 text-blue-400 text-xs font-semibold rounded-full border border-gray-800">
            {status}
          </div>
          {intl && <InternationalBadge info={intl} variant="pill" />}
        </div>

        {/* Away @ Home Teams & Scores */}
        <div className="flex items-center justify-between gap-2 sm:gap-6 max-w-3xl mx-auto">
          {/* Away Team */}
          <Link
            to={`/teams/${away?.team?.id || ''}`}
            className="flex-1 flex flex-col sm:flex-row items-center justify-end gap-3 text-center sm:text-right min-w-0 group"
          >
            <div className="order-2 sm:order-1 min-w-0">
              <h2 className="text-sm xs:text-base sm:text-2xl font-extrabold truncate text-gray-100 group-hover:text-blue-400 transition-colors">
                {away?.team?.displayName}
              </h2>
              {away?.record?.[0]?.displayValue && (
                <div className="text-xs font-mono text-gray-400">{away.record[0].displayValue}</div>
              )}
            </div>
            {away?.team?.logos?.[0]?.href && (
              <img
                src={away.team.logos[0].href}
                alt={away.team.abbreviation}
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain order-1 sm:order-2 flex-shrink-0"
              />
            )}
          </Link>

          {/* Scores */}
          <div className="flex items-center gap-2 sm:gap-5 px-2 sm:px-4">
            <div className="text-3xl sm:text-5xl font-black font-mono text-white tracking-tight">
              {away?.score ?? '0'}
            </div>
            <div className="text-gray-500 font-extrabold text-xs sm:text-lg select-none">@</div>
            <div className="text-3xl sm:text-5xl font-black font-mono text-white tracking-tight">
              {home?.score ?? '0'}
            </div>
          </div>

          {/* Home Team */}
          <Link
            to={`/teams/${home?.team?.id || ''}`}
            className="flex-1 flex flex-col sm:flex-row items-center justify-start gap-3 text-center sm:text-left min-w-0 group"
          >
            {home?.team?.logos?.[0]?.href && (
              <img
                src={home.team.logos[0].href}
                alt={home.team.abbreviation}
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <h2 className="text-sm xs:text-base sm:text-2xl font-extrabold truncate text-gray-100 group-hover:text-blue-400 transition-colors">
                {home?.team?.displayName}
              </h2>
              {home?.record?.[0]?.displayValue && (
                <div className="text-xs font-mono text-gray-400">{home.record[0].displayValue}</div>
              )}
            </div>
          </Link>
        </div>

        {/* Quarter-by-Quarter Linescore Table */}
        {(awayLinescores.length > 0 || homeLinescores.length > 0) && (
          <div className="mt-6 max-w-md mx-auto overflow-x-auto">
            <table className="w-full text-xs font-mono border border-gray-800 rounded-xl overflow-hidden bg-gray-950/70">
              <thead>
                <tr className="bg-gray-950 text-gray-400 border-b border-gray-800">
                  <th className="py-2 px-3 text-left font-sans">TEAM</th>
                  {[...Array(maxPeriods)].map((_, i) => (
                    <th key={i} className="py-2 px-2.5 text-center">
                      {i < 4 ? `Q${i + 1}` : `OT${i > 4 ? i - 3 : ''}`}
                    </th>
                  ))}
                  <th className="py-2 px-3 text-right font-bold text-white">T</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/70">
                <tr>
                  <td className="py-2 px-3 text-left font-sans font-bold text-gray-200">
                    {away?.team?.abbreviation}
                  </td>
                  {[...Array(maxPeriods)].map((_, i) => (
                    <td key={i} className="py-2 px-2.5 text-center text-gray-300">
                      {awayLinescores[i]?.displayValue ?? '-'}
                    </td>
                  ))}
                  <td className="py-2 px-3 text-right font-extrabold text-white">{away?.score ?? '0'}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-left font-sans font-bold text-gray-200">
                    {home?.team?.abbreviation}
                  </td>
                  {[...Array(maxPeriods)].map((_, i) => (
                    <td key={i} className="py-2 px-2.5 text-center text-gray-300">
                      {homeLinescores[i]?.displayValue ?? '-'}
                    </td>
                  ))}
                  <td className="py-2 px-3 text-right font-extrabold text-white">{home?.score ?? '0'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {intl ? (
          <div className="text-indigo-300 mt-4 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5">
            <span>✈️</span>
            <span>
              {venueName} · {intl.city}, {intl.country} (Neutral Site)
            </span>
          </div>
        ) : (
          venueName && <div className="text-gray-400 mt-4 text-xs sm:text-sm font-medium">📍 {venueName}</div>
        )}
      </div>

      {/* ── Game Center Section Switcher Tabs ─────────────────────────── */}
      <div className="flex items-center gap-2 bg-gray-900 p-1.5 rounded-2xl border border-gray-800 w-full sm:w-fit overflow-x-auto touch-scroll">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap min-h-[40px] ${
            activeTab === 'OVERVIEW'
              ? 'bg-blue-600 text-white shadow'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
          }`}
        >
          📊 Overview & Team Stats
        </button>
        <button
          onClick={() => setActiveTab('BOXSCORE')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap min-h-[40px] ${
            activeTab === 'BOXSCORE'
              ? 'bg-blue-600 text-white shadow'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
          }`}
        >
          🏈 Player Box Score
        </button>
        <button
          onClick={() => setActiveTab('DRIVES')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap min-h-[40px] ${
            activeTab === 'DRIVES'
              ? 'bg-blue-600 text-white shadow'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
          }`}
        >
          ⚡ Play-by-Play Drives {drives.length > 0 && `(${drives.length})`}
        </button>
      </div>

      {/* ── TAB 1: OVERVIEW & TEAM STATS ──────────────────────────────── */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Win Probability Curve */}
            {renderWinProbChart()}

            {/* Team Stats Comparison */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg">
              <h3 className="font-bold text-lg mb-4 text-white">Team Matchup Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 pb-2 border-b border-gray-800">
                  <span className="w-20 text-left">{away?.team?.abbreviation}</span>
                  <span className="flex-1 text-center">Metric</span>
                  <span className="w-20 text-right">{home?.team?.abbreviation}</span>
                </div>
                {GAME_STAT_CONFIGS.map((cfg) => {
                  const as = getStatDisplay(awayStats, cfg.matchNames);
                  const hs = getStatDisplay(homeStats, cfg.matchNames);
                  const aVal = parseFloat(as);
                  const hVal = parseFloat(hs);
                  const aBetter = cfg.isLowerBetter
                    ? !isNaN(aVal) && !isNaN(hVal) && aVal < hVal
                    : !isNaN(aVal) && !isNaN(hVal) && aVal > hVal;
                  const hBetter = cfg.isLowerBetter
                    ? !isNaN(aVal) && !isNaN(hVal) && hVal < aVal
                    : !isNaN(aVal) && !isNaN(hVal) && hVal > aVal;

                  return (
                    <div key={cfg.key} className="flex justify-between items-center py-2 border-b border-gray-800/60 px-2 text-sm">
                      <span className={`w-20 text-left font-mono ${aBetter ? 'font-bold text-blue-400' : 'text-gray-400'}`}>
                        {as}
                      </span>
                      <span className="flex-1 text-center text-gray-300 font-medium text-xs sm:text-sm">{cfg.label}</span>
                      <span className={`w-20 text-right font-mono ${hBetter ? 'font-bold text-emerald-400' : 'text-gray-400'}`}>
                        {hs}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scoring Summary */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg">
              <h3 className="font-bold text-lg mb-4 text-white">Scoring Summary ({scoringPlays.length})</h3>
              <div className="space-y-4">
                {scoringPlays.map((play: any) => (
                  <div key={play.id} className="flex items-start gap-3 sm:gap-4 border-b border-gray-800/70 pb-4 last:border-none last:pb-0">
                    <div className="bg-gray-950 border border-gray-800 rounded-lg px-2 py-1 text-gray-400 w-14 flex-shrink-0 text-xs font-mono text-center">
                      <div className="font-bold text-gray-200">Q{play.period?.number}</div>
                      <div>{play.clock?.displayValue}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {play.team?.logo && (
                          <img src={play.team.logo} alt="" className="w-4 h-4 object-contain" />
                        )}
                        <span className="font-bold text-xs sm:text-sm text-white">
                          {play.team?.abbreviation} — {play.scoringType?.displayName || 'Score'}
                        </span>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-300 leading-relaxed">{play.text}</div>
                    </div>
                    <div className="w-16 text-right font-extrabold font-mono text-xs sm:text-sm flex-shrink-0 bg-gray-950 px-2 py-1 rounded border border-gray-800">
                      {play.awayScore}-{play.homeScore}
                    </div>
                  </div>
                ))}
                {scoringPlays.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-6">No scoring plays recorded yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Key Performers, Stadium/Weather, Referees */}
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-5 shadow-lg">
              <h3 className="font-bold text-lg mb-4 text-white">Key Performers</h3>
              {leaders.map((teamLeader: any) => (
                <div key={teamLeader.team?.id} className="mb-6 last:mb-0">
                  <div className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-2.5 border-b border-gray-800 pb-1">
                    {teamLeader.team?.displayName}
                  </div>
                  <div className="space-y-3">
                    {teamLeader.leaders?.map((l: any) => {
                      const topEntry = l.leaders?.[0];
                      const athlete = topEntry?.athlete;
                      if (!athlete) return null;
                      return (
                        <Link
                          key={l.name}
                          to={`/players/${athlete.id}`}
                          className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-gray-800/60 transition-colors group"
                        >
                          {athlete.headshot?.href ? (
                            <img src={athlete.headshot.href} alt="" className="w-9 h-9 rounded-full bg-gray-800 object-cover border border-gray-700" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gray-800 border border-gray-700" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-gray-100 group-hover:text-blue-400 truncate">
                                {athlete.displayName}
                              </span>
                              <span className="text-[10px] font-mono text-gray-500 uppercase">{l.displayName}</span>
                            </div>
                            <div className="text-xs font-mono text-gray-400">{topEntry.displayValue}</div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg text-white">Stadium & Venue</h3>
                  {intl && <InternationalBadge info={intl} variant="tag" />}
                </div>
                <div className="text-sm space-y-1">
                  <div className="font-bold text-base text-gray-100">{venueName || 'Unknown Venue'}</div>
                  {intl && (
                    <div className="text-indigo-300 font-semibold flex items-center gap-1.5 py-1">
                      <span>✈️ Host:</span>
                      <span>
                        {intl.flag} {intl.city}, {intl.country}
                      </span>
                      <span className="text-xs text-indigo-400 font-medium">· Neutral Site</span>
                    </div>
                  )}
                  {stadium && (
                    <>
                      <div className="text-gray-400">
                        Capacity: {stadium.capacity?.toLocaleString() || 'N/A'} • Surface: {stadium.surface || 'N/A'}
                      </div>
                      <div className="text-gray-400">
                        {stadium.city}, {stadium.state}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Game Conditions</div>
                <WeatherCard weather={weather} isDome={!!isDome} isLoading={weatherLoading} />
              </div>
            </div>

            {/* Officiating Crew / Referees */}
            <RefereeCard officials={liveOfficials} crew={matchedCrew} />
          </div>
        </div>
      )}

      {/* ── TAB 2: FULL PLAYER BOX SCORE ──────────────────────────────── */}
      {activeTab === 'BOXSCORE' && (
        <div className="space-y-6">
          {playerBoxTeams.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center text-gray-400">
              Player box score stats are not yet available for this game.
            </div>
          ) : (
            <>
              {/* Team Selector for Box Score */}
              <div className="flex items-center gap-2">
                {playerBoxTeams.map((teamBox: any, idx: number) => (
                  <button
                    key={teamBox.team?.id || idx}
                    onClick={() => setBoxScoreTeamIdx(idx)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                      boxScoreTeamIdx === idx
                        ? 'bg-blue-600 text-white border-blue-500 shadow-lg'
                        : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-white'
                    }`}
                  >
                    {teamBox.team?.logo && (
                      <img src={teamBox.team.logo} alt="" className="w-5 h-5 object-contain" />
                    )}
                    <span>{teamBox.team?.displayName || `Team ${idx + 1}`}</span>
                  </button>
                ))}
              </div>

              {/* Render Stat Tables for Selected Team */}
              <div className="grid grid-cols-1 gap-6">
                {(playerBoxTeams[boxScoreTeamIdx]?.statistics || []).map((cat: any) => {
                  const athletes = cat.athletes || [];
                  if (athletes.length === 0) return null;
                  const labels: string[] = cat.labels || [];

                  return (
                    <div
                      key={cat.name}
                      className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-lg"
                    >
                      <div className="bg-gray-950 px-4 py-3 border-b border-gray-800 font-bold text-sm text-white uppercase tracking-wider">
                        {cat.text || cat.displayName || cat.name}
                      </div>
                      <div className="overflow-x-auto touch-scroll">
                        <table className="w-full text-left text-xs sm:text-sm min-w-[520px]">
                          <thead className="bg-gray-950/60 text-gray-400 border-b border-gray-800 text-[11px] font-mono uppercase">
                            <tr>
                              <th className="px-4 py-2.5 font-sans">Player</th>
                              {labels.map((lbl: string, i: number) => (
                                <th key={i} className="px-3 py-2.5 text-right">
                                  {lbl}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800/60 font-mono">
                            {athletes.map((row: any, rIdx: number) => {
                              const ath = row.athlete;
                              const rowStats: string[] = row.stats || [];
                              return (
                                <tr key={ath?.id || rIdx} className="hover:bg-gray-800/40 transition-colors">
                                  <td className="px-4 py-2.5 font-sans font-medium">
                                    {ath?.id ? (
                                      <Link
                                        to={`/players/${ath.id}`}
                                        className="text-blue-400 hover:underline inline-flex items-center gap-1.5"
                                      >
                                        <span>{ath.displayName}</span>
                                        {ath.jersey && (
                                          <span className="text-[10px] font-mono text-gray-500">#{ath.jersey}</span>
                                        )}
                                      </Link>
                                    ) : (
                                      <span>{ath?.displayName || 'Player'}</span>
                                    )}
                                  </td>
                                  {labels.map((_, cIdx: number) => (
                                    <td key={cIdx} className="px-3 py-2.5 text-right text-gray-300">
                                      {rowStats[cIdx] ?? '-'}
                                    </td>
                                  ))}
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
            </>
          )}
        </div>
      )}

      {/* ── TAB 3: PLAY-BY-PLAY DRIVES ────────────────────────────────── */}
      {activeTab === 'DRIVES' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="bg-gray-950 px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <h3 className="font-bold text-base sm:text-lg text-white">Game Drive Chart ({drives.length} Drives)</h3>
            <span className="text-xs text-gray-400">Click any drive to inspect play-by-play</span>
          </div>

          {drives.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No drive data available for this matchup.</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {drives.map((drv: any, idx: number) => {
                const isExpanded = expandedDriveId === drv.id;
                const isScore = drv.isScore || ['TD', 'FG'].includes(drv.result);
                const plays: any[] = drv.plays || [];

                return (
                  <div key={drv.id || idx} className="transition-colors">
                    <button
                      onClick={() => setExpandedDriveId(isExpanded ? null : drv.id)}
                      className="w-full px-4 sm:px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-800/40 text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {drv.team?.logos?.[0]?.href && (
                          <img src={drv.team.logos[0].href} alt="" className="w-7 h-7 object-contain flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-white">
                              {drv.team?.abbreviation || drv.team?.name}
                            </span>
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                                isScore
                                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60'
                                  : 'bg-gray-800 text-gray-300 border-gray-700'
                              }`}
                            >
                              {drv.displayResult || drv.result || 'Drive'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">{drv.description}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs font-mono text-gray-400 hidden sm:inline">
                          {drv.start?.period?.type ? `Q${drv.start.period.number}` : ''}{' '}
                          {drv.start?.text ? `from ${drv.start.text}` : ''}
                        </span>
                        <span className="text-gray-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
                      </div>
                    </button>

                    {isExpanded && plays.length > 0 && (
                      <div className="bg-gray-950/80 px-4 sm:px-8 py-3 border-t border-gray-800/80 space-y-2.5">
                        {plays.map((pl: any, pIdx: number) => (
                          <div
                            key={pl.id || pIdx}
                            className={`text-xs flex items-start gap-3 py-1.5 border-b border-gray-800/40 last:border-none ${
                              pl.scoringPlay ? 'text-emerald-300 font-semibold' : 'text-gray-300'
                            }`}
                          >
                            <span className="font-mono text-gray-500 w-16 flex-shrink-0">
                              Q{pl.period?.number} {pl.clock?.displayValue}
                            </span>
                            <div className="flex-1">
                              {pl.start?.downDistanceText && (
                                <span className="text-[10px] font-mono text-blue-400 uppercase mr-2 bg-blue-950/40 px-1.5 py-0.5 rounded">
                                  {pl.start.downDistanceText}
                                </span>
                              )}
                              <span>{pl.text}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
