import type { Official, RefereeCrew } from '../../types';

interface RefereeCardProps {
  officials?: Official[];
  crew?: RefereeCrew | null;
  className?: string;
}

export function RefereeCard({ officials = [], crew, className = '' }: RefereeCardProps) {
  // If we have live officials from API, find head referee
  const headRefFromOfficials = officials.find(o => 
    o.position?.toLowerCase().includes('referee') || 
    o.displayName?.toLowerCase().includes('referee')
  );

  const headRefName = crew?.referee || headRefFromOfficials?.displayName || 'NFL Officiating Crew';
  const jerseyNumber = crew?.jerseyNumber || headRefFromOfficials?.jerseyNumber;

  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl p-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-xl shadow-inner" aria-hidden="true">
            🦓
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base">{headRefName}</h3>
              {jerseyNumber && (
                <span className="text-xs bg-gray-800 text-gray-300 font-mono px-1.5 py-0.5 rounded border border-gray-700">
                  #{jerseyNumber}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">Head Referee / Crew Chief</p>
          </div>
        </div>

        {crew?.experience && (
          <span className="text-xs text-gray-400 bg-gray-800/80 px-2.5 py-1 rounded-full border border-gray-700/60">
            {crew.experience} yrs exp
          </span>
        )}
      </div>

      {/* Crew Penalty Tendencies / Metrics if available */}
      {crew?.penaltyStats && (
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="bg-gray-950/60 p-2.5 rounded-lg border border-gray-800/70">
            <div className="text-xs text-gray-400 mb-0.5">Avg Flags</div>
            <div className="text-sm font-bold text-amber-400 font-mono">
              {crew.penaltyStats.avgPenaltiesPerGame} /gm
            </div>
          </div>
          <div className="bg-gray-950/60 p-2.5 rounded-lg border border-gray-800/70">
            <div className="text-xs text-gray-400 mb-0.5">Penalty Yds</div>
            <div className="text-sm font-bold text-gray-200 font-mono">
              {crew.penaltyStats.avgPenaltyYards} yds
            </div>
          </div>
          <div className="bg-gray-950/60 p-2.5 rounded-lg border border-gray-800/70">
            <div className="text-xs text-gray-400 mb-0.5">Home Win %</div>
            <div className="text-sm font-bold text-emerald-400 font-mono">
              {crew.penaltyStats.homeWinPct}%
            </div>
          </div>
        </div>
      )}

      {crew?.penaltyStats?.tendency && (
        <div className="mt-3 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300 flex items-start gap-2">
          <span className="text-amber-400 mt-0.5">⚠️</span>
          <span><strong>Crew Tendency:</strong> {crew.penaltyStats.tendency}</span>
        </div>
      )}

      {/* Full Crew List */}
      <div className="mt-4 pt-3 border-t border-gray-800/80">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Officiating Crew Positions</h4>
        
        {officials.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            {officials.map((off, idx) => (
              <div key={idx} className="flex justify-between items-center py-1 border-b border-gray-800/40">
                <span className="text-gray-400 truncate max-w-[110px]">{off.position || 'Official'}</span>
                <span className="text-gray-200 font-medium truncate">{off.displayName}</span>
              </div>
            ))}
          </div>
        ) : crew ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            {crew.umpire && (
              <div className="flex justify-between items-center py-1 border-b border-gray-800/40">
                <span className="text-gray-400">Umpire:</span>
                <span className="text-gray-200 font-medium">{crew.umpire}</span>
              </div>
            )}
            {crew.downJudge && (
              <div className="flex justify-between items-center py-1 border-b border-gray-800/40">
                <span className="text-gray-400">Down Judge:</span>
                <span className="text-gray-200 font-medium">{crew.downJudge}</span>
              </div>
            )}
            {crew.lineJudge && (
              <div className="flex justify-between items-center py-1 border-b border-gray-800/40">
                <span className="text-gray-400">Line Judge:</span>
                <span className="text-gray-200 font-medium">{crew.lineJudge}</span>
              </div>
            )}
            {crew.fieldJudge && (
              <div className="flex justify-between items-center py-1 border-b border-gray-800/40">
                <span className="text-gray-400">Field Judge:</span>
                <span className="text-gray-200 font-medium">{crew.fieldJudge}</span>
              </div>
            )}
            {crew.sideJudge && (
              <div className="flex justify-between items-center py-1 border-b border-gray-800/40">
                <span className="text-gray-400">Side Judge:</span>
                <span className="text-gray-200 font-medium">{crew.sideJudge}</span>
              </div>
            )}
            {crew.backJudge && (
              <div className="flex justify-between items-center py-1 border-b border-gray-800/40">
                <span className="text-gray-400">Back Judge:</span>
                <span className="text-gray-200 font-medium">{crew.backJudge}</span>
              </div>
            )}
            {crew.replayOfficial && (
              <div className="flex justify-between items-center py-1 border-b border-gray-800/40 sm:col-span-2">
                <span className="text-gray-400">Replay Official:</span>
                <span className="text-gray-200 font-medium">{crew.replayOfficial}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic">Officiating crew assignment pending announcement</p>
        )}
      </div>
    </div>
  );
}
