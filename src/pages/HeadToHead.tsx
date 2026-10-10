import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { SALARIES, formatSalary, getTeamCapAllocated, NFL_CAP_2025 } from '../lib/salary';

interface Team {
  id: string;
  displayName: string;
  logo: string;
  color: string;
}

const PLAYER_NAMES: Record<string, { name: string; position: string }> = {
  '3139477': { name: 'Patrick Mahomes', position: 'QB' },
  '3918298': { name: 'Josh Allen', position: 'QB' },
  '4241479': { name: 'Lamar Jackson', position: 'QB' },
  '4360310': { name: 'Jalen Hurts', position: 'QB' },
  '3054211': { name: 'Geno Smith', position: 'QB' },
  '4697815': { name: 'C.J. Stroud', position: 'QB' },
  '4040715': { name: 'Dak Prescott', position: 'QB' },
  '3054220': { name: 'Jordan Love', position: 'QB' },
  '4567048': { name: 'Matthew Stafford', position: 'QB' },
  '4360438': { name: 'Sam Darnold', position: 'QB' },
  '3054288': { name: 'Stefon Diggs', position: 'WR' },
  '4047646': { name: 'Keenan Allen', position: 'WR' },
  '4241478': { name: 'Tyreek Hill', position: 'WR' },
  '3054273': { name: 'Davante Adams', position: 'WR' },
  '4040570': { name: 'A.J. Brown', position: 'WR' },
  '3054239': { name: 'Isiah Pacheco', position: 'RB' },
  '4040749': { name: 'Christian McCaffrey', position: 'RB' },
  '3054275': { name: 'Trey McBride', position: 'TE' },
  '4040611': { name: 'Travis Kelce', position: 'TE' },
  '3054294': { name: 'Laremy Tunsil', position: 'OL' },
  '4039348': { name: 'Danielle Hunter', position: 'EDGE' },
  '4040557': { name: 'Odafe Oweh', position: 'EDGE' },
  '3054266': { name: 'Micah Parsons', position: 'LB' },
  '4037571': { name: 'Darius Slay', position: 'CB' },
  '4040618': { name: 'Kyle Hamilton', position: 'S' },
  '3054258': { name: 'Harrison Butker', position: 'K' },
};

