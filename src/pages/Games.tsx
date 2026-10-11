import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { fetchStadiumsData, fetchRefereesData } from '../lib/data';
import { getInternationalGameInfo } from '../lib/international';
import { InternationalBadge } from '../components/game/InternationalBadge';

// ──────────────────────────────────────────────
// Season-phase configuration
// ──────────────────────────────────────────────
type SeasonType = 1 | 2 | 3;

interface PhaseConfig {
  label: string;
  seasonType: SeasonType;
  weeks: { num: number; label: string }[];
}

const PHASES: PhaseConfig[] = [
  {
    label: 'Preseason',
    seasonType: 1,
    weeks: [
      { num: 1, label: 'Hall of Fame' },
      { num: 2, label: 'Week 2' },
      { num: 3, label: 'Week 3' },
      { num: 4, label: 'Week 4' },
    ],
  },
  {
    label: 'Regular Season',
    seasonType: 2,
    weeks: Array.from({ length: 18 }, (_, i) => ({ num: i + 1, label: `Week ${i + 1}` })),
  },
  {
    label: 'Playoffs',
    seasonType: 3,
    weeks: [
      { num: 1, label: 'Wild Card' },
      { num: 2, label: 'Divisional' },
      { num: 3, label: 'Conference' },
      { num: 4, label: 'Pro Bowl' },
      { num: 5, label: 'Super Bowl' },
    ],
  },
];

const INTL_WEEKS = [1, 3, 4, 5, 6, 7, 9, 10, 11];

const INTL_DESTINATIONS = [
  { id: 'ALL', label: 'All 9 International Games' },
  { id: 'Australia', label: '🇦🇺 Melbourne (W1)' },
  { id: 'Brazil', label: '🇧🇷 Rio (W3)' },
  { id: 'United Kingdom', label: '🇬🇧 London (W4, 5, 6)' },
  { id: 'France', label: '🇫🇷 Paris (W7)' },
  { id: 'Spain', label: '🇪🇸 Madrid (W9)' },
  { id: 'Germany', label: '🇩🇪 Munich (W10)' },
  { id: 'Mexico', label: '🇲🇽 Mexico City (W11)' },
];

