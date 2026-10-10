import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { RefereeCard } from '../components/game/RefereeCard';
import { WeatherCard } from '../components/weather/WeatherCard';
import { fetchGameWeather } from '../lib/weather';
import { fetchStadiumsData, fetchRefereesData } from '../lib/data';
import type { Official, RefereeCrew, Weather } from '../types';

export default function GameDetail() {
  const { gameId } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stadiums, setStadiums] = useState<Record<string, any>>({});
  const [referees, setReferees] = useState<RefereeCrew[]>([]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    document.title = 'Game Detail | NFL Hub';
    fetchStadiumsData()
      .then(arr => {
        const map = arr.reduce((acc: any, s: any) => ({ ...acc, [s.name || (s as any).fullName]: s }), {});
        setStadiums(map);
      })
      .catch(() => {});

    fetchRefereesData()
      .then(setReferees)
      .catch(() => {});

    if (!gameId) return;

    api.fetchGame(gameId)
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Failed to load game details');
        setLoading(false);
      });
  }, [gameId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 space-y-4">
        <div className="bg-gray-800 h-32 animate-pulse rounded"></div>
        <div className="bg-gray-800 h-64 animate-pulse rounded"></div>
      </div>
    );
  }

  if (error) {
    return <div className="max-w-5xl mx-auto p-4 text-red-500">{error}</div>;
  }

  if (!data) return null;

  const header = data.header?.competitions?.[0] || {};
  const boxscore = data.boxscore || {};
  const scoringPlays = data.scoringPlays || [];
  const leaders = data.leaders || [];

  const home = header.competitors?.find((c: any) => c.homeAway === 'home');
  const away = header.competitors?.find((c: any) => c.homeAway === 'away');
  const status = header.status?.type?.detail || 'Scheduled';
  const venue = header.venue;
  const venueName = venue?.fullName;

  const stadium = venueName ? Object.values(stadiums).find((s: any) => s.name === venueName || s.fullName === venueName || venueName.includes(s.name)) : null;
  const isDome = stadium?.isDome || stadium?.type === 'dome' || stadium?.type === 'retractable';

  useEffect(() => {
    if (!stadium || isDome || !stadium.coordinates) {
      setWeather(null);
      setWeatherLoading(false);
      return;
    }

    const compDate = header.date || data?.header?.competitions?.[0]?.date;
    const gameDate = compDate ? compDate.split('T')[0] : new Date().toISOString().split('T')[0];

    setWeatherLoading(true);
    fetchGameWeather(stadium.coordinates.lat, stadium.coordinates.lon, gameDate)
      .then(w => setWeather(w))
      .catch(() => setWeather(null))
      .finally(() => setWeatherLoading(false));
  }, [stadium, isDome, header.date, data]);

  const teamStats = boxscore.teams || [];
  const homeStats = teamStats.find((t: any) => t.team?.id === home?.team?.id)?.statistics || [];
  const awayStats = teamStats.find((t: any) => t.team?.id === away?.team?.id)?.statistics || [];

  const statLabels = ['Total Yards', 'Net Passing Yards', 'Rushing Yards', 'First Downs', 'Third Down Eff', 'Turnovers', 'Total Penalties-Yards', 'Possession Time'];
  const displayLabels = ['Total Yards', 'Pass Yards', 'Rush Yards', '1st Downs', '3rd Down%', 'Turnovers', 'Penalties', 'TOP'];

  // Extract live officials from API
  const liveOfficials: Official[] = (data.gameInfo?.officials || header.officials || []).map((o: any) => ({
    displayName: o.displayName || o.fullName || 'Official',
    position: o.position?.displayName || o.position?.name || 'Official',
    jerseyNumber: o.order ? String(o.order) : undefined,
  }));

  const headRefOfficial = liveOfficials.find(o =>
    o.position?.toLowerCase().includes('referee') ||
    o.displayName?.toLowerCase().includes('referee')
  );

  const matchedCrew = headRefOfficial
    ? referees.find(r => r.referee.toLowerCase() === headRefOfficial.displayName.toLowerCase() || headRefOfficial.displayName.toLowerCase().includes(r.referee.toLowerCase()))
    : (referees.length > 0 ? referees[Math.abs((gameId ? gameId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : 0)) % referees.length] : null);

  return (
    <div className="app-container py-4 sm:py-8 text-white font-sans space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-8 text-center shadow-xl">
        <div className="inline-block px-3 py-1 bg-gray-950 text-blue-400 text-xs font-semibold rounded-full border border-gray-800 mb-4">
          {status}
        </div>
        <div className="flex items-center justify-between gap-2 sm:gap-6 max-w-2xl mx-auto">
          <div className="flex-1 text-center sm:text-right min-w-0">
            <h2 className="text-sm xs:text-base sm:text-2xl font-extrabold truncate text-gray-100">{away?.team?.displayName}</h2>
            <div className="text-3xl sm:text-5xl font-black font-mono mt-1 text-white tracking-tight">{away?.score || '0'}</div>
          </div>
          <div className="text-gray-500 font-extrabold text-xs sm:text-lg px-1 sm:px-3 select-none">@</div>
          <div className="flex-1 text-center sm:text-left min-w-0">
            <h2 className="text-sm xs:text-base sm:text-2xl font-extrabold truncate text-gray-100">{home?.team?.displayName}</h2>
            <div className="text-3xl sm:text-5xl font-black font-mono mt-1 text-white tracking-tight">{home?.score || '0'}</div>
          </div>
        </div>
        {venueName && <div className="text-gray-400 mt-4 text-xs sm:text-sm font-medium">{venueName}</div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="font-bold text-lg mb-4">Team Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500 mb-2 px-2">
                <span className="w-16 text-left">{away?.team?.abbreviation}</span>
                <span className="flex-1 text-center">STAT</span>
                <span className="w-16 text-right">{home?.team?.abbreviation}</span>
              </div>
              {statLabels.map((label, idx) => {
                const as = awayStats.find((s: any) => s.label === label)?.displayValue || '-';
                const hs = homeStats.find((s: any) => s.label === label)?.displayValue || '-';
                const aVal = parseFloat(as);
                const hVal = parseFloat(hs);
                const aBetter = !isNaN(aVal) && !isNaN(hVal) && aVal > hVal && label !== 'Turnovers';
                const hBetter = !isNaN(aVal) && !isNaN(hVal) && hVal > aVal && label !== 'Turnovers';

                return (
                  <div key={label} className="flex justify-between items-center py-2 border-b border-gray-700 px-2 text-sm">
                    <span className={`w-16 text-left ${aBetter ? 'font-bold text-white' : 'text-gray-400'}`}>{as}</span>
                    <span className="flex-1 text-center text-gray-400">{displayLabels[idx]}</span>
                    <span className={`w-16 text-right ${hBetter ? 'font-bold text-white' : 'text-gray-400'}`}>{hs}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="font-bold text-lg mb-4">Scoring Summary</h3>
            <div className="space-y-4">
              {scoringPlays.map((play: any) => (
                <div key={play.id} className="flex space-x-4 border-b border-gray-700 pb-4">
                  <div className="text-gray-400 w-12 flex-shrink-0 text-sm text-center">
                    <div>Q{play.period?.number}</div>
                    <div>{play.clock?.displayValue}</div>
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm mb-1">{play.team?.abbreviation} - {play.scoringType?.displayName}</div>
                    <div className="text-sm text-gray-300">{play.text}</div>
                  </div>
                  <div className="w-16 text-right font-bold text-sm flex-shrink-0">
                    {play.awayScore} - {play.homeScore}
                  </div>
                </div>
              ))}
              {scoringPlays.length === 0 && <p className="text-gray-400">No scoring plays available.</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="font-bold text-lg mb-4">Key Performers</h3>
            {leaders.map((teamLeader: any) => (
              <div key={teamLeader.team?.id} className="mb-6 last:mb-0">
                <div className="font-bold text-gray-400 mb-2">{teamLeader.team?.displayName}</div>
                <div className="space-y-3">
                  {teamLeader.leaders?.map((l: any) => {
                    const athlete = l.leaders?.[0]?.athlete;
                    if (!athlete) return null;
                    return (
                      <div key={l.name} className="flex items-center space-x-3">
                        {athlete.headshot?.href ? (
                          <img src={athlete.headshot.href} alt="" className="w-8 h-8 rounded-full bg-gray-700" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-700" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold truncate">{athlete.displayName}</div>
                          <div className="text-xs text-gray-400">{l.leaders[0].displayValue}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-800 rounded-lg p-4 space-y-4">
            <div>
              <h3 className="font-bold text-lg mb-2 text-white">Stadium & Venue</h3>
              <div className="text-sm space-y-1">
                <div className="font-bold text-base text-gray-100">{venueName || 'Unknown Venue'}</div>
                {stadium && (
                  <>
                    <div className="text-gray-400">Capacity: {stadium.capacity?.toLocaleString() || 'N/A'} • Surface: {stadium.surface || 'N/A'}</div>
                    <div className="text-gray-400">{stadium.city}, {stadium.state}</div>
                  </>
                )}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Game Conditions</div>
              <WeatherCard weather={weather} isDome={!!isDome} isLoading={weatherLoading} />
            </div>
          </div>

          {/* Officiating Crew / Referees */}
          <RefereeCard officials={liveOfficials} crew={matchedCrew} />
        </div>
      </div>
    </div>
  );
}
