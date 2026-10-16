import { useState } from 'react';
import { Coach } from '../../types';

interface CoachCardProps {
  coach: Coach;
}

export function CoachCard({ coach }: CoachCardProps) {
  const [showFullScheme, setShowFullScheme] = useState(false);

  const getRoleBadgeStyle = (role: string) => {
    const r = role.toUpperCase();
    if (r.includes('HEAD COACH') || r === 'HC') {
      return 'text-amber-300 border-amber-500/40 bg-amber-500/10';
    }
    if (r.includes('OFFENSIVE') || r.includes('OC') || r.includes('RUN GAME') || r.includes('PASS GAME')) {
      return 'text-blue-300 border-blue-500/40 bg-blue-500/10';
    }
    if (r.includes('DEFENSIVE') || r.includes('DC')) {
      return 'text-red-300 border-red-500/40 bg-red-500/10';
    }
    return 'text-gray-300 border-gray-600/40 bg-gray-800/40';
  };

  const isHeadCoach = coach.role.toUpperCase().includes('HEAD COACH') || coach.role.toUpperCase() === 'HC';
  const isOffensive = coach.role.toUpperCase().includes('OFFENSIVE') || coach.role.toUpperCase().includes('RUN GAME');
  const isDefensive = coach.role.toUpperCase().includes('DEFENSIVE');

  const expYears = coach.yearsExperience ?? coach.experience;

  return (
    <div className="p-4 sm:p-5 border border-gray-800 hover:border-gray-700 rounded-xl bg-gray-900/95 flex flex-col justify-between shadow-sm transition-all hover:shadow-md">
      <div>
        {/* Name and Top Badges */}
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-gray-100 truncate">
              {coach.fullName || `${coach.firstName ?? ''} ${coach.lastName ?? ''}`.trim() || 'Coach'}
            </h3>
            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
              <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold border rounded-full ${getRoleBadgeStyle(coach.role)}`}>
                {coach.role}
              </span>
              {coach.playCalling && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-indigo-950/70 text-indigo-300 border border-indigo-500/30">
                  <span aria-hidden="true">🎙️</span>
                  <span className="truncate max-w-[130px]">{coach.playCalling}</span>
                </span>
              )}
            </div>
          </div>
          {coach.teamAbbr && (
            <img
              src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/${coach.teamAbbr.toLowerCase()}.png&w=40&h=40`}
              alt={coach.teamAbbr}
              className="w-8 h-8 object-contain shrink-0 drop-shadow-sm opacity-90"
              loading="lazy"
            />
          )}
        </div>

        {/* Tree Lineage */}
        {coach.tree && (
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-400/90 font-medium">
            <span aria-hidden="true">🌳</span>
            <span className="truncate">{coach.tree}</span>
          </div>
        )}

        {/* Scheme Highlights */}
        <div className="mt-3.5 space-y-2.5">
          {/* Offensive Scheme */}
          {(coach.offensiveScheme || isHeadCoach || isOffensive) && coach.offensiveScheme && (
            <div className="bg-blue-950/30 border border-blue-900/40 rounded-lg p-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-blue-400 mb-1">
                <span className="flex items-center gap-1.5">
                  <span>🏈</span>
                  <span>Offensive Scheme</span>
                </span>
                {coach.passRunTendency && (
                  <span className="text-[10px] text-gray-400 font-mono font-normal">
                    {coach.passRunTendency.split('(')[0].trim()}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-200 font-medium leading-snug">
                {coach.offensiveScheme}
              </p>
              {coach.personnelPreference && (
                <div className="mt-1 text-[11px] text-gray-400">
                  <span className="text-gray-500">Personnel:</span> {coach.personnelPreference}
                </div>
              )}
            </div>
          )}

          {/* Defensive Scheme */}
          {(coach.defensiveScheme || isHeadCoach || isDefensive) && coach.defensiveScheme && (
            <div className="bg-red-950/30 border border-red-900/40 rounded-lg p-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-red-400 mb-1">
                <span className="flex items-center gap-1.5">
                  <span>🛡️</span>
                  <span>Defensive Scheme</span>
                </span>
                {coach.baseFront && (
                  <span className="text-[10px] text-gray-400 font-mono font-normal">
                    {coach.baseFront}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-200 font-medium leading-snug">
                {coach.defensiveScheme}
              </p>
              {coach.coverageTendency && (
                <div className="mt-1 text-[11px] text-gray-400">
                  <span className="text-gray-500">Primary Coverage:</span> {coach.coverageTendency}
                </div>
              )}
            </div>
          )}

          {/* Tactical Philosophy Quote / Breakdown */}
          {coach.philosophy && (
            <div className="mt-2 text-xs text-gray-400 bg-gray-950/60 p-2.5 rounded-lg border border-gray-800/80 leading-relaxed italic">
              "{coach.philosophy}"
            </div>
          )}

          {/* Scheme Tags */}
          {coach.schemeTags && coach.schemeTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {coach.schemeTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 text-[10px] font-medium rounded bg-gray-800/90 text-gray-300 border border-gray-700/60"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-3 border-t border-gray-800 flex justify-between items-center text-xs text-gray-400">
        <div>
          {isHeadCoach && coach.record ? (
            <div>
              <span className="text-gray-500">HC Record:</span>{' '}
              <span className="font-semibold text-gray-200 font-mono">{coach.record}</span>
            </div>
          ) : coach.teamName ? (
            <span className="truncate max-w-[150px]">{coach.teamName}</span>
          ) : (
            <span />
          )}
        </div>

        {expYears !== undefined && expYears > 0 && (
          <div className="text-gray-400">
            <span className="font-semibold text-gray-300">{expYears}</span> yr{expYears !== 1 ? 's' : ''} exp
          </div>
        )}
      </div>
    </div>
  );
}
