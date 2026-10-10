import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const SkeletonRow = () => (
  <div className="animate-pulse flex items-center bg-gray-800 h-10 w-full mb-1 rounded"></div>
);

export default function Standings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [standingsData, setStandingsData] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ((api as any).fetchStandings?.() || fetch('https://site.api.espn.com/apis/v2/sports/football/nfl/standings').then(r => r.json()));
      const children = data?.children || [];
      setStandingsData(children);
    } catch (err) {
      setError('Failed to load standings data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Standings | NFL Hub';
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-gray-100 max-w-7xl mx-auto space-y-6">
        <div className="h-12 bg-gray-800 animate-pulse rounded w-1/3"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="space-y-2"><SkeletonRow/><SkeletonRow/><SkeletonRow/><SkeletonRow/></div>
           <div className="space-y-2"><SkeletonRow/><SkeletonRow/><SkeletonRow/><SkeletonRow/></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-400">
        <p>{error}</p>
        <button onClick={loadData} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Retry</button>
      </div>
    );
  }

  const renderConference = (conf: any) => {
    const name = conf?.name || 'Conference';
    const divisions = conf?.standings?.entries || conf?.children || [];

    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 shadow-xl overflow-x-auto touch-scroll">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white border-b border-gray-800 pb-2 flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${name.includes('AFC') ? 'bg-red-500' : 'bg-blue-500'}`} />
          {name}
        </h2>
        {divisions.map((div: any, i: number) => {
          const divName = div.name || `Division ${i+1}`;
          const teams = div.standings?.entries || [];
          return (
            <div key={i} className="mb-6 last:mb-0">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 bg-gray-950/70 px-2.5 py-1 rounded inline-block">
                {divName}
              </h3>
              <div className="overflow-x-auto touch-scroll">
                <table className="w-full text-sm text-left min-w-[340px]">
                  <thead className="text-[11px] text-gray-500 uppercase bg-gray-950/90 rounded border-b border-gray-800">
                    <tr>
                      <th className="px-3 py-2.5">Team</th>
                      <th className="px-2 py-2.5 text-right font-mono">W</th>
                      <th className="px-2 py-2.5 text-right font-mono">L</th>
                      <th className="px-2 py-2.5 text-right font-mono">T</th>
                      <th className="px-2 py-2.5 text-right font-mono">PCT</th>
                      <th className="px-2 py-2.5 text-right font-mono hidden sm:table-cell">PF</th>
                      <th className="px-2 py-2.5 text-right font-mono hidden sm:table-cell">PA</th>
                      <th className="px-2 py-2.5 text-right font-mono hidden sm:table-cell">STRK</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {teams.map((entry: any, j: number) => {
                      const t = entry.team;
                      const stats = entry.stats?.reduce((acc: any, s: any) => ({...acc, [s.abbreviation]: s.displayValue || s.value}), {}) || {};
                      const isDivisionLeader = j === 0;
                      const isWildcard = j > 0 && j < 4;
                      return (
                        <tr 
                          key={t?.id || j} 
                          tabIndex={0}
                          role="button"
                          aria-label={`View ${t?.displayName || t?.abbreviation} standings and roster`}
                          onClick={() => navigate(`/teams/${t?.id}`)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              navigate(`/teams/${t?.id}`);
                            }
                          }}
                          className="hover:bg-gray-800/70 cursor-pointer transition focus-visible:bg-gray-800 focus-visible:outline-none min-h-[44px]"
                        >
                          <td className="px-3 py-3 flex items-center gap-2">
                            {isDivisionLeader && <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" title="Division Leader"></div>}
                            {!isDivisionLeader && isWildcard && <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" title="Wild Card"></div>}
                            {!isDivisionLeader && !isWildcard && <div className="w-2 h-2 rounded-full bg-transparent flex-shrink-0"></div>}
                            
                            {t?.logos?.[0]?.href && <img src={t.logos[0].href} alt="" className="w-5 h-5 object-contain flex-shrink-0" />}
                            <span className="font-semibold text-gray-200 text-xs sm:text-sm truncate max-w-[130px] sm:max-w-none">
                              {t?.displayName || t?.abbreviation}
                            </span>
                          </td>
                          <td className="px-2 py-3 text-right font-mono text-xs sm:text-sm font-bold text-gray-100">{stats.W || 0}</td>
                          <td className="px-2 py-3 text-right font-mono text-xs sm:text-sm text-gray-300">{stats.L || 0}</td>
                          <td className="px-2 py-3 text-right font-mono text-xs sm:text-sm text-gray-400">{stats.T || 0}</td>
                          <td className="px-2 py-3 text-right font-mono text-xs sm:text-sm text-blue-400">{stats.PCT || '.000'}</td>
                          <td className="px-2 py-3 text-right font-mono text-xs hidden sm:table-cell text-gray-400">{stats.PF || 0}</td>
                          <td className="px-2 py-3 text-right font-mono text-xs hidden sm:table-cell text-gray-400">{stats.PA || 0}</td>
                          <td className="px-2 py-3 text-right font-mono text-xs hidden sm:table-cell text-gray-400">{stats.STRK || '-'}</td>
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
    );
  };

  return (
    <div className="app-container py-4 sm:py-8 text-gray-100 font-sans space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">NFL Standings</h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">Division race, wild card picture, points scored, and streak</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 3xl:grid-cols-2 gap-6 sm:gap-8">
        {standingsData.length === 0 ? (
           <p className="text-gray-400 p-8 text-center">No standings data available.</p>
        ) : standingsData.map((conf, i) => (
           <div key={i}>
             {renderConference(conf)}
           </div>
        ))}
      </div>
    </div>
  );
}
