import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const SkeletonCard = () => (
  <div className="animate-pulse bg-gray-800 rounded-lg h-32 w-full mb-4"></div>
);

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [scoreboard, setScoreboard] = useState<any[]>([]);
  const [offenseLeaders, setOffenseLeaders] = useState<any[]>([]);
  const [defenseLeaders, setDefenseLeaders] = useState<any[]>([]);
  const [injuries, setInjuries] = useState<any[]>([]);
  const [standings, setStandings] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [scoresRes, offRes, defRes, injRes, standRes] = await Promise.allSettled([
        (api as any).fetchScoreboard ? (api as any).fetchScoreboard() : fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard').then(r => r.json()),
        (api as any).fetchLeagueLeaders ? (api as any).fetchLeagueLeaders('passing') : Promise.resolve([]),
        (api as any).fetchLeagueLeaders ? (api as any).fetchLeagueLeaders('sacks') : Promise.resolve([]),
        Promise.resolve([]), // no global injuries
        (api as any).fetchStandings ? (api as any).fetchStandings() : fetch('https://site.api.espn.com/apis/v2/sports/football/nfl/standings').then(r => r.json())
      ]);

      if (scoresRes.status === 'fulfilled') {
        const events = scoresRes.value?.events || scoresRes.value || [];
        setScoreboard(Array.isArray(events) ? events : []);
      }
      if (offRes.status === 'fulfilled' && Array.isArray(offRes.value)) setOffenseLeaders(offRes.value);
      if (defRes.status === 'fulfilled' && Array.isArray(defRes.value)) setDefenseLeaders(defRes.value);
      if (injRes.status === 'fulfilled' && Array.isArray(injRes.value)) setInjuries(injRes.value);
      if (standRes.status === 'fulfilled') setStandings(standRes.value);

    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Home | NFL Hub';
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-gray-100 max-w-7xl mx-auto space-y-6">
        <div className="h-12 bg-gray-800 animate-pulse rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
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

  return (
    <div className="app-container py-4 sm:py-8 space-y-8 sm:space-y-10 font-sans">
      {/* Hero Bar */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-900 border border-gray-800 p-4 sm:p-6 rounded-2xl shadow-lg gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">2026 NFL Season Overview</h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">Live scores, advanced player analytics, salaries, and referee assignments</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="bg-gray-950/80 border border-gray-800 px-4 py-2.5 rounded-xl shadow-inner text-center flex-1 sm:flex-initial">
            <span className="block text-2xl font-bold font-mono text-emerald-400">
              {scoreboard.filter(e => e.status?.type?.state === 'in').length}
            </span>
            <span className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Live Now</span>
          </div>
          <div className="bg-gray-950/80 border border-gray-800 px-4 py-2.5 rounded-xl shadow-inner text-center flex-1 sm:flex-initial">
            <span className="block text-2xl font-bold font-mono text-blue-400">
              {scoreboard.length}
            </span>
            <span className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Total Games</span>
          </div>
        </div>
      </section>

      {/* Live Scoreboard */}
      <section>
        <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <span>🏈</span> Week Matchups & Scores
          </h2>
          <span className="text-xs text-gray-500">Tap or click any game for full breakdown</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-3.5 sm:gap-5">
          {scoreboard.length === 0 ? (
            <p className="text-gray-400 col-span-full py-8 text-center">No games scheduled for this slate.</p>
          ) : scoreboard.map((game, i) => {
            const home = game.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'home');
            const away = game.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away');
            const status = game.status?.type?.detail || 'Scheduled';
            const dome = game.weather?.indoor ? '🏟️ Dome' : (game.weather?.displayValue || '');
            const awayColor = away?.team?.color ? `#${away.team.color}` : '#00338D';
            const homeColor = home?.team?.color ? `#${home.team.color}` : '#E31837';

            return (
              <div 
                key={game.id || i} 
                role="button"
                tabIndex={0}
                aria-label={`Game matchup: ${away?.team?.displayName || 'Away'} at ${home?.team?.displayName || 'Home'}, status ${status}`}
                onClick={() => navigate(`/games/${game.id}`)} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/games/${game.id}`);
                  }
                }}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:bg-gray-850 hover:border-gray-700 transition-all shadow-md focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98]"
              >
                <div className="flex justify-between items-center text-xs text-gray-400 mb-3 border-b border-gray-800/60 pb-2">
                  <span className="font-medium text-blue-400">{status}</span>
                  {dome && <span className="text-[11px] bg-gray-800 px-2 py-0.5 rounded text-gray-300">{dome}</span>}
                </div>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3.5 h-3.5 rounded-full border border-gray-700 flex-shrink-0" style={{ backgroundColor: awayColor }}></div>
                      <span className="font-bold text-sm sm:text-base text-gray-100">{away?.team?.abbreviation || 'AWAY'}</span>
                      <span className="text-xs text-gray-500 hidden xs:inline truncate max-w-[120px]">{away?.team?.name}</span>
                    </div>
                    <span className="text-xl font-bold font-mono text-white">{away?.score || '0'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3.5 h-3.5 rounded-full border border-gray-700 flex-shrink-0" style={{ backgroundColor: homeColor }}></div>
                      <span className="font-bold text-sm sm:text-base text-gray-100">{home?.team?.abbreviation || 'HOME'}</span>
                      <span className="text-xs text-gray-500 hidden xs:inline truncate max-w-[120px]">{home?.team?.name}</span>
                    </div>
                    <span className="text-xl font-bold font-mono text-white">{home?.score || '0'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Offensive Highlights */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">Offensive Highlights</h2>
          <div className="space-y-4">
            {offenseLeaders.length ? offenseLeaders.slice(0,3).map((l, i) => (
              <div key={i} className="bg-gray-800 p-4 rounded-lg flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-700 rounded-full overflow-hidden">
                  {l.headshot && <img src={l.headshot} alt={l.name} className="w-full h-full object-cover"/>}
                </div>
                <div>
                  <h3 className="font-bold">{l.name} <span className="text-gray-400 font-normal text-sm">{l.team}</span></h3>
                  <p className="text-sm text-blue-400">{l.statLine}</p>
                </div>
              </div>
            )) : <p className="text-gray-500 italic">No offensive data.</p>}
          </div>
        </section>

        {/* Defensive Highlights */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">Defensive Highlights</h2>
          <div className="space-y-4">
             {defenseLeaders.length ? defenseLeaders.slice(0,3).map((l, i) => (
              <div key={i} className="bg-gray-800 p-4 rounded-lg flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-700 rounded-full overflow-hidden">
                  {l.headshot && <img src={l.headshot} alt={l.name} className="w-full h-full object-cover"/>}
                </div>
                <div>
                  <h3 className="font-bold">{l.name} <span className="text-gray-400 font-normal text-sm">{l.team}</span></h3>
                  <p className="text-sm text-red-400">{l.statLine}</p>
                </div>
              </div>
            )) : <p className="text-gray-500 italic">No defensive data.</p>}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Injuries */}
        <section>
           <h2 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">Notable Injuries (OUT)</h2>
           <ul className="bg-gray-800 rounded-lg p-4 divide-y divide-gray-700">
             {injuries.length ? injuries.map((inj, i) => (
               <li key={i} className="py-2 flex justify-between">
                 <span className="font-medium">{inj.name} <span className="text-xs text-gray-400">{inj.team}</span></span>
                 <span className="text-sm text-red-400">{inj.status}</span>
               </li>
             )) : <p className="text-gray-500 italic py-2">No notable injuries.</p>}
           </ul>
        </section>

        {/* Standings Snapshot */}
        <section>
           <h2 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">Standings Snapshot</h2>
           <div className="bg-gray-800 rounded-lg p-4">
             <Link to="/standings" className="text-blue-400 hover:underline text-sm mb-4 inline-block">View Full Standings &rarr;</Link>
             <p className="text-gray-500 italic">Snapshot available in full standings.</p>
           </div>
        </section>
      </div>
    </div>
  );
}
