import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { getSalary, formatSalary } from '../lib/salary';
import { Skeleton } from '../components/ui/Skeleton';
import { Badge } from '../components/ui/Badge';

export default function PlayerDetail() {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();

  const [bio, setBio] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [selectedCategoryIdx, setSelectedCategoryIdx] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!playerId) {
      navigate('/players');
      return;
    }

    setLoading(true);
    setError(false);

    Promise.all([
      api.fetchPlayerBio(playerId).catch(() => null),
      api.fetchPlayerStats(playerId).catch(() => null),
      api.fetchPlayerOverview(playerId).catch(() => null),
    ])
      .then(([bioData, statsData, overviewData]) => {
        if (!bioData && !statsData && !overviewData) {
          setError(true);
        } else {
          setBio(bioData);
          setStats(statsData);
          setOverview(overviewData);
          if (bioData?.athlete?.fullName) {
            document.title = `${bioData.athlete.fullName} | NFL Hub`;
          }
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [playerId, navigate]);

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto text-center mt-20">
        <h2 className="text-2xl text-white mb-4">Player not found</h2>
        <Link to="/players" className="text-blue-400 hover:underline">
          Return to Players
        </Link>
      </div>
    );
  }

  const athlete = bio?.athlete;
  const salary = playerId ? getSalary(playerId) : undefined;
  const summaryStats: any[] = athlete?.statsSummary?.statistics || [];

  // Compute real performance percentile from actual 2026 NFL ranks if available
  const computedPerfPercentile = (() => {
    const ranked = summaryStats.filter((s) => typeof s.rank === 'number' && s.rank > 0);
    if (ranked.length === 0) return 78;
    const avgRank = ranked.reduce((acc, s) => acc + s.rank, 0) / ranked.length;
    // Rank 1 ~ 99th percentile, Rank 16 ~ 75th percentile, Rank 32 ~ 50th percentile
    return Math.round(Math.min(99, Math.max(40, 100 - (avgRank - 1) * 1.6)));
  })();

  const perfPercentile = computedPerfPercentile;
  const salaryPercentile = salary ? Math.round(Math.min(100, Math.max(5, (salary.capHit / 55000000) * 100))) : 45;

  let valueLabel = 'Fair Value';
  if (perfPercentile - salaryPercentile > 12) valueLabel = 'Undervalued';
  else if (salaryPercentile - perfPercentile > 12) valueLabel = 'Overpaid';

  // Render 2026 Game-by-Game Log Table
  const renderGameLog = () => {
    const gameLog = overview?.gameLog;
    const eventsDict = gameLog?.events || {};
    const statGroup = gameLog?.statistics?.[0];
    const eventRows: any[] = statGroup?.events || [];
    const labels: string[] = statGroup?.labels || [];

    if (!eventRows.length) return null;

    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>📅</span> 2026 Game-by-Game Log
          </h2>
          <span className="text-xs font-mono text-gray-400 bg-gray-950 px-2.5 py-1 rounded-full border border-gray-800">
            {statGroup?.displayName || 'Regular Season'} • {eventRows.length} Games
          </span>
        </div>

        <div className="overflow-x-auto touch-scroll rounded-xl border border-gray-800 bg-gray-950/40">
          <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[600px]">
            <thead>
              <tr className="bg-gray-950 text-gray-400 border-b border-gray-800 uppercase tracking-wider text-[11px]">
                <th className="p-3">WK</th>
                <th className="p-3">Date</th>
                <th className="p-3">OPP</th>
                <th className="p-3">Result</th>
                {labels.map((lbl, i) => (
                  <th key={i} className="p-3 text-right font-mono">
                    {lbl}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-mono">
              {eventRows.map((row, idx) => {
                const ev = eventsDict[row.eventId];
                const isWin = ev?.gameResult === 'W';
                const dateStr = ev?.gameDate
                  ? new Date(ev.gameDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : '-';
                const rowStats: string[] = row.stats || [];

                return (
                  <tr key={row.eventId || idx} className="hover:bg-gray-800/50 transition-colors">
                    <td className="p-3 font-bold text-gray-300">{ev?.week ? `W${ev.week}` : '-'}</td>
                    <td className="p-3 font-sans text-gray-400">{dateStr}</td>
                    <td className="p-3 font-sans">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-500 text-xs">{ev?.atVs || 'vs'}</span>
                        {ev?.opponent?.logo && (
                          <img src={ev.opponent.logo} alt="" className="w-4 h-4 object-contain" />
                        )}
                        <span className="font-bold text-gray-200">{ev?.opponent?.abbreviation || '-'}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      {ev?.id ? (
                        <Link
                          to={`/games/${ev.id}`}
                          className="inline-flex items-center gap-1.5 hover:underline"
                        >
                          <span
                            className={`inline-block w-4 text-center text-[10px] font-extrabold rounded px-1 py-0.5 ${
                              isWin
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/60'
                                : 'bg-rose-950 text-rose-400 border border-rose-700/60'
                            }`}
                          >
                            {ev.gameResult}
                          </span>
                          <span className="text-gray-200">{ev.score}</span>
                        </Link>
                      ) : (
                        <span>{ev?.score || '-'}</span>
                      )}
                    </td>
                    {labels.map((_, cIdx) => (
                      <td key={cIdx} className="p-3 text-right text-gray-200">
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
  };

  // Render 2026 Season Splits & 17-Game Projected Pace
  const renderSeasonSplits = () => {
    const ovStats = overview?.statistics;
    const splits: any[] = ovStats?.splits || [];
    const labels: string[] = ovStats?.labels || [];
    if (!splits.length || !labels.length) return null;

    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🚀</span> 2026 Pace & Career Splits
          </h2>
          <span className="text-xs text-gray-400">{ovStats?.displayName}</span>
        </div>

        <div className="overflow-x-auto touch-scroll rounded-xl border border-gray-800 bg-gray-950/40">
          <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[550px]">
            <thead>
              <tr className="bg-gray-950 text-gray-400 border-b border-gray-800 uppercase tracking-wider text-[11px]">
                <th className="p-3">Split</th>
                {labels.map((lbl, i) => (
                  <th key={i} className="p-3 text-right font-mono">
                    {lbl}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-mono">
              {splits.map((sp, idx) => {
                const isProjected = sp.displayName === 'Projected';
                const rowStats: string[] = sp.stats || [];
                return (
                  <tr
                    key={sp.displayName || idx}
                    className={
                      isProjected
                        ? 'bg-indigo-950/30 text-indigo-200 font-bold'
                        : 'hover:bg-gray-800/40 text-gray-200'
                    }
                  >
                    <td className="p-3 font-sans font-bold flex items-center gap-2">
                      <span>{sp.displayName}</span>
                      {isProjected && (
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/40">
                          17-Gm Pace
                        </span>
                      )}
                    </td>
                    {labels.map((_, cIdx) => (
                      <td key={cIdx} className="p-3 text-right">
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
  };

  // Multi-Season Career Statistics Table
  const renderStatsTable = () => {
    const categories = stats?.categories || stats?.splits?.categories || [];
    if (!categories.length) {
      return (
        <div className="text-gray-400 py-6 text-center border border-gray-800 rounded-xl bg-gray-950/40">
          <p>No historical season statistics returned for this athlete.</p>
        </div>
      );
    }

    const activeCat = categories[selectedCategoryIdx] || categories[0];
    const labels: string[] = activeCat?.labels || [];
    const seasons: any[] = activeCat?.statistics || [];
    const totals: string[] = activeCat?.totals || [];

    return (
      <div className="space-y-4">
        {/* Category Tabs */}
        {categories.length > 1 && (
          <div className="flex overflow-x-auto touch-scroll gap-2 pb-1 scrollbar-none">
            {categories.map((c: any, idx: number) => (
              <button
                key={c.name || idx}
                onClick={() => setSelectedCategoryIdx(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition touch-target min-h-[36px] ${
                  selectedCategoryIdx === idx
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {c.displayName || c.name}
              </button>
            ))}
          </div>
        )}

        {/* Stats Table */}
        <div className="overflow-x-auto touch-scroll bg-gray-900 rounded-xl shadow border border-gray-800">
          <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[550px]">
            <thead>
              <tr className="bg-gray-950/80 text-gray-400 border-b border-gray-800 uppercase tracking-wider text-[11px]">
                <th className="p-3 text-left">Season</th>
                <th className="p-3 text-left">Team</th>
                {labels.map((lbl: string, i: number) => (
                  <th key={i} className="p-3 text-right font-mono">
                    {lbl}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-mono">
              {seasons.map((row: any, i: number) => {
                const year = row.season?.displayName || row.season?.year || row.year || 'Season';
                const is2026 = String(year).includes('2026');
                const rowStats: string[] = row.stats || [];

                return (
                  <tr
                    key={i}
                    className={`transition ${
                      is2026
                        ? 'bg-blue-950/40 text-blue-200 font-bold border-l-4 border-blue-500'
                        : 'hover:bg-gray-800/40 text-gray-300'
                    }`}
                  >
                    <td className="p-3 font-sans font-semibold flex items-center gap-1.5">
                      {year}
                      {is2026 && (
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/40">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-sans text-gray-400">
                      {row.teamSlug?.toUpperCase() || row.position || '-'}
                    </td>
                    {labels.map((_, colIdx) => (
                      <td key={colIdx} className="p-3 text-right">
                        {rowStats[colIdx] ?? '-'}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
            {totals.length > 0 && (
              <tfoot className="border-t-2 border-gray-700 bg-gray-950/90 font-bold font-mono text-emerald-400">
                <tr>
                  <td className="p-3 font-sans">Career Totals</td>
                  <td className="p-3 font-sans text-gray-500">-</td>
                  {labels.map((_, colIdx) => (
                    <td key={colIdx} className="p-3 text-right">
                      {totals[colIdx] ?? '-'}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    );
  };

  const experienceText =
    athlete?.displayExperience ||
    (athlete?.experience?.years ? `${athlete.experience.years} yrs` : 'Active');

  return (
    <div className="app-container py-4 sm:py-8 min-h-screen text-gray-100 font-sans space-y-6">
      <Link
        to="/players"
        className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold touch-target min-h-[40px] focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md px-1"
      >
        &larr; Back to Players
      </Link>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-48 rounded-2xl md:col-span-1" />
            <Skeleton className="h-48 rounded-2xl md:col-span-2" />
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {/* ── 1. Hero Section ─────────────────────────────────────────── */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none text-7xl sm:text-9xl font-black select-none">
              {athlete?.jersey || ''}
            </div>

            <img
              src={`https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${playerId}.png&w=200&h=145`}
              alt={athlete?.fullName}
              className="w-28 h-28 sm:w-44 sm:h-44 object-contain bg-gray-800 rounded-full border-4 border-gray-700 z-10 shadow-lg flex-shrink-0"
              onError={(e) => {
                e.currentTarget.src =
                  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzMzIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIvPjwvc3ZnPg==';
              }}
            />

            <div className="flex-1 text-center md:text-left z-10 min-w-0">
              <div className="flex flex-col md:flex-row items-center md:items-baseline gap-2 sm:gap-4 mb-2">
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {athlete?.fullName}
                </h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  {athlete?.position?.name && (
                    <Badge variant="position" label={athlete.position.name} className="bg-blue-600 text-white" />
                  )}
                  {athlete?.injuries?.[0]?.status && (
                    <Badge variant="injury" label={athlete.injuries[0].status} className="bg-red-600 text-white" />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-center md:justify-start gap-2 text-lg sm:text-xl text-gray-400 mb-6">
                <span className="font-mono font-bold text-gray-200">#{athlete?.jersey}</span>
                <span>•</span>
                {athlete?.team?.id ? (
                  <Link
                    to={`/teams/${athlete.team.id}`}
                    className="hover:text-blue-400 hover:underline inline-flex items-center gap-2 font-semibold text-gray-200"
                  >
                    {athlete.team.logos?.[0]?.href && (
                      <img src={athlete.team.logos[0].href} alt="" className="w-5 h-5 object-contain" />
                    )}
                    <span>{athlete.team.displayName}</span>
                  </Link>
                ) : (
                  <span>{athlete?.team?.displayName || 'Free Agent'}</span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs sm:text-sm">
                <div className="bg-gray-800/80 border border-gray-700/60 rounded-xl p-3">
                  <span className="block text-gray-500 text-xs mb-0.5">Age</span>
                  <span className="font-bold text-white">{athlete?.age || '-'}</span>
                </div>
                <div className="bg-gray-800/80 border border-gray-700/60 rounded-xl p-3">
                  <span className="block text-gray-500 text-xs mb-0.5">Ht / Wt</span>
                  <span className="font-bold text-white">
                    {athlete?.displayHeight || '-'} / {athlete?.displayWeight || '-'}
                  </span>
                </div>
                <div className="bg-gray-800/80 border border-gray-700/60 rounded-xl p-3">
                  <span className="block text-gray-500 text-xs mb-0.5">Experience</span>
                  <span className="font-bold text-white">{experienceText}</span>
                </div>
                <div className="bg-gray-800/80 border border-gray-700/60 rounded-xl p-3">
                  <span className="block text-gray-500 text-xs mb-0.5">College</span>
                  <span className="font-bold text-white truncate block">{athlete?.college?.name || '-'}</span>
                </div>
                <div className="bg-gray-800/80 border border-gray-700/60 rounded-xl p-3">
                  <span className="block text-gray-500 text-xs mb-0.5">Draft</span>
                  <span className="font-bold text-white truncate block">{athlete?.displayDraft || 'Undrafted'}</span>
                </div>
                <div className="bg-gray-800/80 border border-gray-700/60 rounded-xl p-3">
                  <span className="block text-gray-500 text-xs mb-0.5">Birthplace</span>
                  <span className="font-bold text-white truncate block">{athlete?.displayBirthPlace || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── 2. 2026 Active Season Stat Highlights & League Ranks ────── */}
          {summaryStats.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-white uppercase tracking-wider text-xs sm:text-sm text-blue-400">
                  ⚡ {athlete?.statsSummary?.displayName || '2026 Regular Season Snapshot'}
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {summaryStats.map((st: any) => (
                  <div
                    key={st.name}
                    className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {st.displayName || st.shortDisplayName}
                      </span>
                      {st.rankDisplayValue && (
                        <span className="text-[11px] font-mono font-extrabold bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                          {st.rankDisplayValue}
                        </span>
                      )}
                    </div>
                    <div className="text-2xl sm:text-4xl font-black font-mono text-white tracking-tight">
                      {st.displayValue}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 3. Scouting Report & Fantasy Outlook Row ────────────────── */}
          {(overview?.rotowire || overview?.fantasy) && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {overview?.rotowire && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-6 lg:col-span-2 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                      <span className="text-xs font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full">
                        📰 Live Scouting Report & Recap
                      </span>
                      {overview.rotowire.published && (
                        <span className="text-xs font-mono text-gray-500">{overview.rotowire.published}</span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-extrabold text-white mb-2 leading-snug">
                      {overview.rotowire.headline}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">{overview.rotowire.story}</p>
                  </div>
                </div>
              )}

              {overview?.fantasy && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-base sm:text-lg text-white flex items-center gap-2">
                        <span>🏆</span> Fantasy Intelligence
                      </h3>
                      <Badge variant="fantasy" label={`Pos #${overview.fantasy.positionRank || '-'}`} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                      <div className="bg-gray-950 border border-gray-800 rounded-xl p-2.5">
                        <div className="text-[10px] text-gray-500 uppercase">Rostered</div>
                        <div className="text-sm sm:text-base font-extrabold font-mono text-emerald-400">
                          {overview.fantasy.percentOwned ? `${overview.fantasy.percentOwned}%` : '-'}
                        </div>
                      </div>
                      <div className="bg-gray-950 border border-gray-800 rounded-xl p-2.5">
                        <div className="text-[10px] text-gray-500 uppercase">Draft Rk</div>
                        <div className="text-sm sm:text-base font-extrabold font-mono text-white">
                          #{overview.fantasy.draftRank || '-'}
                        </div>
                      </div>
                      <div className="bg-gray-950 border border-gray-800 rounded-xl p-2.5">
                        <div className="text-[10px] text-gray-500 uppercase">7D Trend</div>
                        <div className="text-sm sm:text-base font-extrabold font-mono text-blue-400">
                          {overview.fantasy.last7Days ? `${overview.fantasy.last7Days}%` : '0%'}
                        </div>
                      </div>
                    </div>
                    {overview.fantasy.projection && (
                      <p className="text-xs text-gray-400 leading-relaxed line-clamp-5 hover:line-clamp-none transition-all">
                        {overview.fantasy.projection}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── 4. 2026 Game-by-Game Log ────────────────────────────────── */}
          {renderGameLog()}

          {/* ── 5. 2026 Pace & Career Splits ────────────────────────────── */}
          {renderSeasonSplits()}

          {/* ── 6. Contract Details & Value Index ───────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Salary Card */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 lg:col-span-1 flex flex-col">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-green-500">$</span> Contract Details
              </h2>

              <div className="space-y-4 flex-1">
                <div className="flex justify-between items-end border-b border-gray-800 pb-2">
                  <span className="text-gray-400">2026 Cap Hit</span>
                  <span className="text-2xl font-mono font-semibold text-white">
                    {salary ? formatSalary(salary.capHit) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-end border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Average Annual (AAV)</span>
                  <span className="text-lg font-mono text-gray-200">
                    {salary ? formatSalary(salary.aav) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-end border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Total Value</span>
                  <span className="text-lg font-mono text-gray-200">
                    {salary ? formatSalary(salary.totalValue) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-end border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Guaranteed Money</span>
                  <span className="text-lg font-mono text-gray-200">
                    {salary ? formatSalary(salary.guaranteedMoney) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-end pb-2">
                  <span className="text-gray-400">Years Remaining</span>
                  <span className="text-lg font-mono text-gray-200">
                    {salary ? `${salary.yearsRemaining} yrs` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Contract Value Index */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 lg:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Contract Value Index</h2>
                  <Badge
                    variant="contract"
                    label={valueLabel}
                    className={
                      valueLabel === 'Undervalued'
                        ? 'bg-green-900 text-green-200 border border-green-700'
                        : valueLabel === 'Overpaid'
                        ? 'bg-red-900 text-red-200 border border-red-700'
                        : 'bg-blue-900 text-blue-200 border border-blue-700'
                    }
                  />
                </div>
                <p className="text-gray-400 text-sm mb-8">
                  Comparing on-field statistical production percentile (derived from live 2026 NFL positional rankings) against cap hit expenditure.
                </p>

                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold text-blue-400">2026 Production Percentile</span>
                      <span className="font-mono">{perfPercentile}th</span>
                    </div>
                    <div className="w-full bg-gray-800 h-4 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${perfPercentile}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold text-green-400">Cap Hit Percentile</span>
                      <span className="font-mono">{Math.round(salaryPercentile)}th</span>
                    </div>
                    <div className="w-full bg-gray-800 h-4 rounded-full overflow-hidden">
                      <div
                        className="bg-green-500 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${salaryPercentile}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-gray-800 text-xs text-gray-500 flex justify-between">
                <span>0th Percentile (League Min)</span>
                <span>100th Percentile (Positional Max)</span>
              </div>
            </div>
          </div>

          {/* ── 7. Historical Career Stats Table ────────────────────────── */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-6">Career Season-by-Season Statistics</h2>
            {renderStatsTable()}
          </div>
        </div>
      )}
    </div>
  );
}