export default function Games() {
  const [phaseIdx, setPhaseIdx] = useState<number>(1); // default: Regular Season
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stadiums, setStadiums] = useState<Record<string, any>>({});
  const [referees, setReferees] = useState<any[]>([]);
  const chipRailRef = useRef<HTMLDivElement>(null);

  // International Series specialized state
  const [isIntlMode, setIsIntlMode] = useState<boolean>(false);
  const [intlGames, setIntlGames] = useState<any[]>([]);
  const [intlLoading, setIntlLoading] = useState<boolean>(false);
  const [selectedDestination, setSelectedDestination] = useState<string>('ALL');

  const phase = PHASES[phaseIdx];
  const currentWeeks = phase.weeks;
  const weekIdx = currentWeeks.findIndex(w => w.num === selectedWeek);
  const canPrev = !isIntlMode && (weekIdx > 0 || phaseIdx > 0);
  const canNext = !isIntlMode && (weekIdx < currentWeeks.length - 1 || phaseIdx < PHASES.length - 1);

  // ── Static data + current-week auto-detect ─────────────────
  useEffect(() => {
    document.title = 'Schedule | NFL Hub';

    fetchStadiumsData()
      .then(arr => {
        const map = arr.reduce((acc: any, s: any) => ({ ...acc, [s.name || s.fullName]: s }), {});
        setStadiums(map);
      })
      .catch(() => {});

    fetchRefereesData()
      .then(setReferees)
      .catch(() => {});

    // Auto-detect active regular-season week
    api.fetchScoreboard()
      .then(sb => {
        const curWeek = sb?.week?.number;
        if (typeof curWeek === 'number' && curWeek >= 1 && curWeek <= 18) {
          setPhaseIdx(1); // Regular Season
          setSelectedWeek(curWeek);
        }
      })
      .catch(() => {});
  }, []);

  // ── Load games when phase or week changes ─────────────────
  const loadGames = useCallback(async (seasonType: SeasonType, week: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchSchedule(seasonType, week);
      setGames(data.events || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isIntlMode) {
      loadGames(phase.seasonType, selectedWeek);
    }
  }, [phase.seasonType, selectedWeek, loadGames, isIntlMode]);

  // ── Load all 2026 International Games ─────────────────────
  const loadInternationalGames = useCallback(async () => {
    if (intlGames.length > 0) return;
    setIntlLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled(
        INTL_WEEKS.map(w => api.fetchSchedule(2, w))
      );
      const allIntl: any[] = [];
      results.forEach((res, idx) => {
        if (res.status === 'fulfilled' && res.value?.events) {
          const weekNum = INTL_WEEKS[idx];
          res.value.events.forEach((event: any) => {
            const intl = getInternationalGameInfo(event);
            if (intl) {
              allIntl.push({
                ...event,
                _weekNumber: weekNum,
                _intlInfo: intl,
              });
            }
          });
        }
      });
      setIntlGames(allIntl);
    } catch (err: any) {
      setError(err.message || 'Failed to load international series games');
    } finally {
      setIntlLoading(false);
    }
  }, [intlGames.length]);

  // Scroll the active chip into view
  useEffect(() => {
    const rail = chipRailRef.current;
    if (!rail) return;
    const active = rail.querySelector<HTMLButtonElement>('[data-active="true"]');
    active?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [selectedWeek, phaseIdx, selectedDestination, isIntlMode]);

  // ── Phase change ─────────────────────────────────────────
  const handlePhaseChange = (idx: number) => {
    setIsIntlMode(false);
    setPhaseIdx(idx);
    setSelectedWeek(PHASES[idx].weeks[0].num);
  };

  const handleActivateIntlMode = () => {
    setIsIntlMode(true);
    loadInternationalGames();
  };

  // ── Prev / Next ───────────────────────────────────────────
  const goPrev = () => {
    if (weekIdx > 0) {
      setSelectedWeek(currentWeeks[weekIdx - 1].num);
    } else if (phaseIdx > 0) {
      const prevPhase = PHASES[phaseIdx - 1];
      setPhaseIdx(phaseIdx - 1);
      setSelectedWeek(prevPhase.weeks[prevPhase.weeks.length - 1].num);
    }
  };

  const goNext = () => {
    if (weekIdx < currentWeeks.length - 1) {
      setSelectedWeek(currentWeeks[weekIdx + 1].num);
    } else if (phaseIdx < PHASES.length - 1) {
      const nextPhase = PHASES[phaseIdx + 1];
      setPhaseIdx(phaseIdx + 1);
      setSelectedWeek(nextPhase.weeks[0].num);
    }
  };

  const activeWeekLabel = currentWeeks.find(w => w.num === selectedWeek)?.label ?? `Week ${selectedWeek}`;

  // Check if current active regular season week has an international matchup
  const activeWeekIntlGame = !isIntlMode ? games.find(g => getInternationalGameInfo(g)) : null;
  const activeWeekIntlInfo = activeWeekIntlGame ? getInternationalGameInfo(activeWeekIntlGame) : null;

  // Filtered games to render
  const displayedGames = isIntlMode
    ? intlGames.filter(g => {
        if (selectedDestination === 'ALL') return true;
        const info = g._intlInfo || getInternationalGameInfo(g);
        return info?.country === selectedDestination || info?.city === selectedDestination;
      })
    : games;

  const isCurrentLoading = isIntlMode ? intlLoading : loading;

  return (
    <div className="app-container py-4 sm:py-8 text-white font-sans space-y-5">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 p-4 sm:p-6 rounded-2xl shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">2026 NFL Schedule</h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              {isIntlMode
                ? 'NFL International Series · 9 Overseas Neutral-Site Games Across 7 Countries'
                : `${phase.label} · ${activeWeekLabel} · Stadium venues, dome weather, and referee crews`}
            </p>
          </div>
          {isIntlMode && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-950/80 border border-indigo-500/50 text-indigo-300 text-xs font-bold">
              <span>✈️</span>
              <span>Global Series View</span>
            </span>
          )}
        </div>
      </div>

      {/* ── Season-phase toggle ───────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        {PHASES.map((p, i) => (
          <button
            key={p.label}
            onClick={() => handlePhaseChange(i)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors min-h-[40px] ${
              !isIntlMode && phaseIdx === i
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-gray-900 text-gray-400 hover:bg-gray-800 border border-gray-800'
            }`}
          >
            {p.label}
          </button>
        ))}

        {/* Dedicated International Series filter button */}
        <button
          onClick={handleActivateIntlMode}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all min-h-[40px] flex items-center gap-2 ${
            isIntlMode
              ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-400/50'
              : 'bg-indigo-950/70 text-indigo-300 hover:bg-indigo-900/80 border border-indigo-700/60'
          }`}
        >
          <span className="text-base leading-none">🌍</span>
          <span>International Series (9)</span>
        </button>
      </div>

      {/* ── Week or Destination Selector Rail ────────────────────── */}
      <div className="flex items-center gap-2">
        {!isIntlMode ? (
          <>
            {/* Prev arrow */}
            <button
              onClick={goPrev}
              disabled={!canPrev}
              aria-label="Previous week"
              className="shrink-0 p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-300 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              ‹
            </button>

            {/* Chip rail for Weeks */}
            <div
              ref={chipRailRef}
              className="flex overflow-x-auto touch-scroll pb-1 gap-2 scrollbar-none flex-1"
              style={{ scrollbarWidth: 'none' }}
            >
              {currentWeeks.map(w => {
                const hasIntlInWeek = phase.seasonType === 2 && INTL_WEEKS.includes(w.num);
                return (
                  <button
                    key={w.num}
                    data-active={selectedWeek === w.num ? 'true' : 'false'}
                    onClick={() => setSelectedWeek(w.num)}
                    className={`px-3.5 py-2.5 rounded-xl whitespace-nowrap text-xs sm:text-sm font-semibold transition-colors min-h-[44px] flex items-center gap-1.5 ${
                      selectedWeek === w.num
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-gray-900 text-gray-300 hover:bg-gray-800 border border-gray-800/80'
                    }`}
                  >
                    <span>{w.label}</span>
                    {hasIntlInWeek && (
                      <span className="text-xs" title="Features International Game" aria-label="International Game">
                        ✈️
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Next arrow */}
            <button
              onClick={goNext}
              disabled={!canNext}
              aria-label="Next week"
              className="shrink-0 p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-300 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              ›
            </button>
          </>
        ) : (
          /* Chip rail for International Destinations */
          <div
            ref={chipRailRef}
            className="flex overflow-x-auto touch-scroll pb-1 gap-2 scrollbar-none flex-1"
            style={{ scrollbarWidth: 'none' }}
          >
            {INTL_DESTINATIONS.map(d => (
              <button
                key={d.id}
                data-active={selectedDestination === d.id ? 'true' : 'false'}
                onClick={() => setSelectedDestination(d.id)}
                className={`px-3.5 py-2.5 rounded-xl whitespace-nowrap text-xs sm:text-sm font-semibold transition-colors min-h-[44px] ${
                  selectedDestination === d.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-900 text-gray-300 hover:bg-gray-800 border border-gray-800/80'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Featured International Alert Banner (when viewing regular season week with an intl game) ── */}
      {!isIntlMode && activeWeekIntlGame && activeWeekIntlInfo && (
        <div className="bg-gradient-to-r from-indigo-950 via-purple-950/80 to-indigo-950 border border-indigo-500/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-3.5">
            <span className="text-3xl sm:text-4xl filter drop-shadow-md select-none" role="img" aria-label={activeWeekIntlInfo.country}>
              {activeWeekIntlInfo.flag}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-indigo-300 bg-indigo-500/25 px-2 py-0.5 rounded border border-indigo-400/40">
                  NFL International Series
                </span>
                <span className="text-xs text-indigo-200/80 font-semibold hidden sm:inline">Featured Overseas Matchup</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-1">
                {activeWeekIntlInfo.headline} · {activeWeekIntlInfo.city}, {activeWeekIntlInfo.country}
              </h3>
              <p className="text-xs text-gray-300 mt-0.5">
                📍 {activeWeekIntlInfo.venue || 'Stadium'} · Neutral Site
              </p>
            </div>
          </div>
          <button
            onClick={handleActivateIntlMode}
            className="shrink-0 text-xs font-bold px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 transition-colors"
          >
            Explore All 9 Intl Games &rarr;
          </button>
        </div>
      )}

      {/* ── Loading skeletons ─────────────────────────── */}
      {isCurrentLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 h-36 animate-pulse" />
          ))}
        </div>
      )}

      {/* ── Error ────────────────────────────────────── */}
      {error && (
        <div className="text-red-300 bg-red-950/60 border border-red-800 p-6 rounded-2xl text-center space-y-3">
          <p>{error}</p>
          <button
            onClick={() => isIntlMode ? loadInternationalGames() : loadGames(phase.seasonType, selectedWeek)}
            className="px-4 py-2 bg-red-800 hover:bg-red-700 rounded-lg text-sm font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Game cards ───────────────────────────────── */}
      {!isCurrentLoading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 3xl:grid-cols-4 gap-3.5 sm:gap-4">
          {displayedGames.map(game => {
            const comp = game.competitions?.[0];
            const home = comp?.competitors?.find((c: any) => c.homeAway === 'home');
            const away = comp?.competitors?.find((c: any) => c.homeAway === 'away');
            const status = game.status?.type?.detail || 'Scheduled';
            const venueName = comp?.venue?.fullName;

            const stadium = venueName
              ? (Object.values(stadiums).find((s: any) =>
                  s.name === venueName || s.fullName === venueName || venueName.includes(s.name)
                ) as any)
              : null;
            const isDome = stadium?.isDome || stadium?.type === 'dome' || stadium?.type === 'retractable';

            // International game detection
            const intl = game._intlInfo || getInternationalGameInfo(game);

            const refName =
              comp?.officials?.find((o: any) =>
                o.position?.name?.toLowerCase().includes('referee') ||
                o.position?.displayName?.toLowerCase().includes('referee')
              )?.displayName ||
              (referees.length > 0
                ? referees[
                    Math.abs(
                      String(game.id)
                        .split('')
                        .reduce((a: number, c: string) => a + c.charCodeAt(0), 0)
                    ) % referees.length
                  ]?.referee
                : null);

            const isFinal = game.status?.type?.completed;
            const isLive = !isFinal && game.status?.type?.state === 'in';

            return (
              <Link
                to={`/games/${game.id}`}
                key={game.id}
                className={`block p-4 rounded-xl transition-all ${
                  intl
                    ? 'bg-gradient-to-b from-indigo-950/40 via-gray-900 to-gray-900 border-2 border-indigo-500/70 hover:border-indigo-400 shadow-lg shadow-indigo-950/40 hover:shadow-indigo-900/60'
                    : 'bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700'
                }`}
              >
                {/* Status row */}
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {game._weekNumber && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                        Week {game._weekNumber}
                      </span>
                    )}
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isFinal
                          ? 'bg-gray-700 text-gray-300'
                          : isLive
                          ? 'bg-green-900/70 text-green-300 animate-pulse'
                          : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {status}
                    </span>
                    {/* Special International Signifier */}
                    {intl && (
                      <InternationalBadge info={intl} variant="pill" />
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {refName && (
                      <span
                        className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700/60 flex items-center gap-1 max-w-[120px]"
                        title="Head Referee"
                      >
                        <span>🦓</span>
                        <span className="truncate">{refName}</span>
                      </span>
                    )}
                    {isDome && (
                      <span title="Dome Stadium" className="text-base leading-none">🏟️</span>
                    )}
                  </div>
                </div>

                {/* Scoreline */}
                <div className="flex justify-between items-center text-lg font-bold">
                  <div className="flex flex-col items-start">
                    <span className="text-gray-200">{away?.team?.abbreviation ?? '—'}</span>
                    {away?.score !== undefined && (
                      <span className="text-2xl font-extrabold tabular-nums">{away.score}</span>
                    )}
                  </div>
                  <span className="text-gray-600 text-sm font-normal">@</span>
                  <div className="flex flex-col items-end">
                    <span className="text-gray-200">{home?.team?.abbreviation ?? '—'}</span>
                    {home?.score !== undefined && (
                      <span className="text-2xl font-extrabold tabular-nums">{home.score}</span>
                    )}
                  </div>
                </div>

                {/* Venue & Overseas Host Signifier */}
                {intl ? (
                  <div className="mt-2.5 text-xs text-indigo-300 flex items-center justify-between font-medium pt-2 border-t border-indigo-900/40">
                    <span className="truncate flex items-center gap-1">
                      <span>✈️</span>
                      <span>{venueName ? `${venueName} · ` : ''}{intl.city}, {intl.country}</span>
                    </span>
                    <span className="text-[11px] text-indigo-400/90 font-semibold shrink-0 ml-1">
                      Neutral Site
                    </span>
                  </div>
                ) : venueName ? (
                  <div className="mt-2.5 text-xs text-gray-500 truncate pt-2 border-t border-gray-800/40">
                    📍 {venueName}
                    {isDome ? ' · Dome' : ' · Outdoor'}
                  </div>
                ) : null}
              </Link>
            );
          })}

          {displayedGames.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-500">
              <p className="text-4xl mb-3">🏈</p>
              <p className="text-lg font-semibold">No games scheduled</p>
              <p className="text-sm mt-1">
                {isIntlMode
                  ? 'No international games match the selected destination filter.'
                  : phase.label === 'Playoffs'
                  ? 'Playoff schedule will be available after the regular season.'
                  : phase.label === 'Preseason'
                  ? 'Preseason schedule will be available before the season.'
                  : 'No games found for this week.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
