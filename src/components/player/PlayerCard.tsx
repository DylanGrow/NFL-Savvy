import { Link } from 'react-router-dom';
import { Player, Salary } from '../../types';
import { Badge } from '../ui/Badge';

interface PlayerCardProps {
  player: Player;
  salary?: Salary;
  isHighlight?: boolean;
}

export function PlayerCard({ player, salary, isHighlight = false }: PlayerCardProps) {
  const photoUrl = `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${player.id}.png&w=96&h=70`;
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className={`relative p-4 border rounded-xl bg-gray-900 transition-colors hover:bg-gray-800 ${
      isHighlight ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'border-gray-800'
    }`}>
      {isHighlight && (
        <div className="absolute -top-3 -right-3 text-2xl drop-shadow-md">
          ⭐
        </div>
      )}
      
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 shrink-0 bg-gray-800 rounded-full overflow-hidden border-2 border-gray-700 flex items-center justify-center">
          <img 
            src={photoUrl} 
            alt={player.fullName} 
            className="w-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <Link to={`/players/${player.id}`} className="block">
            <h3 className="text-lg font-bold text-gray-100 truncate hover:text-blue-400 transition-colors">
              {player.fullName}
              {player.jersey && <span className="ml-2 text-gray-500 font-normal">#{player.jersey}</span>}
            </h3>
          </Link>
          
          <div className="mt-1 flex flex-wrap gap-2 items-center">
            <Badge variant="position" label={player.position} />
            {player.injuryStatus && (
              <Badge variant="injury" label={player.injuryStatus} />
            )}
          </div>
        </div>
      </div>

      {(salary || player.fantasyScore !== undefined) && (
        <div className="mt-4 pt-3 border-t border-gray-800 flex justify-between items-end">
          {salary ? (
            <div>
              <div className="text-xs text-gray-500">Cap Hit</div>
              <div className="text-sm font-medium text-green-400">
                {formatCurrency(salary.capHit)}
              </div>
            </div>
          ) : <div />}
          
          {player.fantasyScore !== undefined && (
            <div className="text-right">
              <div className="text-xs text-gray-500">Fantasy</div>
              <div className="text-sm font-medium text-purple-400">
                {player.fantasyScore} pts
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
