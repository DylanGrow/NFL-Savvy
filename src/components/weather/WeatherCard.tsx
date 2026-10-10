import { Weather } from '../../types';
import { Skeleton } from '../ui/Skeleton';
import { Badge } from '../ui/Badge';

interface WeatherCardProps {
  weather: Weather | null;
  isDome: boolean;
  isLoading: boolean;
}

export function WeatherCard({ weather, isDome, isLoading }: WeatherCardProps) {
  if (isLoading) {
    return (
      <div className="p-4 border border-gray-800 rounded-lg bg-gray-900/50 flex flex-col gap-3">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-10 w-16" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  if (isDome) {
    return (
      <div className="p-4 border border-gray-800 rounded-lg bg-gray-900 flex flex-col items-center justify-center h-full min-h-[120px]">
        <Badge variant="dome" icon="🏟️" label="Dome" className="mb-2" />
        <span className="text-gray-400 text-sm font-medium">Climate Controlled</span>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="p-4 border border-gray-800 rounded-lg bg-gray-900 text-center text-gray-500 text-sm min-h-[120px] flex items-center justify-center">
        Weather data unavailable
      </div>
    );
  }

  const getTempColor = (temp: number) => {
    if (temp < 32) return 'text-blue-400';
    if (temp >= 55 && temp <= 75) return 'text-green-400';
    if (temp > 90) return 'text-orange-400';
    return 'text-gray-100';
  };

  return (
    <div className="p-4 border border-gray-800 rounded-lg bg-gray-900 flex flex-col justify-between min-h-[120px]">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">{weather.icon}</span>
            <span className="text-gray-300 text-sm font-medium">{weather.condition}</span>
          </div>
          <div className={`text-4xl font-bold mt-1 ${getTempColor(weather.temp)}`}>
            {weather.temp}°
          </div>
        </div>
        <div className="text-right flex flex-col gap-1">
          <Badge variant="weather" label={`${weather.precipitation}% Precip`} />
        </div>
      </div>
      
      <div className="mt-3 flex gap-4 text-xs text-gray-500 border-t border-gray-800 pt-3">
        <div>
          Feels like <span className="text-gray-300 font-medium">{weather.feelsLike}°</span>
        </div>
        <div>
          Wind <span className="text-gray-300 font-medium">{weather.windSpeed} mph {weather.windDirection}</span>
        </div>
      </div>
    </div>
  );
}
