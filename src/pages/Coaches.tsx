import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchCoachesData } from '../lib/data';

interface Coach {
  id: string;
  firstName: string;
  lastName: string;
  experience?: number;
  role: string;
  teamId: string;
  teamAbbr: string;
  teamName: string;
  record?: string;
}

export default function Coaches() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    document.title = 'Coaches | NFL Hub';
    fetchCoachesData()
      .then(data => {
        setCoaches(data || []);
      })
      .catch(err => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const roles = ['ALL', 'Head Coach', 'Offensive Coordinator', 'Defensive Coordinator'];

  const filtered = useMemo(() => {
    return coaches.filter(c => {
      // Role filter
      if (filter !== 'ALL') {
        const roleLower = c.role.toLowerCase();
        const fLower = filter.toLowerCase();
        if (fLower === 'head coach' && !roleLower.includes('head')) return false;
        if (fLower === 'offensive coordinator' && !roleLower.includes('offensive coord')) return false;
        if (fLower === 'defensive coordinator' && !roleLower.includes('defensive coord')) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
        const teamMatch = (c.teamName || '').toLowerCase().includes(q) || (c.teamAbbr || '').toLowerCase().includes(q);
        const roleMatch = (c.role || '').toLowerCase().includes(q);
        if (!fullName.includes(q) && !teamMatch && !roleMatch) return false;
      }

      return true;
    });
  }, [coaches, filter, searchQuery]);

  const getRoleColor = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes('head')) return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
    if (r.includes('offensive coord')) return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    if (r.includes('defensive coord')) return 'bg-red-500/10 text-red-400 border-red-500/30';
    return 'bg-gray-700/50 text-gray-300 border-gray-600/30';
  };

  return (
    <div className="app-container py-4 sm:py-8 text-white font-sans space-y-6">
      <div className="bg-gray-900 border border-gray-800 p-4 sm:p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">2026 NFL Coaching Directory</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Head Coaches, Offensive Coordinators, and Defensive Coordinators across all 32 NFL franchises
          </p>
        </div>

        {/* Search input */}
        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Search coach, team, or role..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Role filter chips */}
      <div className="flex overflow-x-auto touch-scroll gap-2 pb-1 scrollbar-none">
        {roles.map(r => (
          <button
            key={r}
            onClick={() => setFilter(r)}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap min-h-[40px] ${
              filter === r
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-900 text-gray-300 hover:bg-gray-800 border border-gray-800/80'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-xl p-4 h-36 animate-pulse border border-gray-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4">
          {filtered.map((c, i) => (
            <Link
              to={`/teams/${c.teamId || c.teamAbbr}`}
              key={`${c.id}-${i}`}
              className="bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-gray-700 hover:bg-gray-850 transition flex flex-col justify-between shadow-sm group"
            >
              <div>
                <div className="flex justify-between items-start mb-2 gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-sm sm:text-base text-gray-100 group-hover:text-blue-400 transition-colors truncate">
                      {c.firstName} {c.lastName}
                    </div>
                    <div className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${getRoleColor(c.role)}`}>
                      {c.role}
                    </div>
                  </div>
                  {c.teamAbbr && (
                    <img
                      src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/${c.teamAbbr.toLowerCase()}.png&w=36&h=36`}
                      alt={c.teamAbbr}
                      className="w-9 h-9 object-contain shrink-0"
                    />
                  )}
                </div>

                {c.record && (
                  <div className="text-xs text-gray-400 mt-2 font-mono">
                    Record: <span className="text-gray-200 font-semibold">{c.record}</span>
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-400 flex justify-between items-end mt-4 pt-3 border-t border-gray-800/60">
                <span className="truncate">{c.teamName}</span>
                {c.experience !== undefined && c.experience > 0 && (
                  <span className="text-[11px] text-gray-500 shrink-0 ml-2">
                    {c.experience} yr{c.experience !== 1 ? 's' : ''} exp
                  </span>
                )}
              </div>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="text-gray-400 col-span-full py-12 text-center">
              No coaches match your search criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