export default function HeadToHead() {
  const [mode, setMode] = useState<'PLAYERS' | 'TEAMS'>('PLAYERS');
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Player Mode State
  const [teamAId, setTeamAId] = useState('');
  const [teamBId, setTeamBId] = useState('');
  const [playerAId, setPlayerAId] = useState('');
  const [playerBId, setPlayerBId] = useState('');

  useEffect(() => {
    document.title = 'Comparator | NFL Hub';
    async function load() {
      try {
        const data = await api.fetchTeams();
        const t = data.sports[0].leagues[0].teams.map((item: any) => ({
          id: item.team.id,
          displayName: item.team.displayName,
          logo: item.team.logos?.[0]?.href || '',
          color: item.team.color,
        }));
        setTeams(t.sort((a: Team, b: Team) => a.displayName.localeCompare(b.displayName)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const rosterA = SALARIES.filter(s => s.teamId === teamAId);
  const rosterB = SALARIES.filter(s => s.teamId === teamBId);
  
  const playerA = SALARIES.find(s => s.playerId === playerAId);
  const playerB = SALARIES.find(s => s.playerId === playerBId);

  const getPos = (pid?: string) => pid ? (PLAYER_NAMES[pid]?.position || 'UNK') : '-';
  const getName = (pid?: string) => pid ? (PLAYER_NAMES[pid]?.name || `Player ${pid}`) : '-';

  const compareMetric = (valA?: number, valB?: number, isLowerBetter = false) => {
    if (valA === undefined || valB === undefined) return { aClass: '', bClass: '' };
    if (valA === valB) return { aClass: 'text-gray-300', bClass: 'text-gray-300' };
    
    const aWins = isLowerBetter ? valA < valB : valA > valB;
    return {
      aClass: aWins ? 'text-green-400 font-bold' : 'text-gray-400',
      bClass: !aWins ? 'text-green-400 font-bold' : 'text-gray-400',
    };
  };

  const aavStyles = compareMetric(playerA?.aav, playerB?.aav, false);
  const capStyles = compareMetric(playerA?.capHit, playerB?.capHit, true);
  const totalStyles = compareMetric(playerA?.totalValue, playerB?.totalValue, false);
  const guarStyles = compareMetric(playerA?.guaranteedMoney, playerB?.guaranteedMoney, false);
  const yearsStyles = compareMetric(playerA?.yearsRemaining, playerB?.yearsRemaining, false);

  const teamA = teams.find(t => t.id === teamAId);
  const teamB = teams.find(t => t.id === teamBId);

  const getTeamStrengths = (t1Id: string, t2Id: string) => {
    const s1 = SALARIES.filter(s => s.teamId === t1Id);
    const s2 = SALARIES.filter(s => s.teamId === t2Id);
    
    const posSpend1: Record<string, number> = {};
    const posSpend2: Record<string, number> = {};
    
    s1.forEach(p => { const pos = getPos(p.playerId); posSpend1[pos] = (posSpend1[pos] || 0) + p.capHit; });
    s2.forEach(p => { const pos = getPos(p.playerId); posSpend2[pos] = (posSpend2[pos] || 0) + p.capHit; });

    const outspentPositions: string[] = [];
    Object.keys(posSpend1).forEach(pos => {
      if ((posSpend1[pos] || 0) > (posSpend2[pos] || 0)) outspentPositions.push(pos);
    });
    return outspentPositions;
  };

  return (
    <div className="app-container py-4 sm:py-8 space-y-6 sm:space-y-8 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-900 border border-gray-800 p-4 sm:p-6 rounded-2xl gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-100 tracking-tight">Head-to-Head Comparator</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">Compare players and team cap allocations side-by-side with statistical value weighting.</p>
        </div>
        
        <div className="bg-gray-950 rounded-xl p-1 border border-gray-800 flex w-full md:w-auto">
          <button 
            className={`flex-1 md:flex-initial px-6 py-2.5 rounded-lg font-semibold text-xs sm:text-sm transition touch-target min-h-[44px] ${
              mode === 'PLAYERS' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
            }`}
            onClick={() => setMode('PLAYERS')}
          >
            Players
          </button>
          <button 
            className={`flex-1 md:flex-initial px-6 py-2.5 rounded-lg font-semibold text-xs sm:text-sm transition touch-target min-h-[44px] ${
              mode === 'TEAMS' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
            }`}
            onClick={() => setMode('TEAMS')}
          >
            Teams
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-gray-400">Loading...</div>
      ) : mode === 'PLAYERS' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4 bg-gray-900 p-6 rounded-xl border border-gray-800">
              <h2 className="text-xl font-semibold text-gray-100">Player A</h2>
              <select
                value={teamAId}
                onChange={(e) => { setTeamAId(e.target.value); setPlayerAId(''); }}
                className="w-full bg-gray-950 border border-gray-700 text-gray-100 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Team</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.displayName}</option>)}
              </select>
              <select
                value={playerAId}
                onChange={(e) => setPlayerAId(e.target.value)}
                disabled={!teamAId}
                className="w-full bg-gray-950 border border-gray-700 text-gray-100 rounded p-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              >
                <option value="">Select Player</option>
                {rosterA.map(p => <option key={p.playerId} value={p.playerId}>{getName(p.playerId)}</option>)}
              </select>
            </div>

            <div className="space-y-4 bg-gray-900 p-6 rounded-xl border border-gray-800">
              <h2 className="text-xl font-semibold text-gray-100">Player B</h2>
              <select
                value={teamBId}
                onChange={(e) => { setTeamBId(e.target.value); setPlayerBId(''); }}
                className="w-full bg-gray-950 border border-gray-700 text-gray-100 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Team</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.displayName}</option>)}
              </select>
              <select
                value={playerBId}
                onChange={(e) => setPlayerBId(e.target.value)}
                disabled={!teamBId}
                className="w-full bg-gray-950 border border-gray-700 text-gray-100 rounded p-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              >
                <option value="">Select Player</option>
                {rosterB.map(p => <option key={p.playerId} value={p.playerId}>{getName(p.playerId)}</option>)}
              </select>
            </div>
          </div>

          {(playerA || playerB) && (
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Comparison Table</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-700 text-gray-400">
                      <th className="py-3 px-4 font-medium">Metric</th>
                      <th className="py-3 px-4 font-medium">{getName(playerAId)}</th>
                      <th className="py-3 px-4 font-medium">{getName(playerBId)}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    <tr>
                      <td className="py-3 px-4 text-gray-300">Position</td>
                      <td className="py-3 px-4">{getPos(playerAId)}</td>
                      <td className="py-3 px-4">{getPos(playerBId)}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-gray-300">Cap Hit</td>
                      <td className={`py-3 px-4 \${capStyles.aClass}`}>{playerA ? formatSalary(playerA.capHit) : '-'}</td>
                      <td className={`py-3 px-4 \${capStyles.bClass}`}>{playerB ? formatSalary(playerB.capHit) : '-'}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-gray-300">AAV</td>
                      <td className={`py-3 px-4 \${aavStyles.aClass}`}>{playerA?.aav ? formatSalary(playerA.aav) : '-'}</td>
                      <td className={`py-3 px-4 \${aavStyles.bClass}`}>{playerB?.aav ? formatSalary(playerB.aav) : '-'}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-gray-300">Total Value</td>
                      <td className={`py-3 px-4 \${totalStyles.aClass}`}>{playerA?.totalValue ? formatSalary(playerA.totalValue) : '-'}</td>
                      <td className={`py-3 px-4 \${totalStyles.bClass}`}>{playerB?.totalValue ? formatSalary(playerB.totalValue) : '-'}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-gray-300">Guaranteed</td>
                      <td className={`py-3 px-4 \${guarStyles.aClass}`}>{playerA?.guaranteedMoney ? formatSalary(playerA.guaranteedMoney) : '-'}</td>
                      <td className={`py-3 px-4 \${guarStyles.bClass}`}>{playerB?.guaranteedMoney ? formatSalary(playerB.guaranteedMoney) : '-'}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-gray-300">Years Left</td>
                      <td className={`py-3 px-4 \${yearsStyles.aClass}`}>{playerA?.yearsRemaining ?? '-'}</td>
                      <td className={`py-3 px-4 \${yearsStyles.bClass}`}>{playerB?.yearsRemaining ?? '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 flex justify-center">
                {playerA && playerB && (
                  <div className="bg-gray-800 px-6 py-3 rounded-full flex items-center gap-3">
                    <span className="text-gray-400">Contract Efficiency:</span>
                    <strong className="text-blue-400">
                      {((playerA.totalValue || 0) / (playerA.capHit || 1)) > ((playerB.totalValue || 0) / (playerB.capHit || 1))
                        ? `\${getName(playerAId)} is better value`
                        : `\${getName(playerBId)} is better value`
                      }
                    </strong>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Team A Selection */}
            <div className="space-y-4 bg-gray-900 p-6 rounded-xl border border-gray-800">
              <h2 className="text-xl font-semibold text-gray-100">Team A</h2>
              <select
                value={teamAId}
                onChange={(e) => setTeamAId(e.target.value)}
                className="w-full bg-gray-950 border border-gray-700 text-gray-100 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Team A</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.displayName}</option>)}
              </select>
              
              {teamA && (
                <div className="mt-4">
                  <div className="flex items-center gap-4">
                    {teamA.logo && <img src={teamA.logo} alt={teamA.displayName} className="w-16 h-16 object-contain" />}
                    <div>
                      <div className="text-lg font-bold">{teamA.displayName}</div>
                      <div className="text-sm text-gray-400">Total Allocated: {formatSalary(getTeamCapAllocated(teamAId))}</div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <div className="text-sm text-gray-400 mb-1">Cap Usage vs Salary Cap</div>
                    <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden relative">
                      <div 
                        className="h-full rounded-full absolute left-0 top-0 transition-all duration-500"
                        style={{ 
                          width: `\${Math.min(100, (getTeamCapAllocated(teamAId) / NFL_CAP_2025) * 100)}%`,
                          backgroundColor: `#\${teamA.color}`
                        }}
                      />
                    </div>
                  </div>

                  {teamBId && (
                    <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Strengths vs Team B (Spending)</h4>
                      <ul className="list-disc pl-4 text-sm text-gray-400">
                        {getTeamStrengths(teamAId, teamBId).map(pos => (
                          <li key={pos}>{pos}</li>
                        ))}
                        {getTeamStrengths(teamAId, teamBId).length === 0 && <li>None or tied</li>}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Team B Selection */}
            <div className="space-y-4 bg-gray-900 p-6 rounded-xl border border-gray-800">
              <h2 className="text-xl font-semibold text-gray-100">Team B</h2>
              <select
                value={teamBId}
                onChange={(e) => setTeamBId(e.target.value)}
                className="w-full bg-gray-950 border border-gray-700 text-gray-100 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Team B</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.displayName}</option>)}
              </select>

              {teamB && (
                <div className="mt-4">
                  <div className="flex items-center gap-4">
                    {teamB.logo && <img src={teamB.logo} alt={teamB.displayName} className="w-16 h-16 object-contain" />}
                    <div>
                      <div className="text-lg font-bold">{teamB.displayName}</div>
                      <div className="text-sm text-gray-400">Total Allocated: {formatSalary(getTeamCapAllocated(teamBId))}</div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="text-sm text-gray-400 mb-1">Cap Usage vs Salary Cap</div>
                    <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden relative">
                      <div 
                        className="h-full rounded-full absolute left-0 top-0 transition-all duration-500"
                        style={{ 
                          width: `\${Math.min(100, (getTeamCapAllocated(teamBId) / NFL_CAP_2025) * 100)}%`,
                          backgroundColor: `#\${teamB.color}`
                        }}
                      />
                    </div>
                  </div>

                  {teamAId && (
                    <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Strengths vs Team A (Spending)</h4>
                      <ul className="list-disc pl-4 text-sm text-gray-400">
                        {getTeamStrengths(teamBId, teamAId).map(pos => (
                          <li key={pos}>{pos}</li>
                        ))}
                        {getTeamStrengths(teamBId, teamAId).length === 0 && <li>None or tied</li>}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
