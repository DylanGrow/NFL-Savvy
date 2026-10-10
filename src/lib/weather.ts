import { Weather } from '../types';

const WEATHER_BASE = 'https://api.open-meteo.com/v1/forecast';

/** Maps WMO weather interpretation codes to human-readable conditions + emoji */
function interpretWeatherCode(code: number): { condition: string; icon: string } {
  if (code === 0) return { condition: 'Clear', icon: '☀️' };
  if (code <= 2) return { condition: 'Partly Cloudy', icon: '⛅' };
  if (code === 3) return { condition: 'Overcast', icon: '☁️' };
  if (code <= 49) return { condition: 'Foggy', icon: '🌫️' };
  if (code <= 59) return { condition: 'Drizzle', icon: '🌦️' };
  if (code <= 69) return { condition: 'Rain', icon: '🌧️' };
  if (code <= 79) return { condition: 'Snow', icon: '🌨️' };
  if (code <= 84) return { condition: 'Rain Showers', icon: '🌧️' };
  if (code <= 86) return { condition: 'Snow Showers', icon: '🌨️' };
  if (code <= 99) return { condition: 'Thunderstorm', icon: '⛈️' };
  return { condition: 'Unknown', icon: '🌡️' };
}

function degreesToCompass(deg: number): string {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

/**
 * Fetches game-time weather (hour index 13 = 1pm local, reasonable NFL kickoff proxy)
 * Uses Open-Meteo free API — no key required, GDPR-friendly.
 */
export async function fetchGameWeather(
  lat: number,
  lon: number,
  gameDate: string,
  kickoffHour = 13
): Promise<Weather> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: 'temperature_2m,apparent_temperature,windspeed_10m,winddirection_10m,precipitation_probability,weathercode',
    temperature_unit: 'fahrenheit',
    windspeed_unit: 'mph',
    timezone: 'auto',
    start_date: gameDate,
    end_date: gameDate,
  });

  const res = await fetch(`${WEATHER_BASE}?${params}`);
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
  const data = await res.json();

  const h = data.hourly;
  const idx = kickoffHour; // index into the hourly arrays

  const code: number = h.weathercode?.[idx] ?? 0;
  const { condition, icon } = interpretWeatherCode(code);
  const windDir = degreesToCompass(h.winddirection_10m?.[idx] ?? 0);

  return {
    temp: Math.round(h.temperature_2m?.[idx] ?? 0),
    feelsLike: Math.round(h.apparent_temperature?.[idx] ?? 0),
    windSpeed: Math.round(h.windspeed_10m?.[idx] ?? 0),
    windDirection: windDir,
    precipitation: h.precipitation_probability?.[idx] ?? 0,
    condition,
    icon,
  };
}
