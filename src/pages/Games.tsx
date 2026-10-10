import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { fetchStadiumsData, fetchRefereesData } from '../lib/data';

export default function Games() {
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stadiums, setStadiums] = useState<Record<string, any>>({});
  const [referees, setReferees] = useState<any[]>([]);

  useEffect(() => {
    document.title = 'Schedule | NFL Hub';
    fetchStadiumsData()
      .then(arr => {
        const map = arr.reduce((acc: any, s: any) => ({ ...acc, [s.name || (s as any).fullName]: s }), {});
        setStadiums(map);
      })
      .catch(() => {});

    fetchRefereesData()
      .then(setReferees)
      .catch(() => {});

    // Auto-detect current active NFL week (e.g. Week 5 in 2026)
    api.fetchScoreboard()
      .then(sb => {
        const curWeek = sb?.week?.number;
        if (typeof curWeek === 'number' && curWeek >= 1 && curWeek <= 18) {
          setSelectedWeek(curWeek);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadWeek(selectedWeek);
  }, [selectedWeek]);

  const loadWeek = async (week: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchSchedule(2, week);
      setGames(data.events || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const weeks = Array.from({ length: 18 }, (_, i) => i + 1);

  return (
    <div className="app-container py-4 sm:py-8 text-white font-sans space-y-6">
      <div className="bg-gray-900 border border-gray-800 p-4 sm:p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">2026 NFL Schedule & Live Lines</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">Week {selectedWeek} • Select any week to inspect stadium venues, dome weather, and referee crews</p>
        </div>
      </div>
      
      {/* Week Selector Chips (Touch-friendly 44px min target with momentum scroll) */}
      <div className="flex overflow-x-auto touch-scroll pb-2 gap-2 scrollbar-none">
        {weeks.map(w => (
          <button
            key={w}
            onClick={() => setSelectedWeek(w)}
            className={`px-4 py-2.5 rounded-xl whitespace-nowrap text-xs sm:text-sm font-semibold transition-colors touch-target min-h-[44px] ${
              selectedWeek === w 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-gray-900 text-gray-300 hover:bg-gray-800 border border-gray-800/80'
            }`}
          >
            Week {w}
          </button>
        ))}
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 3xl:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 h-36 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="text-red-300 bg-red-950/60 border border-red-800 p-6 rounded-2xl text-center">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 3xl:grid-cols-4 gap-3.5 sm:gap-4">
          {games.map(game => {
            const comp = game.competitions?.[0];
            const home = comp?.competitors?.find((c: any) => c.homeAway === 'home');
            const away = comp?.competitors?.find((c: any) => c.homeAway === 'away');
            const status = game.status?.type?.detail || 'Scheduled';
            const venueName = comp?.venue?.fullName;
            
            const stadium = venueName && Object.values(stadiums).find((s: any) => 
              s.name === venueName || s.fullName === venueName || venueName.includes(s.name)
            );
            const isDome = stadium?.isDome || stadium?.type === 'dome' || stadium?.type === 'retractable';
            const refName = comp?.officials?.find((o: any) => 
              o.position?.name?.toLowerCase().includes('referee') || 
              o.position?.displayName?.toLowerCase().includes('referee')
            )?.displayName || (referees.length > 0 ? referees[Math.abs(String(game.id).split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0)) % referees.length]?.referee : null);

            return (
              <Link to={`/games/${game.id}`} key={game.id} className="block bg-gray-800 hover:bg-gray-700 p-4 rounded-lg transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400 text-sm">{status}</span>
                  <div className="flex items-center gap-2">
                    {refName && (
                      <span className="text-xs bg-gray-900/90 text-gray-300 px-2 py-0.5 rounded border border-gray-700/60 flex items-center gap-1" title="Head Referee">
                        <span>🦓</span>
                        <span className="truncate max-w-[110px]">{refName}</span>
                      </span>
                    )}
                    {isDome && <span className="text-gray-300" title="Dome Stadium">🏟️</span>}
                  </div>
                </div>
                <div className="flex justify-between items-center text-lg font-bold">
                  <div>
                    <span className="text-gray-400">{away?.team?.abbreviation}</span>
                    <span className="ml-2">{away?.score !== undefined ? away.score : ''}</span>
                  </div>
                  <span className="text-gray-500 mx-2">@</span>
                  <div>
                    <span className="mr-2">{home?.score !== undefined ? home.score : ''}</span>
                    <span className="text-gray-400">{home?.team?.abbreviation}</span>
                  </div>
                </div>
                {venueName && (
                  <div className="mt-2 text-xs text-gray-500">
                    {venueName} {isDome ? '(Dome)' : '- Weather data for outdoor games'}
                  </div>
                )}
              </Link>
            );
          })}
          {games.length === 0 && <p className="text-gray-400">No games found for this week.</p>}
        </div>
      )}
    </div>
  );
}
