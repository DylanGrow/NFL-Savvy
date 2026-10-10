import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { fetchCoachesData } from '../lib/data';

interface Coach {
  id: string;
  firstName: string;
  lastName: string;
  experience?: number;
  role: string;
  teamAbbr: string;
  teamName: string;
  record?: string;
}

export default function Coaches() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    document.title = 'Coaches | NFL Savvy';
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

  const roles = ['ALL', 'Head Coach', 'Offensive Coordinator', 'Defensive Coordinator', 'Special Teams Coordinator'];

  const filtered = filter === 'ALL' 
    ? coaches 
    : coaches.filter(c => {
      const roleLower = c.role.toLowerCase();
      const fLower = filter.toLowerCase();
      if (fLower === 'head coach' && roleLower.includes('head')) return true;
      if (fLower === 'offensive coordinator' && roleLower.includes('offensive coord')) return true;
      if (fLower === 'defensive coordinator' && roleLower.includes('defensive coord')) return true;
      if (fLower === 'special teams coordinator' && roleLower.includes('special')) return true;
      return false;
    });

  const getRoleColor = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes('head')) return 'bg-yellow-600/20 text-yellow-500 border-yellow-600/50';
    if (r.includes('offensive coord')) return 'bg-blue-600/20 text-blue-400 border-blue-600/50';
    if (r.includes('defensive coord')) return 'bg-red-600/20 text-red-400 border-red-600/50';
    if (r.includes('special')) return 'bg-purple-600/20 text-purple-400 border-purple-600/50';
    return 'bg-gray-700 text-gray-300 border-gray-600';
  };

  return (
    <div className="app-container py-4 sm:py-8 text-white font-sans space-y-6">
      <div className="bg-gray-900 border border-gray-800 p-4 sm:p-6 rounded-2xl">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">NFL Coaching Staff Directory</h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">Head Coaches, Offensive & Defensive Coordinators, and assistants across all 32 franchises</p>
      </div>
      
      {/* Role filter buttons with touch scroll and minimum 40px touch targets */}
      <div className="flex overflow-x-auto touch-scroll gap-2 pb-2 scrollbar-none">
        {roles.map(r => (
          <button
            key={r}
            onClick={() => setFilter(r)}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap touch-target min-h-[40px] ${
              filter === r 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-gray-900 text-gray-300 hover:bg-gray-800 border border-gray-800/80'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-3.5 sm:gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-xl p-4 h-36 animate-pulse border border-gray-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-3.5 sm:gap-4">
          {filtered.map((c, i) => (
            <div 
              key={`${c.id}-${i}`} 
              tabIndex={0}
              className="bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition flex flex-col justify-between shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <div className="flex justify-between items-start mb-3 gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-sm sm:text-base text-gray-100 truncate">{c.firstName} {c.lastName}</div>
                  <div className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${getRoleColor(c.role)}`}>
                    {c.role}
                  </div>
                </div>
                {c.teamAbbr && (
                  <img 
                    src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/${c.teamAbbr.toLowerCase()}.png&w=32&h=32`}
                    alt={c.teamAbbr}
                    className="w-8 h-8 object-contain"
                  />
                )}
              </div>
              <div className="text-sm text-gray-400 flex justify-between items-end mt-4">
                <span>{c.teamName}</span>
                {c.experience !== undefined && c.experience > 0 && (
                  <span className="text-xs">{c.experience} yr{c.experience !== 1 ? 's' : ''} exp</span>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="text-gray-400 col-span-full">No coaches found for this filter.</div>}
        </div>
      )}
    </div>
  );
}
