import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SkeletonCard } from '../components/ui/Skeleton';
import { fetchTeamsData } from '../lib/data';
import type { Team } from '../types';

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conference, setConference] = useState<'ALL' | 'AFC' | 'NFC'>('ALL');
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Teams | NFL Hub';
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTeamsData();
      setTeams(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const filteredTeams = useMemo(() => {
    return teams.filter(t => {
      const matchConf = conference === 'ALL' || t.conference === conference;
      const matchSearch = filter === '' || 
        t.name.toLowerCase().includes(filter.toLowerCase()) || 
        t.division.toLowerCase().includes(filter.toLowerCase()) ||
        t.city.toLowerCase().includes(filter.toLowerCase()) ||
        t.abbreviation.toLowerCase().includes(filter.toLowerCase());
      return matchConf && matchSearch;
    });
  }, [teams, conference, filter]);

  // Group by Conference > Division
  const grouped = useMemo(() => {
    const map: Record<string, Record<string, Team[]>> = {};
    filteredTeams.forEach(t => {
      if (!map[t.conference]) map[t.conference] = {};
      if (!map[t.conference][t.division]) map[t.conference][t.division] = [];
      map[t.conference][t.division].push(t);
    });
    return map;
  }, [filteredTeams]);

  if (loading) {
    return (
      <div className="app-container py-6 sm:py-8 space-y-6">
        <div className="h-10 bg-gray-900 rounded-lg w-48 animate-pulse" />
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container py-12 text-center">
        <p className="text-red-400 font-medium">{error}</p>
        <button 
          onClick={loadData} 
          className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition shadow touch-target"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="app-container py-4 sm:py-8 text-gray-100 font-sans space-y-6 sm:space-y-8">
      {/* Header and Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-900 border border-gray-800 p-4 sm:p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">NFL Teams</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">All 32 franchises across AFC and NFC divisions</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {/* Conference Switcher with 44px min tap targets */}
          <div className="bg-gray-950 border border-gray-800 p-1 rounded-xl flex gap-1">
            {(['ALL', 'AFC', 'NFC'] as const).map(c => (
              <button
                key={c}
                onClick={() => setConference(c)}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition touch-target ${
                  conference === c 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-900'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Search team, city, div..."
              className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {Object.entries(grouped).length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center text-gray-400">
          No teams match your selected filters.
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(grouped).sort().map(([conf, divisions]) => (
            <div key={conf} className="space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-800 pb-2">
                <span className={`w-3 h-3 rounded-full ${conf === 'AFC' ? 'bg-red-500' : 'bg-blue-500'}`} />
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{conf}</h2>
              </div>

              <div className="space-y-6">
                {Object.entries(divisions).sort().map(([div, divTeams]) => (
                  <div key={div}>
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
                      {conf} {div}
                    </h3>

                    {/* Responsive Grid from iPhone SE (1 col / 2 col) to Ultrawide (5-6 cols) */}
                    <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-3 sm:gap-4">
                      {divTeams.sort((a, b) => a.name.localeCompare(b.name)).map((t, i) => (
                        <div
                          key={t.id || i}
                          role="button"
                          tabIndex={0}
                          aria-label={`View ${t.name} details`}
                          onClick={() => navigate(`/teams/${t.id || t.abbreviation}`)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              navigate(`/teams/${t.id || t.abbreviation}`);
                            }
                          }}
                          className="bg-gray-900 border border-gray-800 rounded-xl p-3.5 sm:p-4 cursor-pointer hover:bg-gray-850 hover:border-gray-700 transition flex flex-col justify-between gap-2 relative overflow-hidden shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98]"
                        >
                          <div 
                            className="absolute left-0 top-0 bottom-0 w-2" 
                            style={{ backgroundColor: t.primaryColor || '#00338D' }} 
                          />
                          <div className="ml-2">
                            <div className="flex justify-between items-start gap-1">
                              <h4 className="font-bold text-sm sm:text-base text-gray-100 truncate">{t.name}</h4>
                              <span className="text-[10px] font-mono font-bold bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">
                                {t.abbreviation}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{t.city}</p>
                            <span className="inline-block mt-2 text-[10px] font-medium border border-gray-700/80 rounded px-2 py-0.5 text-gray-400 bg-gray-950">
                              {t.conference} {t.division}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
