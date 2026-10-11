import type { InternationalGameInfo } from '../../lib/international';
import { getInternationalGameInfo } from '../../lib/international';

interface InternationalBadgeProps {
  info?: InternationalGameInfo | null;
  game?: any;
  extraData?: any;
  variant?: 'pill' | 'banner' | 'tag';
  className?: string;
}

export function InternationalBadge({
  info: propInfo,
  game,
  extraData,
  variant = 'pill',
  className = '',
}: InternationalBadgeProps) {
  const info = propInfo || (game ? getInternationalGameInfo(game, extraData) : null);

  if (!info || !info.isInternational) {
    return null;
  }

  if (variant === 'banner') {
    return (
      <div
        className={`bg-gradient-to-r from-indigo-950 via-purple-950/90 to-indigo-950 border border-indigo-500/50 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden ${className}`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <span className="text-3xl sm:text-4xl filter drop-shadow-md select-none" role="img" aria-label={info.country}>
            {info.flag}
          </span>
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] sm:text-xs font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/40">
                NFL International Series
              </span>
              <span className="text-xs text-indigo-200/70 font-medium">Neutral Site Game</span>
            </div>
            <h3 className="text-base sm:text-xl font-black text-white mt-1">
              {info.headline || info.seriesName}
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 mt-0.5">
              📍 {info.venue ? `${info.venue} · ` : ''}{info.city}, {info.country}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'tag') {
    return (
      <span
        title={`${info.seriesName} (${info.city}, ${info.country})`}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-950/90 text-indigo-300 border border-indigo-700/70 shadow-sm ${className}`}
      >
        <span role="img" aria-label={info.country}>{info.flag}</span>
        <span>{info.city || info.country}</span>
      </span>
    );
  }

  // Default: pill
  return (
    <span
      title={`${info.seriesName} · ${info.venue ? info.venue + ' · ' : ''}${info.city}, ${info.country}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-950/95 text-indigo-200 border border-indigo-500/60 shadow-sm shadow-indigo-950/60 tracking-tight backdrop-blur-sm ${className}`}
    >
      <span className="text-sm leading-none" role="img" aria-label={info.country}>
        {info.flag}
      </span>
      <span>{info.badgeLabel}</span>
    </span>
  );
}
