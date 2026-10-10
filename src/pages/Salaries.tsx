import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SALARIES, NFL_CAP_2025, formatSalary } from '../lib/salary';
import { api } from '../lib/api';

const TEAM_MAP: Record<string, string> = {
  '1': 'ATL', '2': 'BUF', '3': 'CHI', '4': 'CIN', '5': 'CLE', '6': 'DAL', '7': 'DEN', '8': 'DET',
  '9': 'GB', '10': 'TEN', '11': 'IND', '12': 'KC', '13': 'LV', '14': 'LAR', '15': 'MIA', '16': 'MIN',
  '17': 'NE', '18': 'NO', '19': 'NYG', '20': 'NYJ', '21': 'PHI', '22': 'ARI', '23': 'PIT', '24': 'LAC',
  '25': 'SF', '26': 'SEA', '27': 'TB', '28': 'WSH', '29': 'CAR', '30': 'JAX', '33': 'BAL', '34': 'HOU'
};

type SortCol = 'Cap Hit' | 'AAV' | 'Total Value' | 'Guaranteed';

export default function Salaries() {
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<SortCol>('Cap Hit');
  
  // We need player names/positions. Since SALARIES only has playerId, we need to fetch them or we can just show IDs until loaded.
  // Wait, the prompt says "Player name links to /players/:playerId", but SALARIES has no names!
  // I must fetch the player bio to get the names, or fetch roster for all teams. 
  // Let's create a local state for player details mapped by ID.
  const [playerDetails, setPlayerDetails] = useState<Record<string, { name: string; position: string }>>({});

  useEffect(() => {
    document.title = 'Salaries | NFL Hub';
    
    // Fetch bios for all players in SALARIES
    const fetchBios = async () => {
      const details: Record<string, { name: string; position: string }> = {};
      await Promise.all(
        SALARIES.map(async (s) => {
          if (!s.playerId) return;
          try {
            const bio = await api.fetchPlayerBio(s.playerId);
            details[s.playerId] = {
              name: bio?.athlete?.fullName || `Player ${s.playerId}`,
              position: bio?.athlete?.position?.abbreviation || 'UNK'
            };
          } catch (e) {
            details[s.playerId] = { name: `Player ${s.playerId}`, position: 'UNK' };
          }
        })
      );
      setPlayerDetails(details);
    };
    
    fetchBios();
  }, []);

  const positions = useMemo(() => {
    const posSet = new Set<string>();
    Object.values(playerDetails).forEach(p => {
      if (p.position && p.position !== 'UNK') posSet.add(p.position);
    });
    return ['ALL', ...Array.from(posSet).sort()];
  }, [playerDetails]);

  const sortedAndFiltered = useMemo(() => {
    let result = SALARIES;
    
    if (positionFilter !== 'ALL') {
      result = result.filter(s => s.playerId && playerDetails[s.playerId]?.position === positionFilter);
    }
    
    return result.sort((a, b) => {
      const valA = a[sortBy === 'Cap Hit' ? 'capHit' : sortBy === 'AAV' ? 'aav' : sortBy === 'Total Value' ? 'totalValue' : 'guaranteedMoney'] || 0;
      const valB = b[sortBy === 'Cap Hit' ? 'capHit' : sortBy === 'AAV' ? 'aav' : sortBy === 'Total Value' ? 'totalValue' : 'guaranteedMoney'] || 0;
      return valB - valA; // always descending
    });
  }, [SALARIES, positionFilter, sortBy, playerDetails]);

  const totalKnownCap = SALARIES.reduce((sum, s) => sum + s.capHit, 0);
  const totalLeagueCap = NFL_CAP_2025 * 32;
  const pct = (totalKnownCap / totalLeagueCap) * 100;

  return (
    <div className="app-container py-4 sm:py-8 min-h-screen text-gray-100 font-sans space-y-6">
      <div className="bg-gray-900 border border-gray-800 p-4 sm:p-6 rounded-2xl">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">2025 NFL Salaries & Cap Allocation</h1>
        <p className="text-xs sm:text-sm text-gray-400">Official NFL Salary Cap: {formatSalary(NFL_CAP_2025)} per franchise</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 shadow-md">
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3 text-gray-400">Total Tracked Cap Allocation</h2>
        <div className="flex flex-col sm:flex-row justify-between text-xs sm:text-sm mb-2 font-mono gap-1">
          <span className="text-blue-400 font-bold">{formatSalary(totalKnownCap)} tracked payroll</span>
          <span className="text-gray-500">{formatSalary(totalLeagueCap)} league-wide 32-team cap space</span>
        </div>
        <div className="w-full bg-gray-950 rounded-full h-3 sm:h-4 overflow-hidden border border-gray-800">
          <div className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(1, pct)}%` }}></div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        {/* Positions touch scroll */}
        <div className="flex overflow-x-auto touch-scroll gap-1.5 pb-2 w-full lg:w-auto scrollbar-none">
          {positions.map(pos => (
            <button
              key={pos}
              onClick={() => setPositionFilter(pos)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap min-h-[40px] touch-target ${
                positionFilter === pos
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-900 text-gray-300 hover:bg-gray-800 border border-gray-800'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
        
        {/* Sort Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-gray-400 text-xs font-semibold mr-1">Sort:</span>
          {(['Cap Hit', 'AAV', 'Total Value', 'Guaranteed'] as SortCol[]).map(col => (
            <button
              key={col}
              onClick={() => setSortBy(col)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors touch-target min-h-[36px] ${
                sortBy === col
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 font-bold'
                  : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {col}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto touch-scroll bg-gray-900 rounded-2xl shadow-lg border border-gray-800">
        <table className="w-full text-left border-collapse whitespace-nowrap min-w-[700px]">
          <thead>
            <tr className="bg-gray-950 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-800">
              <th className="p-3.5 w-16">Rank</th>
              <th className="p-3.5">Player</th>
              <th className="p-3.5">Team</th>
              <th className="p-3.5">Pos</th>
              <th 
                className="p-3.5 cursor-pointer hover:text-white select-none focus-visible:ring-1 focus-visible:ring-blue-400" 
                tabIndex={0} 
                role="button"
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSortBy('Cap Hit'); } }}
                onClick={() => setSortBy('Cap Hit')}
              >
                Cap Hit {sortBy === 'Cap Hit' && '↓'}
              </th>
              <th 
                className="p-3.5 cursor-pointer hover:text-white select-none focus-visible:ring-1 focus-visible:ring-blue-400" 
                tabIndex={0} 
                role="button"
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSortBy('AAV'); } }}
                onClick={() => setSortBy('AAV')}
              >
                AAV {sortBy === 'AAV' && '↓'}
              </th>
              <th 
                className="p-3.5 cursor-pointer hover:text-white select-none focus-visible:ring-1 focus-visible:ring-blue-400" 
                tabIndex={0} 
                role="button"
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSortBy('Total Value'); } }}
                onClick={() => setSortBy('Total Value')}
              >
                Total Value {sortBy === 'Total Value' && '↓'}
              </th>
              <th 
                className="p-3.5 cursor-pointer hover:text-white select-none focus-visible:ring-1 focus-visible:ring-blue-400" 
                tabIndex={0} 
                role="button"
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSortBy('Guaranteed'); } }}
                onClick={() => setSortBy('Guaranteed')}
              >
                Guaranteed {sortBy === 'Guaranteed' && '↓'}
              </th>
              <th className="p-3.5">Yrs Left</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {sortedAndFiltered.map((s, index) => {
              const details = s.playerId ? playerDetails[s.playerId] : null;
              
              return (
                <tr key={`${s.playerId}-${index}`} className="hover:bg-gray-800/50">
                  <td className="p-4 text-gray-500 font-mono">{index + 1}</td>
                  <td className="p-4 font-medium">
                    {s.playerId ? (
                      <Link to={`/players/${s.playerId}`} className="text-blue-400 hover:text-blue-300">
                        {details?.name || 'Loading...'}
                      </Link>
                    ) : (
                      <span className="text-gray-400">Unknown</span>
                    )}
                  </td>
                  <td className="p-4 font-mono text-gray-300">{s.teamId ? TEAM_MAP[s.teamId] || s.teamId : '-'}</td>
                  <td className="p-4 text-gray-400">{details?.position || '-'}</td>
                  <td className="p-4 font-mono text-white">{formatSalary(s.capHit)}</td>
                  <td className="p-4 font-mono text-gray-400">{s.aav ? formatSalary(s.aav) : '-'}</td>
                  <td className="p-4 font-mono text-gray-400">{s.totalValue ? formatSalary(s.totalValue) : '-'}</td>
                  <td className="p-4 font-mono text-gray-400">{s.guaranteedMoney ? formatSalary(s.guaranteedMoney) : '-'}</td>
                  <td className="p-4 font-mono text-gray-400">{s.yearsRemaining || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
