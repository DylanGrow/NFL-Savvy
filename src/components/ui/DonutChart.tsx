
export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  centerLabel?: string;
  size?: number;
  className?: string;
}

export function DonutChart({ segments, centerLabel, size = 200, className = '' }: DonutChartProps) {
  const total = segments.reduce((sum, seg) => sum + seg.value, 0);
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  
  let currentOffset = 0;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width="100%" height="100%" viewBox="0 0 120 120" className="transform -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke="#1f2937"
            strokeWidth="16"
          />
          {segments.map((segment, index) => {
            const ratio = segment.value / total;
            const strokeDasharray = `${circumference * ratio} ${circumference}`;
            const strokeDashoffset = -currentOffset;
            currentOffset += circumference * ratio;

            return (
              <circle
                key={index}
                cx="60"
                cy="60"
                r={radius}
                fill="transparent"
                stroke={segment.color}
                strokeWidth="16"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500 ease-in-out"
                strokeLinecap="butt"
              />
            );
          })}
        </svg>
        {centerLabel && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-gray-200 font-semibold text-center text-sm px-2">
              {centerLabel}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 w-full space-y-2">
        {segments.map((segment, i) => {
          const percent = total > 0 ? Math.round((segment.value / total) * 100) : 0;
          return (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: segment.color }}
                  aria-hidden="true"
                />
                <span className="text-gray-400">{segment.label}</span>
              </div>
              <div className="text-gray-200 font-medium">
                {percent}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
