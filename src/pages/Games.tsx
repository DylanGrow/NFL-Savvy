import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { fetchStadiumsData, fetchRefereesData } from '../lib/data';

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

export default function Games() {
  const [phaseIdx, setPhaseIdx] = useState<number>(1); // default: Regular Season
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stadiums, setStadiums] = useState<Record<string, any>>({});
  const [referees, setReferees] = useState<any[]>([]);
  const chipRailRef = useRef<HTMLDivElement>(null);

  const phase = PHASES[phaseIdx];
  const currentWeeks = phase.weeks;
  const weekIdx = currentWeeks.findIndex(w => w.num === selectedWeek);
  const canPrev = weekIdx > 0 || phaseIdx > 0;
  const canNext = weekIdx < currentWeeks.length - 1 || phaseIdx < PHASES.length - 1;

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
    loadGames(phase.seasonType, selectedWeek);
  }, [phase.seasonType, selectedWeek, loadGames]);

  // Scroll the active chip into view
  useEffect(() => {
    const rail = chipRailRef.current;
    if (!rail) return;
    const active = rail.querySelector<HTMLButtonElement>('[data-active="true"]');
    active?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [selectedWeek, phaseIdx]);

  // ── Phase change ─────────────────────────────────────────
  const handlePhaseChange = (idx: number) => {
    setPhaseIdx(idx);
    setSelectedWeek(PHASES[idx].weeks[0].num);
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

  return (
    <div className="app-container py-4 sm:py-8 text-white font-sans space-y-5">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 p-4 sm:p-6 rounded-2xl">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">2026 NFL Schedule</h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          {phase.label} · {activeWeekLabel} · Stadium venues, dome weather, and referee crews
        </p>
      </div>

      {/* ── Season-phase toggle ───────────────────────── */}
      <div className="flex gap-2">
        {PHASES.map((p, i) => (
          <button
            key={p.label}
            onClick={() => handlePhaseChange(i)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors min-h-[40px] ${
              phaseIdx === i
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-gray-900 text-gray-400 hover:bg-gray-800 border border-gray-800'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ── Week selector + arrows ────────────────────── */}
      <div className="flex items-center gap-2">
        {/* Prev arrow */}
        <button
          onClick={goPrev}
          disabled={!canPrev}
          aria-label="Previous week"
          className="shrink-0 p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-300 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          ‹
        </button>

        {/* Chip rail */}
        <div
          ref={chipRailRef}
          className="flex overflow-x-auto touch-scroll pb-1 gap-2 scrollbar-none flex-1"
          style={{ scrollbarWidth: 'none' }}
        >
          {currentWeeks.map(w => (
            <button
              key={w.num}
              data-active={selectedWeek === w.num ? 'true' : 'false'}
              onClick={() => setSelectedWeek(w.num)}
              className={`px-3.5 py-2.5 rounded-xl whitespace-nowrap text-xs sm:text-sm font-semibold transition-colors min-h-[44px] ${
                selectedWeek === w.num
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-gray-900 text-gray-300 hover:bg-gray-800 border border-gray-800/80'
              }`}
            >
              {w.label}
            </button>
          ))}
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
      </div>

      {/* ── Loading skeletons ─────────────────────────── */}
      {loading && (
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
            onClick={() => loadGames(phase.seasonType, selectedWeek)}
            className="px-4 py-2 bg-red-800 hover:bg-red-700 rounded-lg text-sm font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Game cards ───────────────────────────────── */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 3xl:grid-cols-4 gap-3.5 sm:gap-4">
          {games.map(game => {
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
                className="block bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 p-4 rounded-xl transition-colors"
              >
                {/* Status row */}
                <div className="flex justify-between items-center mb-3">
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
                  <div className="flex items-center gap-1.5">
                    {refName && (
                      <span
                        className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700/60 flex items-center gap-1 max-w-[130px]"
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

                {/* Venue */}
                {venueName && (
                  <div className="mt-2.5 text-xs text-gray-500 truncate">
                    📍 {venueName}
                    {isDome ? ' · Dome' : ' · Outdoor'}
                  </div>
                )}
              </Link>
            );
          })}

          {games.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-500">
              <p className="text-4xl mb-3">🏈</p>
              <p className="text-lg font-semibold">No games scheduled</p>
              <p className="text-sm mt-1">
                {phase.label === 'Playoffs'
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
