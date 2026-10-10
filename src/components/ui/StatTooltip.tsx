import { useState } from 'react';

export const STAT_GLOSSARY: Record<string, string> = {
  EPA:          'Expected Points Added: Measures the value of individual plays in terms of points.',
  CPOE:         "Completion % Over Expected: How a QB's actual completion rate compares to expected based on throw difficulty.",
  YAC:          'Yards After Catch: Distance gained by a receiver after catching the ball.',
  DVOA:         'Defense-adjusted Value Over Average: Team success vs league average, adjusted for opponent and game situation.',
  QBR:          'Total Quarterback Rating: Values the QB on all play types on a 0-100 scale.',
  DYAR:         'Defense-adjusted Yards Above Replacement: Value of plays where a player caught or carried the ball vs replacement level.',
  YPA:          'Yards Per Attempt: Total passing yards divided by total passing attempts.',
  'ANY/A':      'Adjusted Net Yards per Attempt: Passing stat incorporating sacks, TDs, and INTs.',
  'TD%':        'Touchdown Percentage: Percentage of pass attempts resulting in a touchdown.',
  'INT%':       'Interception Percentage: Percentage of pass attempts resulting in an interception.',
  'AY/A':       'Adjusted Yards per Attempt: YPA adjusted for TDs (+20) and INTs (-45).',
  'WR Rating':  'Passer rating when targeting a specific wide receiver.',
  RACR:         'Receiver Air Conversion Ratio: How efficiently a receiver converts Air Yards into actual receiving yards.',
  TAE:          'Total Air Expected: Expected passing production based on target air yards.',
  ADOT:         'Average Depth of Target: Average distance downfield a receiver is targeted.',
  YPRR:         'Yards Per Route Run: Receiving yards divided by routes run.',
  PFF:          'Pro Football Focus Grade: Overall performance grade from film analysis (0-100).',
  'SNAP%':      'Snap Percentage: Percentage of team offensive or defensive snaps a player participated in.',
  'Air Yards':  'Total yards downfield a pass travels regardless of completion.',
  CAR:          'Completed Air Yards: Air yards accumulated on completed passes only.',
  RBOE:         'Rush Yards Over Expected: Rush yards above what blocking/alignment predicted.',
  MTJC:         'Missed Tackles Forced per Touch: How often a player forces a missed tackle.',
  PBU:          'Pass Breakups: Times a defender deflects or bats down a pass.',
  QBPR:         'QB Pressure Rate: Percentage of dropbacks where the QB faced pressure.',
  SackRate:     'Sack Rate: Percentage of dropbacks resulting in a sack.',
  PressureRate: 'Pressure Rate: Percentage of pass-rush snaps generating a QB pressure.',
  BeatRate:     'Pass Rush Win Rate: How often a pass rusher beats his blocker within 2.5 seconds.',
  FPTS:         'Fantasy Points: Standard fantasy points scored this season.',
  PPR:          'Points Per Reception: Fantasy scoring system awarding 1 point per catch.',
  'Redzone%':   'Red Zone TD%: How often a team scores a TD when inside the opponent 20-yard line.',
};

interface StatTooltipProps {
  statKey: string;
  label?: string;
  className?: string;
}

export function StatTooltip({ statKey, label, className = '' }: StatTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const definition = STAT_GLOSSARY[statKey];
  const displayLabel = label || statKey;

  return (
    <span
      role="button"
      tabIndex={0}
      aria-expanded={isOpen}
      aria-label={`Definition of ${statKey}`}
      onClick={(e) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsOpen(!isOpen);
        } else if (e.key === 'Escape') {
          setIsOpen(false);
        }
      }}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
      className={`group relative inline-flex items-center cursor-pointer select-none touch-manipulation focus-visible:ring-1 focus-visible:ring-blue-400 rounded px-0.5 ${className}`}
    >
      <span className="font-medium text-gray-300 border-b border-dashed border-gray-600 group-hover:border-gray-400 group-focus:border-blue-400 transition-colors">
        {displayLabel}
      </span>
      <span className="ml-1 text-gray-500 text-xs font-mono" aria-hidden="true">?</span>

      {definition && (
        <div
          role="tooltip"
          className={`absolute z-50 w-64 max-w-[85vw] p-3 text-xs sm:text-sm text-gray-200 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl transition-all duration-150 bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none ${
            isOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-1'
          }`}
        >
          <div className="font-semibold text-white mb-1 flex items-center justify-between">
            <span>{statKey}</span>
            <span className="text-[10px] text-gray-500 font-normal">tap to dismiss</span>
          </div>
          <div className="text-gray-400 text-xs leading-relaxed">{definition}</div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-700" />
        </div>
      )}
    </span>
  );
}
