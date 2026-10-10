import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../lib/api';
import { SALARIES, formatSalary } from '../lib/salary';
import type { Salary } from '../types';

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

const POSITION_WEIGHTS: Record<string, number> = {
  'QB': 1.5,
  'EDGE': 1.2,
  'WR': 1.0,
  'RB': 0.8,
};

export default function TradeAnalyzer() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamA, setTeamA] = useState<string>('');
  const [teamB, setTeamB] = useState<string>('');
  
  // Players being traded FROM Team A TO Team B
  const [tradingA, setTradingA] = useState<Salary[]>([]);
  // Players being traded FROM Team B TO Team A
  const [tradingB, setTradingB] = useState<Salary[]>([]);

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    document.title = 'Trade Analyzer | NFL Hub';
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

  const rosterA = useMemo(() => {
    return SALARIES.filter(s => s.teamId === teamA && !tradingA.find(t => t.playerId === s.playerId));
  }, [teamA, tradingA]);

  const rosterB = useMemo(() => {
    return SALARIES.filter(s => s.teamId === teamB && !tradingB.find(t => t.playerId === s.playerId));
  }, [teamB, tradingB]);

  const handleDragStart = (e: React.DragEvent, player: Salary, sourceTeam: 'A' | 'B', isTradeList: boolean) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ player, sourceTeam, isTradeList }));
  };

  const handleDrop = (e: React.DragEvent, dropTarget: 'A' | 'B', isTradeList: boolean) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const { player, sourceTeam, isTradeList: fromTradeList } = data;
      
      // If dropping into A's getting (tradingB) list, it means B is giving
      if (dropTarget === 'A' && isTradeList && sourceTeam === 'B' && !fromTradeList) {
        setTradingB(prev => [...prev, player]);
      }
      // If dropping into B's getting (tradingA) list, it means A is giving
      else if (dropTarget === 'B' && isTradeList && sourceTeam === 'A' && !fromTradeList) {
        setTradingA(prev => [...prev, player]);
      }
      // If removing from A's giving (tradingA) list back to A's roster
      else if (dropTarget === 'A' && !isTradeList && sourceTeam === 'A' && fromTradeList) {
        setTradingA(prev => prev.filter(p => p.playerId !== player.playerId));
      }
      // If removing from B's giving (tradingB) list back to B's roster
      else if (dropTarget === 'B' && !isTradeList && sourceTeam === 'B' && fromTradeList) {
        setTradingB(prev => prev.filter(p => p.playerId !== player.playerId));
      }
    } catch (err) {
      // ignore
    }
  };

  const getPlayerDisplay = (playerId?: string) => {
    if (!playerId) return 'Unknown Player';
    return PLAYER_NAMES[playerId]?.name || `Player \${playerId}`;
  };

  const getPlayerPosition = (playerId?: string) => {
    if (!playerId) return 'UNK';
    return PLAYER_NAMES[playerId]?.position || 'UNK';
  };

  const calculateValue = (players: Salary[]) => {
    return players.reduce((sum, p) => {
      const pos = getPlayerPosition(p.playerId);
      const weight = POSITION_WEIGHTS[pos] || 1.0;
      return sum + (p.capHit * weight);
    }, 0);
  };

  const capHitA = tradingA.reduce((sum, p) => sum + p.capHit, 0);
  const capHitB = tradingB.reduce((sum, p) => sum + p.capHit, 0);
  
  const valueA = calculateValue(tradingA); // Value A is giving up
  const valueB = calculateValue(tradingB); // Value B is giving up

  const resetTrade = () => {
    setTradingA([]);
    setTradingB([]);
  };

  const togglePlayerTrade = (p: Salary, source: 'A'|'B', isTradeList: boolean) => {
    if (source === 'A') {
      if (isTradeList) {
        setTradingA(prev => prev.filter(x => x.playerId !== p.playerId));
      } else {
        if (!tradingA.some(x => x.playerId === p.playerId)) setTradingA(prev => [...prev, p]);
      }
    } else {
      if (isTradeList) {
        setTradingB(prev => prev.filter(x => x.playerId !== p.playerId));
      } else {
        if (!tradingB.some(x => x.playerId === p.playerId)) setTradingB(prev => [...prev, p]);
      }
    }
  };

  const renderPlayer = (p: Salary, source: 'A'|'B', isTradeList: boolean) => (
    <div
      key={p.playerId}
      draggable
      onDragStart={(e) => handleDragStart(e, p, source, isTradeList)}
      tabIndex={0}
      role="button"
      aria-label={`${isTradeList ? 'Remove' : 'Add'} ${getPlayerDisplay(p.playerId)} ${isTradeList ? 'from' : 'to'} trade`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          togglePlayerTrade(p, source, isTradeList);
        }
      }}
      className="bg-gray-800 border border-gray-700 p-3 rounded-lg mb-2 cursor-grab active:cursor-grabbing hover:bg-gray-750 transition flex items-center justify-between gap-2 focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-100 flex justify-between items-center">
          <span className="truncate">{getPlayerDisplay(p.playerId)}</span>
          <span className="text-gray-400 text-xs bg-gray-900 px-1.5 py-0.5 rounded ml-2">{getPlayerPosition(p.playerId)}</span>
        </div>
        <div className="text-xs text-gray-400 mt-0.5">Cap: {formatSalary(p.capHit)}</div>
      </div>
      
      {/* Touch / Click Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          togglePlayerTrade(p, source, isTradeList);
        }}
        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors touch-target min-h-[36px] ${
          isTradeList 
            ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30' 
            : 'bg-blue-600/30 text-blue-300 hover:bg-blue-600/50 border border-blue-500/40'
        }`}
      >
        {isTradeList ? '✕ Remove' : '+ Trade'}
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Trade Analyzer</h1>
          <p className="text-gray-400 mt-1">Drag and drop players to build a trade package.</p>
        </div>
        <div className="space-x-3">
          <button onClick={resetTrade} className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition">Reset</button>
          <button 
            disabled={tradingA.length === 0 && tradingB.length === 0}
            onClick={() => setShowModal(true)} 
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition disabled:opacity-50"
          >
            Analyze Trade
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-gray-400">Loading teams...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* TEAM A */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-200">Team A</h2>
            <select
              value={teamA}
              onChange={(e) => { setTeamA(e.target.value); setTradingA([]); }}
              className="w-full bg-gray-900 border border-gray-700 text-gray-100 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Team A</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.displayName}</option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-4">
              {/* Roster A */}
              <div 
                className="bg-gray-900/50 rounded-xl p-4 border border-gray-800 min-h-[400px]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, 'A', false)}
              >
                <h3 className="text-sm font-medium text-gray-400 uppercase mb-3">Roster</h3>
                {rosterA.length === 0 && teamA && <div className="text-gray-500 text-sm italic">No tradable players found.</div>}
                {rosterA.map(p => renderPlayer(p, 'A', false))}
              </div>

              {/* Giving A (Getting B) */}
              <div 
                className="bg-blue-900/20 rounded-xl p-4 border border-blue-900/50 min-h-[400px]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, 'B', true)}
              >
                <h3 className="text-sm font-medium text-blue-400 uppercase mb-3">Giving (To B)</h3>
                {tradingA.length === 0 && <div className="text-gray-500 text-sm italic">Drag players here.</div>}
                {tradingA.map(p => renderPlayer(p, 'A', true))}
              </div>
            </div>
          </div>

          {/* TEAM B */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-200">Team B</h2>
            <select
              value={teamB}
              onChange={(e) => { setTeamB(e.target.value); setTradingB([]); }}
              className="w-full bg-gray-900 border border-gray-700 text-gray-100 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Team B</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.displayName}</option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-4">
               {/* Giving B (Getting A) */}
               <div 
                className="bg-blue-900/20 rounded-xl p-4 border border-blue-900/50 min-h-[400px]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, 'A', true)}
              >
                <h3 className="text-sm font-medium text-blue-400 uppercase mb-3">Giving (To A)</h3>
                {tradingB.length === 0 && <div className="text-gray-500 text-sm italic">Drag players here.</div>}
                {tradingB.map(p => renderPlayer(p, 'B', true))}
              </div>

              {/* Roster B */}
              <div 
                className="bg-gray-900/50 rounded-xl p-4 border border-gray-800 min-h-[400px]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, 'B', false)}
              >
                <h3 className="text-sm font-medium text-gray-400 uppercase mb-3">Roster</h3>
                {rosterB.length === 0 && teamB && <div className="text-gray-500 text-sm italic">No tradable players found.</div>}
                {rosterB.map(p => renderPlayer(p, 'B', false))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trade Summary Panel */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mt-8">
        <h3 className="text-lg font-bold text-gray-100 mb-4">Trade Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="text-md font-semibold text-gray-300">Team A</h4>
            <div className="mt-2 space-y-1 text-sm text-gray-400">
              <p>Cap Traded: <span className="text-red-400">{formatSalary(capHitA)}</span></p>
              <p>Cap Received: <span className="text-green-400">{formatSalary(capHitB)}</span></p>
              <p>Net Cap Impact: <span className="text-gray-100 font-medium">{formatSalary(capHitB - capHitA)}</span></p>
            </div>
          </div>
          <div>
            <h4 className="text-md font-semibold text-gray-300">Team B</h4>
            <div className="mt-2 space-y-1 text-sm text-gray-400">
              <p>Cap Traded: <span className="text-red-400">{formatSalary(capHitB)}</span></p>
              <p>Cap Received: <span className="text-green-400">{formatSalary(capHitA)}</span></p>
              <p>Net Cap Impact: <span className="text-gray-100 font-medium">{formatSalary(capHitA - capHitB)}</span></p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-800 flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-400">Trade Winner (Statistical Value): </span>
            <strong className="text-lg text-white ml-2">
              {valueB > valueA ? 'Team A Wins' : valueA > valueB ? 'Team B Wins' : 'Even Trade'}
            </strong>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Cap Feasibility:</span>
            {/* Simple check: just show check if neither net impact is over 15M (arbitrary heuristic) */}
            {(capHitB - capHitA > 15000000) || (capHitA - capHitB > 15000000) ? (
              <span className="text-red-500 font-bold flex items-center gap-1">❌ Needs restructuring</span>
            ) : (
              <span className="text-green-500 font-bold flex items-center gap-1">✅ Passes</span>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full p-6 space-y-6">
            <h2 className="text-2xl font-bold text-gray-100">Trade Analysis</h2>
            
            <div className="space-y-4 text-gray-300">
              <div>
                <strong>Side A gives:</strong> {tradingA.length ? tradingA.map(p => getPlayerDisplay(p.playerId)).join(', ') : 'Nothing'}
              </div>
              <div>
                <strong>Side B gives:</strong> {tradingB.length ? tradingB.map(p => getPlayerDisplay(p.playerId)).join(', ') : 'Nothing'}
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <p>
                  {valueB > valueA 
                    ? `Side A receives more statistical position value (\${formatSalary(valueB)}) compared to what they gave up (\${formatSalary(valueA)}). Side A is arguably upgrading their roster.`
                    : valueA > valueB
                    ? `Side B receives more statistical position value (\${formatSalary(valueA)}) compared to what they gave up (\${formatSalary(valueB)}). Side B comes out ahead in terms of pure value.`
                    : 'The trade appears remarkably even in terms of statistical value exchanged.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 p-3 rounded">
                  <div className="font-semibold mb-1">Team A Cap</div>
                  <div className={capHitB > capHitA ? 'text-red-400' : 'text-green-400'}>
                    {(capHitB - capHitA) > 0 ? '+' : ''}{formatSalary(capHitB - capHitA)}
                  </div>
                </div>
                <div className="bg-gray-800/50 p-3 rounded">
                  <div className="font-semibold mb-1">Team B Cap</div>
                  <div className={capHitA > capHitB ? 'text-red-400' : 'text-green-400'}>
                    {(capHitA - capHitB) > 0 ? '+' : ''}{formatSalary(capHitA - capHitB)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-800">
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
