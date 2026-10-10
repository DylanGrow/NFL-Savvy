import { Coach } from '../../types';

interface CoachCardProps {
  coach: Coach;
}

export function CoachCard({ coach }: CoachCardProps) {
  const getRoleColor = (role: string) => {
    const r = role.toUpperCase();
    if (r.includes('HEAD COACH') || r === 'HC') return 'text-amber-400 border-amber-400/20 bg-amber-400/10';
    if (r.includes('OC') || r.includes('OFFENSIVE COORDINATOR')) return 'text-blue-400 border-blue-400/20 bg-blue-400/10';
    if (r.includes('DC') || r.includes('DEFENSIVE COORDINATOR')) return 'text-red-400 border-red-400/20 bg-red-400/10';
    return 'text-gray-400 border-gray-500/20 bg-gray-500/10';
  };

  const isHeadCoach = coach.role.toUpperCase().includes('HEAD COACH') || coach.role.toUpperCase() === 'HC';

  return (
    <div className="p-4 border border-gray-800 rounded-lg bg-gray-900 flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-bold text-gray-100">{coach.fullName}</h3>
        <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium border rounded ${getRoleColor(coach.role)}`}>
          {coach.role}
        </span>
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-800 flex justify-between items-center text-sm">
        {isHeadCoach && coach.record ? (
          <div>
            <span className="text-gray-500">Record:</span>
            <span className="ml-1 text-gray-300 font-medium">{coach.record}</span>
          </div>
        ) : <div />}
        
        {coach.yearsExperience !== undefined && (
          <div>
            <span className="text-gray-500">Exp:</span>
            <span className="ml-1 text-gray-300 font-medium">{coach.yearsExperience} yrs</span>
          </div>
        )}
      </div>
    </div>
  );
}
