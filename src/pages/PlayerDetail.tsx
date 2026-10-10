import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { getSalary, formatSalary } from '../lib/salary';
import { Skeleton, SkeletonCard, SkeletonTable } from '../components/ui/Skeleton';
import { Badge } from '../components/ui/Badge';

export default function PlayerDetail() {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();

  const [bio, setBio] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
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
      api.fetchPlayerStats(playerId).catch(() => null)
    ]).then(([bioData, statsData]) => {
      if (!bioData && !statsData) {
        setError(true);
      } else {
        setBio(bioData);
        setStats(statsData);
        if (bioData?.athlete?.fullName) {
          document.title = `${bioData.athlete.fullName} | NFL Hub`;
        }
      }
    }).finally(() => {
      setLoading(false);
    });
  }, [playerId, navigate]);

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto text-center mt-20">
        <h2 className="text-2xl text-white mb-4">Player not found</h2>
        <Link to="/players" className="text-blue-400 hover:underline">Return to Players</Link>
      </div>
    );
  }

  const athlete = bio?.athlete;
  const salary = playerId ? getSalary(playerId) : undefined;

  // Derive percentiles (mocked for demo purposes, could be derived from actual stats)
  const perfPercentile = 85; 
  const salaryPercentile = salary ? Math.min(100, Math.max(0, (salary.capHit / 40000000) * 100)) : 50;
  
  let valueLabel = 'Fair Value';
  if (perfPercentile - salaryPercentile > 15) valueLabel = 'Undervalued';
  else if (salaryPercentile - perfPercentile > 15) valueLabel = 'Overpaid';

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
                  <th key={i} className="p-3 text-right font-mono">{lbl}</th>
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
          {/* Hero Section */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none text-7xl sm:text-9xl font-black select-none">
              {athlete?.jersey || ''}
            </div>
            
            <img 
              src={`https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${playerId}.png&w=200&h=145`} 
              alt={athlete?.fullName}
              className="w-28 h-28 sm:w-44 sm:h-44 object-contain bg-gray-800 rounded-full border-4 border-gray-700 z-10 shadow-lg flex-shrink-0"
              onError={(e) => { e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzMzIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIvPjwvc3ZnPg=='; }}
            />
            
            <div className="flex-1 text-center md:text-left z-10 min-w-0">
              <div className="flex flex-col md:flex-row items-center md:items-baseline gap-2 sm:gap-4 mb-2">
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">{athlete?.fullName}</h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  {athlete?.position?.name && (
                    <Badge variant="position" label={athlete.position.name} className="bg-blue-600 text-white" />
                  )}
                  {athlete?.injuries?.[0]?.status && (
                    <Badge variant="injury" label={athlete.injuries[0].status} className="bg-red-600 text-white" />
                  )}
                </div>
              </div>
              
              <p className="text-xl text-gray-400 mb-6">
                #{athlete?.jersey} • {athlete?.team?.displayName || 'Free Agent'}
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div className="bg-gray-800 rounded-lg p-3">
                  <span className="block text-gray-500 mb-1">Age</span>
                  <span className="font-semibold">{athlete?.age || '-'}</span>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <span className="block text-gray-500 mb-1">Ht / Wt</span>
                  <span className="font-semibold">{athlete?.displayHeight} / {athlete?.displayWeight}</span>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <span className="block text-gray-500 mb-1">Experience</span>
                  <span className="font-semibold">{athlete?.experience?.years ? `${athlete.experience.years} yrs` : 'Rookie'}</span>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <span className="block text-gray-500 mb-1">College</span>
                  <span className="font-semibold truncate">{athlete?.college?.name || '-'}</span>
                </div>
              </div>
            </div>
          </div>

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
                  <span className="text-gray-400">AAV</span>
                  <span className="text-lg font-mono text-gray-200">
                    {salary?.aav ? formatSalary(salary.aav) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-end border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Total Value</span>
                  <span className="text-lg font-mono text-gray-200">
                    {salary?.totalValue ? formatSalary(salary.totalValue) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-end border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Guaranteed</span>
                  <span className="text-lg font-mono text-gray-200">
                    {salary?.guaranteedMoney ? formatSalary(salary.guaranteedMoney) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-end pb-2">
                  <span className="text-gray-400">Years Left</span>
                  <span className="text-lg font-mono text-gray-200">
                    {salary?.yearsRemaining || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Contract Value Index */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Contract Value Index</h2>
                <Badge variant="contract" label={valueLabel} className={
                  valueLabel === 'Undervalued' ? 'bg-green-600' :
                  valueLabel === 'Overpaid' ? 'bg-red-600' : 'bg-gray-600'
                } />
              </div>

              <div className="space-y-8 mt-8">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400 font-medium">Performance Percentile</span>
                    <span className="font-mono">{perfPercentile}th</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
                    <div className="bg-blue-500 h-4 rounded-full" style={{ width: `${perfPercentile}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400 font-medium">Salary Percentile (Positional)</span>
                    <span className="font-mono">{Math.round(salaryPercentile)}th</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
                    <div className="bg-green-500 h-4 rounded-full" style={{ width: `${salaryPercentile}%` }}></div>
                  </div>
                </div>
              </div>
              <p className="mt-8 text-sm text-gray-500">
                * Note: Value Index is a modeled projection based on production vs cap allocation.
              </p>
            </div>
          </div>

          {/* Season Stats */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-6">2026 Season Stats</h2>
            {renderStatsTable()}
          </div>
        </div>
      )}
    </div>
  );
}
