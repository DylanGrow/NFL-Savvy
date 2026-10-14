import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchStadiumsData, fetchTeamsData } from '../lib/data';
import { fetchGameWeather } from '../lib/weather';
import type { Stadium, Team, Weather } from '../types';

interface EnrichedStadium extends Stadium {
  teams: Team[];
  weather?: Weather | null;
  loadingWeather?: boolean;
}

export default function Stadiums() {
  const [stadiums, setStadiums] = useState<EnrichedStadium[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roofFilter, setRoofFilter] = useState<'ALL' | 'DOME' | 'OUTDOOR'>('ALL');
  const [surfaceFilter, setSurfaceFilter] = useState<'ALL' | 'Grass' | 'Turf'>('ALL');
  const [sortBy, setSortBy] = useState<'capacity' | 'opened' | 'name'>('capacity');

  useEffect(() => {
    document.title = 'NFL Stadiums & Weather Forecasts | NFL Savvy';

    async function load() {
      try {
        const [stadsData, teamsData] = await Promise.all([
          fetchStadiumsData(),
          fetchTeamsData(),
        ]);

        const enriched: EnrichedStadium[] = stadsData.map(s => {
          // Find all teams playing in this stadium
          const matchingTeams = teamsData.filter(
            t => t.stadiumId === s.id || (s.id === 'sofi' && (t.id === '14' || t.id === '24' || t.abbreviation === 'LAR' || t.abbreviation === 'LAC')) || (s.id === 'met' && (t.id === '19' || t.id === '20' || t.abbreviation === 'NYG' || t.abbreviation === 'NYJ'))
          );
          return {
            ...s,
            teams: matchingTeams,
            weather: null,
            loadingWeather: !s.isDome, // only load weather for outdoor stadiums
          };
        });

        setStadiums(enriched);

        // Fetch live weather for outdoor stadiums in the background (today's date)
        const todayStr = new Date().toISOString().split('T')[0];
        enriched.forEach(async (stadium) => {
          if (!stadium.isDome && stadium.coordinates) {
            try {
              const w = await fetchGameWeather(stadium.coordinates.lat, stadium.coordinates.lon, todayStr);
              setStadiums(prev =>
                prev.map(item => (item.id === stadium.id ? { ...item, weather: w, loadingWeather: false } : item))
              );
            } catch {
              setStadiums(prev =>
                prev.map(item => (item.id === stadium.id ? { ...item, loadingWeather: false } : item))
              );
            }
          }
        });
      } catch (err) {
        console.warn('Failed to load stadiums:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filteredStadiums = useMemo(() => {
    let list = stadiums.filter(s => {
      // Roof filter
      if (roofFilter === 'DOME' && !s.isDome) return false;
      if (roofFilter === 'OUTDOOR' && s.isDome) return false;

      // Surface filter
      if (surfaceFilter === 'Grass' && s.surface.toLowerCase() !== 'grass') return false;
      if (surfaceFilter === 'Turf' && s.surface.toLowerCase() === 'grass') return false;

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesCity = s.city.toLowerCase().includes(q) || s.state.toLowerCase().includes(q);
        const matchesTeam = s.teams.some(t => t.name.toLowerCase().includes(q) || t.abbreviation.toLowerCase().includes(q));
        if (!matchesName && !matchesCity && !matchesTeam) return false;
      }

      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === 'capacity') return b.capacity - a.capacity;
      if (sortBy === 'opened') return (b.opened || 2000) - (a.opened || 2000);
      return a.name.localeCompare(b.name);
    });
  }, [stadiums, roofFilter, surfaceFilter, search, sortBy]);

  const statsSummary = useMemo(() => {
    const total = stadiums.length;
    const domes = stadiums.filter(s => s.isDome).length;
    const grass = stadiums.filter(s => s.surface.toLowerCase() === 'grass').length;
    const avgCap = total ? Math.round(stadiums.reduce((sum, s) => sum + s.capacity, 0) / total) : 69000;
    return { total, domes, grass, avgCap };
  }, [stadiums]);

  return (
    <div className="app-container py-4 sm:py-8 text-gray-100 font-sans space-y-6 sm:space-y-8">
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 p-4 sm:p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-2xl sm:text-3xl" aria-hidden="true">🏟️</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              NFL Stadiums & Weather Center
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-400">
            Guide to all 30 NFL venues · Grass vs Turf surfaces, climate control & real-time Open-Meteo forecasts
          </p>
        </div>

        {/* Quick summary stat pills */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="bg-gray-950 border border-gray-800 px-3 py-1.5 rounded-xl text-center flex-1 md:flex-initial">
            <div className="text-base sm:text-lg font-bold font-mono text-white">{statsSummary.total}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Venues</div>
          </div>
          <div className="bg-gray-950 border border-indigo-900/50 px-3 py-1.5 rounded-xl text-center flex-1 md:flex-initial">
            <div className="text-base sm:text-lg font-bold font-mono text-indigo-400">{statsSummary.domes}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Domes</div>
          </div>
          <div className="bg-gray-950 border border-emerald-900/50 px-3 py-1.5 rounded-xl text-center flex-1 md:flex-initial">
            <div className="text-base sm:text-lg font-bold font-mono text-emerald-400">{statsSummary.grass}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Grass</div>
          </div>
          <div className="bg-gray-950 border border-gray-800 px-3 py-1.5 rounded-xl text-center flex-1 md:flex-initial">
            <div className="text-base sm:text-lg font-bold font-mono text-amber-400">{statsSummary.avgCap.toLocaleString()}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Avg Cap</div>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 p-4 sm:p-5 rounded-2xl space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search stadium, host team, city, or state..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="sort-stadium" className="text-xs text-gray-400 font-semibold whitespace-nowrap">
              Sort:
            </label>
            <select
              id="sort-stadium"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium min-h-[44px]"
            >
              <option value="capacity">Capacity (Largest first)</option>
              <option value="opened">Opening Year (Newest first)</option>
              <option value="name">Stadium Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-800/60">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mr-1">Roof:</span>
            {[
              { id: 'ALL', label: 'All Roofs' },
              { id: 'DOME', label: '🏟️ Domes & Retractable' },
              { id: 'OUTDOOR', label: '☀️ Open-Air Outdoor' },
            ].map(chip => (
              <button
                key={chip.id}
                onClick={() => setRoofFilter(chip.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  roofFilter === chip.id
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-gray-950 text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mr-1">Field Surface:</span>
            {[
              { id: 'ALL', label: 'All' },
              { id: 'Grass', label: '🌱 Natural Grass' },
              { id: 'Turf', label: '🟦 FieldTurf / Synthetic' },
            ].map(chip => (
              <button
                key={chip.id}
                onClick={() => setSurfaceFilter(chip.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  surfaceFilter === chip.id
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-gray-950 text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stadium Cards Grid ──────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-900 border border-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredStadiums.map(s => {
            const isGrass = s.surface.toLowerCase() === 'grass';
            return (
              <div
                key={s.id}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 hover:border-gray-700 transition shadow-md group"
              >
                <div className="space-y-3">
                  {/* Top Bar: Name & City */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-white group-hover:text-blue-400 transition">
                        {s.name}
                      </h2>
                      <p className="text-xs text-gray-400 font-medium">
                        📍 {s.city}, {s.state} {s.opened ? `· Opened ${s.opened}` : ''}
                      </p>
                    </div>

                    <span className="text-sm font-mono font-bold text-gray-300 shrink-0 bg-gray-950 px-2 py-1 rounded border border-gray-800">
                      {s.capacity.toLocaleString()}
                    </span>
                  </div>

                  {/* Surface and Dome Pills */}
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    <span
                      className={`px-2 py-0.5 rounded-md font-semibold border ${
                        isGrass
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                      }`}
                    >
                      {isGrass ? '🌱 Natural Grass' : `🟦 ${s.surface}`}
                    </span>

                    {s.isDome ? (
                      <span className="px-2 py-0.5 rounded-md font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                        {s.isRetractable ? '🏟️ Retractable Roof' : '🏟️ Fixed Dome'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        ☀️ Open-Air Outdoor
                      </span>
                    )}
                  </div>

                  {/* Hosted Teams */}
                  <div className="pt-2 border-t border-gray-850 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Home of:</span>
                    {s.teams.map(t => (
                      <Link
                        key={t.id}
                        to={`/teams/${t.id}`}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-950 border border-gray-800 hover:border-gray-700 transition text-xs font-semibold text-gray-200"
                      >
                        <img
                          src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/${t.abbreviation.toLowerCase()}.png&w=24&h=24`}
                          alt=""
                          className="w-4 h-4 object-contain"
                        />
                        <span>{t.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Weather Forecast Snippet */}
                <div className="pt-3 border-t border-gray-850">
                  {s.isDome ? (
                    <div className="bg-gray-950/80 border border-gray-850 p-2.5 rounded-xl text-xs text-gray-400 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-indigo-300 font-medium">
                        <span>🌡️</span> 72°F Climate-Controlled
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">Zero Wind/Rain</span>
                    </div>
                  ) : s.loadingWeather ? (
                    <div className="h-9 bg-gray-950 animate-pulse rounded-xl" />
                  ) : s.weather ? (
                    <div className="bg-gray-950/80 border border-gray-850 p-2.5 rounded-xl text-xs text-gray-300 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{s.weather.icon}</span>
                        <span className="font-bold text-white">{s.weather.temp}°F</span>
                        <span className="text-gray-400">({s.weather.condition})</span>
                      </div>
                      <div className="text-[11px] text-gray-400 font-mono flex items-center gap-2">
                        <span>💨 {s.weather.windSpeed} mph {s.weather.windDirection}</span>
                        {s.weather.precipitation > 0 && (
                          <span className="text-cyan-400 font-bold">💧 {s.weather.precipitation}%</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-gray-500 italic">
                      Weather data unavailable.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
