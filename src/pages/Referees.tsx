import { useState, useEffect, useMemo } from 'react';
import { RefereeCard } from '../components/game/RefereeCard';
import { fetchRefereesData } from '../lib/data';
import type { RefereeCrew } from '../types';

type SortOption = 'flags_desc' | 'flags_asc' | 'experience' | 'home_win';

export default function Referees() {
  const [referees, setReferees] = useState<RefereeCrew[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('flags_desc');

  useEffect(() => {
    document.title = 'NFL Referees & Officiating Crews | NFL Hub';
    fetchRefereesData()
      .then(data => {
        setReferees(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Failed to load referee data');
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    let result = referees.filter(r => {
      const q = search.toLowerCase();
      return (
        r.referee.toLowerCase().includes(q) ||
        r.jerseyNumber.includes(q) ||
        (r.penaltyStats?.tendency.toLowerCase().includes(q) ?? false) ||
        (r.umpire?.toLowerCase().includes(q) ?? false) ||
        (r.downJudge?.toLowerCase().includes(q) ?? false)
      );
    });

    return result.sort((a, b) => {
      if (sortBy === 'flags_desc') {
        return (b.penaltyStats?.avgPenaltiesPerGame || 0) - (a.penaltyStats?.avgPenaltiesPerGame || 0);
      }
      if (sortBy === 'flags_asc') {
        return (a.penaltyStats?.avgPenaltiesPerGame || 0) - (b.penaltyStats?.avgPenaltiesPerGame || 0);
      }
      if (sortBy === 'experience') {
        return b.experience - a.experience;
      }
      if (sortBy === 'home_win') {
        return (b.penaltyStats?.homeWinPct || 0) - (a.penaltyStats?.homeWinPct || 0);
      }
      return 0;
    });
  }, [referees, search, sortBy]);

  return (
    <div className="app-container py-4 sm:py-8 text-white font-sans space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="bg-gray-900 border border-gray-800 p-4 sm:p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-2xl" aria-hidden="true">🦓</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">NFL Officiating Crews & Referees</h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-400">
            Track all 17 active NFL crew chiefs, historical penalty averages, crew tendencies, and full officiating rosters.
          </p>
        </div>

        {/* Quick summary stat pills */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-gray-950 border border-gray-800 px-3.5 py-2 rounded-xl text-center flex-1 md:flex-initial">
            <div className="text-lg font-bold font-mono text-amber-400">17</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Active Crews</div>
          </div>
          <div className="bg-gray-950 border border-gray-800 px-3.5 py-2 rounded-xl text-center flex-1 md:flex-initial">
            <div className="text-lg font-bold font-mono text-emerald-400">13.8</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">NFL Avg Flags</div>
          </div>
        </div>
      </div>

      {/* Search and Sort Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="relative flex-1 sm:max-w-md">
          <input
            type="text"
            placeholder="Search by referee name, uniform #, or crew tendency..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 min-h-[44px]"
          />
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="ref-sort" className="text-xs text-gray-400 font-semibold whitespace-nowrap">Sort By:</label>
          <select
            id="ref-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 min-h-[44px]"
          >
            <option value="flags_desc">Most Flags / Game</option>
            <option value="flags_asc">Fewest Flags / Game</option>
            <option value="experience">Years Experience</option>
            <option value="home_win">Highest Home Win %</option>
          </select>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-950/60 border border-red-800 text-red-300 p-6 rounded-2xl text-center">
          {error}
        </div>
      )}

      {/* Grid of Referee Cards */}
      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 p-12 rounded-2xl text-center text-gray-400">
              No referees found matching "{search}".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-4 sm:gap-6">
              {filtered.map(crew => (
                <RefereeCard 
                  key={crew.id} 
                  crew={crew} 
                  className="shadow-md hover:border-gray-700 transition-all focus-within:ring-2 focus-within:ring-blue-500"
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
