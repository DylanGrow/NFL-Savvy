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
  const [currentWeek, setCurrentWeek] = useState<number | null>(null);
  const [offenseLeaders, setOffenseLeaders] = useState<any[]>([]);
  const [defenseLeaders, setDefenseLeaders] = useState<any[]>([]);
  const [injuries, setInjuries] = useState<any[]>([]);
  const [standings, setStandings] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [scoresRes, offRes, defRes, standRes] = await Promise.allSettled([
        api.fetchScoreboard(),
        api.fetchLeagueLeaders('passing'),
        api.fetchLeagueLeaders('sacks'),
        api.fetchStandings().catch(() => fetch('https://site.api.espn.com/apis/v2/sports/football/nfl/standings?season=2026').then(r => r.json()))
      ]);

      if (scoresRes.status === 'fulfilled') {
        const events = scoresRes.value?.events || [];
        setScoreboard(Array.isArray(events) ? events : []);
        if (scoresRes.value?.week?.number) {
          setCurrentWeek(scoresRes.value.week.number);
        }
      }

      if (offRes.status === 'fulfilled' && Array.isArray(offRes.value) && offRes.value.length > 0) {
        setOffenseLeaders(offRes.value);
      } else if (scoresRes.status === 'fulfilled') {
        const gameOffLeaders: any[] = [];
        (scoresRes.value?.events || []).forEach((e: any) => {
          (e.competitions?.[0]?.leaders || []).forEach((cat: any) => {
            const top = cat.leaders?.[0];
            if (top?.athlete && (cat.name === 'passingYards' || cat.name === 'rushingYards')) {
              gameOffLeaders.push({
                name: top.athlete.displayName,
                headshot: top.athlete.headshot,
                team: top.team?.abbreviation || '',
                statLine: top.displayValue,
                athleteId: top.athlete.id
              });
            }
          });
        });
        setOffenseLeaders(gameOffLeaders.slice(0, 3));
      }

      if (defRes.status === 'fulfilled' && Array.isArray(defRes.value)) {
        setDefenseLeaders(defRes.value);
      }

      if (standRes.status === 'fulfilled') {
        setStandings(standRes.value);
      }

      // Load notable injuries from active teams
      try {
        const sampleTeams = ['6', '25', '12', '21'];
        const rosters = await Promise.all(sampleTeams.map(tid => api.fetchRoster(tid).catch(() => null)));
        const injList: any[] = [];
        rosters.forEach(r => {
          if (!r?.athletes) return;
          const tm = r.team?.abbreviation || '';
          r.athletes.forEach((g: any) => {
            (g.items || []).forEach((p: any) => {
              const inj = p.injuries?.[0];
              if (inj && (inj.status === 'Out' || inj.status === 'Injured Reserve' || inj.status === 'Doubtful')) {
                injList.push({
                  name: p.displayName,
                  team: tm,
                  status: inj.status,
                  id: p.id
                });
              }
            });
          });
        });
        setInjuries(injList.slice(0, 6));
      } catch {}

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
            <span>🏈</span> {currentWeek ? `Week ${currentWeek}` : 'Live'} Matchups & Scores (2026 Season)
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
            {offenseLeaders.length ? offenseLeaders.slice(0, 3).map((l, i) => (
              <div 
                key={i} 
                onClick={() => l.athleteId && navigate(`/players/${l.athleteId}`)}
                className={`bg-gray-800 p-4 rounded-xl flex items-center gap-4 transition ${l.athleteId ? 'cursor-pointer hover:bg-gray-750' : ''}`}
              >
                <div className="w-12 h-12 bg-gray-700 rounded-full overflow-hidden flex-shrink-0">
                  {l.headshot && <img src={l.headshot} alt={l.name} className="w-full h-full object-cover"/>}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-white truncate">{l.name} <span className="text-gray-400 font-normal text-xs ml-1">{l.team}</span></h3>
                  <p className="text-sm font-semibold text-blue-400 truncate">{l.statLine}</p>
                </div>
              </div>
            )) : <p className="text-gray-500 italic">No offensive data.</p>}
          </div>
        </section>

        {/* Defensive Highlights */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">Defensive Highlights</h2>
          <div className="space-y-4">
             {defenseLeaders.length ? defenseLeaders.slice(0, 3).map((l, i) => (
              <div 
                key={i} 
                onClick={() => l.athleteId && navigate(`/players/${l.athleteId}`)}
                className={`bg-gray-800 p-4 rounded-xl flex items-center gap-4 transition ${l.athleteId ? 'cursor-pointer hover:bg-gray-750' : ''}`}
              >
                <div className="w-12 h-12 bg-gray-700 rounded-full overflow-hidden flex-shrink-0">
                  {l.headshot && <img src={l.headshot} alt={l.name} className="w-full h-full object-cover"/>}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-white truncate">{l.name} <span className="text-gray-400 font-normal text-xs ml-1">{l.team}</span></h3>
                  <p className="text-sm font-semibold text-red-400 truncate">{l.statLine}</p>
                </div>
              </div>
            )) : <p className="text-gray-500 italic">No defensive data.</p>}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Injuries */}
        <section>
           <h2 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">Notable Injuries (OUT / IR)</h2>
           <ul className="bg-gray-800 rounded-xl p-4 divide-y divide-gray-700">
             {injuries.length ? injuries.map((inj, i) => (
               <li 
                 key={i} 
                 onClick={() => inj.id && navigate(`/players/${inj.id}`)}
                 className={`py-2.5 flex justify-between items-center transition ${inj.id ? 'cursor-pointer hover:text-blue-300' : ''}`}
               >
                 <span className="font-medium text-sm">
                   {inj.name} <span className="text-xs text-gray-400 font-normal ml-1">({inj.team})</span>
                 </span>
                 <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800/60">
                   {inj.status}
                 </span>
               </li>
             )) : <p className="text-gray-500 italic py-2">No notable injuries.</p>}
           </ul>
        </section>

        {/* Standings Snapshot */}
        <section>
           <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-2">
             <h2 className="text-2xl font-semibold">Standings Snapshot</h2>
             <Link to="/standings" className="text-blue-400 hover:underline text-sm inline-block">
               View Full Standings &rarr;
             </Link>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             {/* AFC Leaders */}
             <div className="bg-gray-800 border border-gray-700/60 rounded-xl p-3.5 space-y-2">
               <div className="flex items-center gap-2 border-b border-gray-700 pb-1.5 text-xs font-bold text-red-400 uppercase">
                 <span className="w-2 h-2 rounded-full bg-red-500" /> AFC Leaders
               </div>
               <div className="space-y-1.5">
                 {(standings?.children?.[0]?.standings?.entries?.slice(0, 4) || []).map((e: any, idx: number) => {
                   const t = e.team;
                   const rec = e.stats?.find((s: any) => s.name === 'overall')?.displayValue || 
                              `${e.stats?.find((s: any) => s.name === 'wins')?.displayValue || 0}-${e.stats?.find((s: any) => s.name === 'losses')?.displayValue || 0}`;
                   return (
                     <div
                       key={idx}
                       onClick={() => navigate(`/teams/${t?.id}`)}
                       className="flex items-center justify-between p-1.5 rounded hover:bg-gray-700/50 cursor-pointer transition text-xs"
                     >
                       <div className="flex items-center gap-2 truncate">
                         <span className="text-gray-500 font-mono w-3">#{idx + 1}</span>
                         {t?.logos?.[0]?.href && <img src={t.logos[0].href} alt="" className="w-4 h-4 object-contain" />}
                         <span className="font-semibold text-gray-200 truncate">{t?.displayName || t?.abbreviation}</span>
                       </div>
                       <span className="font-mono font-bold text-gray-300 ml-2">{rec}</span>
                     </div>
                   );
                 })}
               </div>
             </div>

             {/* NFC Leaders */}
             <div className="bg-gray-800 border border-gray-700/60 rounded-xl p-3.5 space-y-2">
               <div className="flex items-center gap-2 border-b border-gray-700 pb-1.5 text-xs font-bold text-blue-400 uppercase">
                 <span className="w-2 h-2 rounded-full bg-blue-500" /> NFC Leaders
               </div>
               <div className="space-y-1.5">
                 {(standings?.children?.[1]?.standings?.entries?.slice(0, 4) || []).map((e: any, idx: number) => {
                   const t = e.team;
                   const rec = e.stats?.find((s: any) => s.name === 'overall')?.displayValue || 
                              `${e.stats?.find((s: any) => s.name === 'wins')?.displayValue || 0}-${e.stats?.find((s: any) => s.name === 'losses')?.displayValue || 0}`;
                   return (
                     <div
                       key={idx}
                       onClick={() => navigate(`/teams/${t?.id}`)}
                       className="flex items-center justify-between p-1.5 rounded hover:bg-gray-700/50 cursor-pointer transition text-xs"
                     >
                       <div className="flex items-center gap-2 truncate">
                         <span className="text-gray-500 font-mono w-3">#{idx + 1}</span>
                         {t?.logos?.[0]?.href && <img src={t.logos[0].href} alt="" className="w-4 h-4 object-contain" />}
                         <span className="font-semibold text-gray-200 truncate">{t?.displayName || t?.abbreviation}</span>
                       </div>
                       <span className="font-mono font-bold text-gray-300 ml-2">{rec}</span>
                     </div>
                   );
                 })}
               </div>
             </div>
           </div>
        </section>
      </div>
    </div>
  );
}
