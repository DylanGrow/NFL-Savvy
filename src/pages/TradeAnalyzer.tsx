import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../lib/api';
import { getSalary, formatSalary, NFL_CAP_2026 } from '../lib/salary';
import { fetchTeamsData } from '../lib/data';
import type { Team } from '../types';

interface TradablePlayer {
  id: string;
  name: string;
  position: string;
  jersey?: string;
  teamId: string;
  age?: number;
  experience?: number;
  capHit: number;
  isEstimatedSalary?: boolean;
  photoUrl?: string;
}

interface DraftPick {
  id: string;
  year: number;
  round: number;
  name: string;
  teamId: string;
  valuePoints: number;
}

const POSITION_WEIGHTS: Record<string, number> = {
  QB: 1.6,
  EDGE: 1.35,
  DE: 1.3,
  WR: 1.25,
  LT: 1.25,
  OT: 1.2,
  CB: 1.2,
  DT: 1.15,
  TE: 1.05,
  LB: 1.0,
  S: 1.0,
  G: 0.95,
  C: 0.95,
  RT: 0.95,
  RB: 0.85,
  K: 0.5,
  P: 0.45,
  LS: 0.35,
};

const DRAFT_PICK_TEMPLATES = [
  { round: 1, year: 2026, name: '2026 1st Round Pick', valuePoints: 1000 },
  { round: 2, year: 2026, name: '2026 2nd Round Pick', valuePoints: 450 },
  { round: 3, year: 2026, name: '2026 3rd Round Pick', valuePoints: 220 },
  { round: 4, year: 2026, name: '2026 4th Round Pick', valuePoints: 100 },
  { round: 5, year: 2026, name: '2026 5th-7th Rd Pick', valuePoints: 45 },
  { round: 1, year: 2027, name: '2027 1st Round Pick', valuePoints: 850 },
  { round: 2, year: 2027, name: '2027 2nd Round Pick', valuePoints: 380 },
];

function estimateCapHit(p: any): { capHit: number; isEstimated: boolean } {
  const sal = getSalary(p.id);
  if (sal) return { capHit: sal.capHit, isEstimated: false };

  const exp = p.experience?.years || 0;
  const pos = (p.position?.abbreviation || '').toUpperCase();

  if (pos === 'QB') {
    if (exp >= 8) return { capHit: 32000000, isEstimated: true };
    if (exp >= 4) return { capHit: 18000000, isEstimated: true };
    return { capHit: 6500000, isEstimated: true };
  }
  if (['EDGE', 'DE', 'WR', 'LT', 'OT', 'CB'].includes(pos)) {
    if (exp >= 6) return { capHit: 18000000, isEstimated: true };
    if (exp >= 3) return { capHit: 9500000, isEstimated: true };
    return { capHit: 3200000, isEstimated: true };
  }
  if (['DT', 'LB', 'S', 'TE', 'RT', 'G', 'C'].includes(pos)) {
    if (exp >= 6) return { capHit: 12000000, isEstimated: true };
    if (exp >= 3) return { capHit: 6500000, isEstimated: true };
    return { capHit: 2400000, isEstimated: true };
  }
  if (pos === 'RB') {
    if (exp >= 5) return { capHit: 8500000, isEstimated: true };
    return { capHit: 2800000, isEstimated: true };
  }
  return { capHit: 1800000, isEstimated: true };
}

export default function TradeAnalyzer() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);

  const [teamAId, setTeamAId] = useState<string>('');
  const [teamBId, setTeamBId] = useState<string>('');

  const [rosterA, setRosterA] = useState<TradablePlayer[]>([]);
  const [rosterB, setRosterB] = useState<TradablePlayer[]>([]);
  const [loadingRosterA, setLoadingRosterA] = useState(false);
  const [loadingRosterB, setLoadingRosterB] = useState(false);

  // Selected trade items from each side
  const [tradingPlayersA, setTradingPlayersA] = useState<TradablePlayer[]>([]);
  const [tradingPicksA, setTradingPicksA] = useState<DraftPick[]>([]);

  const [tradingPlayersB, setTradingPlayersB] = useState<TradablePlayer[]>([]);
  const [tradingPicksB, setTradingPicksB] = useState<DraftPick[]>([]);

  // Search & Filter
  const [searchA, setSearchA] = useState('');
  const [posFilterA, setPosFilterA] = useState('ALL');

  const [searchB, setSearchB] = useState('');
  const [posFilterB, setPosFilterB] = useState('ALL');

  const [showModal, setShowModal] = useState(false);

  // Initial load: 32 NFL teams
  useEffect(() => {
    document.title = 'Trade Analyzer | NFL Hub';
    fetchTeamsData()
      .then((ts) => {
        setTeams(ts);
        if (ts.length >= 2) {
          setTeamAId(ts[0].id);
          setTeamBId(ts[1].id);
        }
      })
      .finally(() => setLoadingTeams(false));
  }, []);

  // Fetch Team A Roster
  useEffect(() => {
    if (!teamAId) {
      setRosterA([]);
      setTradingPlayersA([]);
      setTradingPicksA([]);
      return;
    }
    setLoadingRosterA(true);
    setTradingPlayersA([]);
    setTradingPicksA([]);

    api
      .fetchRoster(teamAId)
      .then((data) => {
        const raw = (data?.athletes || []).flatMap((g: any) => g.items || []);
        const seen = new Set<string>();
        const players: TradablePlayer[] = [];
        for (const p of raw) {
          if (!p?.id || seen.has(String(p.id))) continue;
          seen.add(String(p.id));
          const { capHit, isEstimated } = estimateCapHit(p);
          players.push({
            id: String(p.id),
            name: p.fullName || p.displayName || `Player ${p.id}`,
            position: (p.position?.abbreviation || 'UNK').toUpperCase(),
            jersey: p.jersey,
            teamId: teamAId,
            age: p.age,
            experience: p.experience?.years,
            capHit,
            isEstimatedSalary: isEstimated,
            photoUrl: `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${p.id}.png&w=48&h=35`,
          });
        }
        setRosterA(players);
      })
      .catch(() => setRosterA([]))
      .finally(() => setLoadingRosterA(false));
  }, [teamAId]);

  // Fetch Team B Roster
  useEffect(() => {
    if (!teamBId) {
      setRosterB([]);
      setTradingPlayersB([]);
      setTradingPicksB([]);
      return;
    }
    setLoadingRosterB(true);
    setTradingPlayersB([]);
    setTradingPicksB([]);

    api
      .fetchRoster(teamBId)
      .then((data) => {
        const raw = (data?.athletes || []).flatMap((g: any) => g.items || []);
        const seen = new Set<string>();
        const players: TradablePlayer[] = [];
        for (const p of raw) {
          if (!p?.id || seen.has(String(p.id))) continue;
          seen.add(String(p.id));
          const { capHit, isEstimated } = estimateCapHit(p);
          players.push({
            id: String(p.id),
            name: p.fullName || p.displayName || `Player ${p.id}`,
            position: (p.position?.abbreviation || 'UNK').toUpperCase(),
            jersey: p.jersey,
            teamId: teamBId,
            age: p.age,
            experience: p.experience?.years,
            capHit,
            isEstimatedSalary: isEstimated,
            photoUrl: `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${p.id}.png&w=48&h=35`,
          });
        }
        setRosterB(players);
      })
      .catch(() => setRosterB([]))
      .finally(() => setLoadingRosterB(false));
  }, [teamBId]);

  const teamAObj = useMemo(() => teams.find((t) => t.id === teamAId), [teams, teamAId]);
  const teamBObj = useMemo(() => teams.find((t) => t.id === teamBId), [teams, teamBId]);

  // Filtered available rosters
  const availableRosterA = useMemo(() => {
    const tradingIds = new Set(tradingPlayersA.map((p) => p.id));
    return rosterA.filter((p) => {
      if (tradingIds.has(p.id)) return false;
      if (posFilterA !== 'ALL' && p.position !== posFilterA) return false;
      if (searchA.trim() && !p.name.toLowerCase().includes(searchA.trim().toLowerCase())) return false;
      return true;
    });
  }, [rosterA, tradingPlayersA, posFilterA, searchA]);

  const availableRosterB = useMemo(() => {
    const tradingIds = new Set(tradingPlayersB.map((p) => p.id));
    return rosterB.filter((p) => {
      if (tradingIds.has(p.id)) return false;
      if (posFilterB !== 'ALL' && p.position !== posFilterB) return false;
      if (searchB.trim() && !p.name.toLowerCase().includes(searchB.trim().toLowerCase())) return false;
      return true;
    });
  }, [rosterB, tradingPlayersB, posFilterB, searchB]);

  // Toggle Player Trade Selection
  const togglePlayerA = (p: TradablePlayer) => {
    setTradingPlayersA((prev) =>
      prev.some((x) => x.id === p.id) ? prev.filter((x) => x.id !== p.id) : [...prev, p]
    );
  };

  const togglePlayerB = (p: TradablePlayer) => {
    setTradingPlayersB((prev) =>
      prev.some((x) => x.id === p.id) ? prev.filter((x) => x.id !== p.id) : [...prev, p]
    );
  };

  // Toggle Draft Pick Trade Selection
  const togglePickA = (template: typeof DRAFT_PICK_TEMPLATES[0]) => {
    const pickId = `${teamAId}_${template.year}_r${template.round}`;
    setTradingPicksA((prev) =>
      prev.some((x) => x.id === pickId)
        ? prev.filter((x) => x.id !== pickId)
        : [...prev, { ...template, id: pickId, teamId: teamAId }]
    );
  };

  const togglePickB = (template: typeof DRAFT_PICK_TEMPLATES[0]) => {
    const pickId = `${teamBId}_${template.year}_r${template.round}`;
    setTradingPicksB((prev) =>
      prev.some((x) => x.id === pickId)
        ? prev.filter((x) => x.id !== pickId)
        : [...prev, { ...template, id: pickId, teamId: teamBId }]
    );
  };

  const resetTrade = () => {
    setTradingPlayersA([]);
    setTradingPicksA([]);
    setTradingPlayersB([]);
    setTradingPicksB([]);
  };

  // Trade Value & Cap Calculations
  const calculatePlayerPoints = (players: TradablePlayer[]) => {
    return players.reduce((sum, p) => {
      const weight = POSITION_WEIGHTS[p.position] || 1.0;
      // Normalizes cap hit into approximate value points: $10M ~ 350 pts
      const basePts = (p.capHit / 1000000) * 35;
      return sum + basePts * weight;
    }, 0);
  };

  const calculatePickPoints = (picks: DraftPick[]) => {
    return picks.reduce((sum, pk) => sum + pk.valuePoints, 0);
  };

  const capOutA = tradingPlayersA.reduce((sum, p) => sum + p.capHit, 0);
  const capInA = tradingPlayersB.reduce((sum, p) => sum + p.capHit, 0);
  const netCapA = capInA - capOutA;

  const capOutB = capInA;
  const capInB = capOutA;
  const netCapB = capInB - capOutB;

  const totalPointsA = calculatePlayerPoints(tradingPlayersA) + calculatePickPoints(tradingPicksA);
  const totalPointsB = calculatePlayerPoints(tradingPlayersB) + calculatePickPoints(tradingPicksB);

  // Compute Trade Grades
  const computeTradeGrade = (ptsOut: number, ptsIn: number) => {
    if (ptsOut === 0 && ptsIn === 0) return { grade: 'N/A', label: 'No Trade' };
    const ratio = ptsIn / (ptsOut || 1);
    if (ratio >= 1.35) return { grade: 'A+', label: 'Huge Win', color: 'text-emerald-400' };
    if (ratio >= 1.15) return { grade: 'A', label: 'Favorable', color: 'text-emerald-300' };
    if (ratio >= 0.9) return { grade: 'B+', label: 'Fair Trade', color: 'text-blue-400' };
    if (ratio >= 0.75) return { grade: 'B', label: 'Acceptable', color: 'text-amber-400' };
    if (ratio >= 0.55) return { grade: 'C', label: 'Overpaid', color: 'text-orange-400' };
    return { grade: 'D', label: 'Severe Loss', color: 'text-rose-400' };
  };

  const gradeA = computeTradeGrade(totalPointsA, totalPointsB);
  const gradeB = computeTradeGrade(totalPointsB, totalPointsA);

  const POSITIONS = ['ALL', 'QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S'];

  return (
    <div className="app-container py-4 sm:py-8 space-y-6 sm:space-y-8 font-sans text-gray-100">
      {/* ── Header Bar ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-900 border border-gray-800 p-4 sm:p-6 rounded-2xl gap-4 shadow-xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">NFL Trade Analyzer</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Simulate blockbuster multi-player trades & draft pick packages with live cap feasibility checks.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={resetTrade}
            className="px-4 py-2.5 bg-gray-950 hover:bg-gray-850 text-gray-300 rounded-xl border border-gray-800 text-xs sm:text-sm font-semibold transition"
          >
            Clear Trade
          </button>
          <button
            disabled={
              tradingPlayersA.length === 0 &&
              tradingPicksA.length === 0 &&
              tradingPlayersB.length === 0 &&
              tradingPicksB.length === 0
            }
            onClick={() => setShowModal(true)}
            className="flex-1 sm:flex-initial px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg transition disabled:opacity-40"
          >
            Analyze Trade Results →
          </button>
        </div>
      </div>

      {loadingTeams ? (
        <div className="h-64 flex items-center justify-center text-gray-500">Loading NFL franchises...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ══════════════════════ TEAM A PANEL ══════════════════════ */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                {teamAObj && (
                  <img
                    src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/${teamAObj.abbreviation.toLowerCase()}.png&w=48&h=48`}
                    alt=""
                    className="w-10 h-10 object-contain bg-gray-950 p-1 rounded-xl border border-gray-800"
                  />
                )}
                <div>
                  <h2 className="text-lg font-bold text-white">Team A</h2>
                  <span className="text-xs text-gray-400 font-mono">
                    Giving {tradingPlayersA.length} Players + {tradingPicksA.length} Picks
                  </span>
                </div>
              </div>

              <select
                value={teamAId}
                onChange={(e) => setTeamAId(e.target.value)}
                className="bg-gray-950 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.city} {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Trade Package Selected by Team A */}
            <div className="bg-blue-950/20 border border-blue-900/40 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-blue-400 uppercase tracking-wider">
                <span>{teamAObj?.name || 'Team A'} Trade Package</span>
                <span>{formatSalary(capOutA)} Cap</span>
              </div>

              {tradingPlayersA.length === 0 && tradingPicksA.length === 0 ? (
                <p className="text-gray-500 text-xs italic py-2">Click "+ Trade" on players or draft picks below.</p>
              ) : (
                <div className="space-y-1.5">
                  {tradingPlayersA.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between bg-gray-950 border border-gray-800 px-3 py-1.5 rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-gray-300">{p.position}</span>
                        <span className="text-white font-medium">{p.name}</span>
                        <span className="text-gray-500 font-mono">{formatSalary(p.capHit)}</span>
                      </div>
                      <button
                        onClick={() => togglePlayerA(p)}
                        className="text-rose-400 hover:text-rose-300 font-bold px-1.5 py-0.5 rounded hover:bg-rose-950/40"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {tradingPicksA.map((pk) => (
                    <div
                      key={pk.id}
                      className="flex items-center justify-between bg-indigo-950/50 border border-indigo-800/60 px-3 py-1.5 rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-indigo-300">🎟️ {pk.name}</span>
                        <span className="text-[10px] text-indigo-400 font-mono">({pk.valuePoints} pts)</span>
                      </div>
                      <button
                        onClick={() => togglePickA(pk)}
                        className="text-rose-400 hover:text-rose-300 font-bold px-1.5 py-0.5 rounded hover:bg-rose-950/40"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Team A Draft Picks Picker */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">
                Include Draft Picks
              </span>
              <div className="flex flex-wrap gap-1.5">
                {DRAFT_PICK_TEMPLATES.map((tmpl) => {
                  const pickId = `${teamAId}_${tmpl.year}_r${tmpl.round}`;
                  const isSelected = tradingPicksA.some((pk) => pk.id === pickId);
                  return (
                    <button
                      key={tmpl.name}
                      onClick={() => togglePickA(tmpl)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-gray-950 text-gray-400 border-gray-800 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      {tmpl.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Team A Roster Browser */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Roster ({availableRosterA.length})
                </span>
                <input
                  type="text"
                  placeholder="Filter player..."
                  value={searchA}
                  onChange={(e) => setSearchA(e.target.value)}
                  className="bg-gray-950 border border-gray-800 text-white text-xs px-2.5 py-1 rounded-lg w-36 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Position Filter */}
              <div className="flex overflow-x-auto touch-scroll gap-1 pb-1 scrollbar-none">
                {POSITIONS.map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setPosFilterA(pos)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition ${
                      posFilterA === pos ? 'bg-blue-600 text-white' : 'bg-gray-950 text-gray-400 hover:text-white'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>

              <div className="bg-gray-950 rounded-xl p-2 border border-gray-800 max-h-72 overflow-y-auto space-y-1">
                {loadingRosterA ? (
                  <p className="text-gray-500 text-xs py-4 text-center">Loading {teamAObj?.name} roster...</p>
                ) : availableRosterA.length === 0 ? (
                  <p className="text-gray-500 text-xs py-4 text-center">No available players found.</p>
                ) : (
                  availableRosterA.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-850 transition text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={p.photoUrl}
                          alt=""
                          className="w-7 h-7 rounded-full bg-gray-800 object-cover flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="truncate">
                          <span className="font-bold text-white mr-1.5">{p.name}</span>
                          <span className="font-mono text-gray-400 text-[10px]">{p.position}</span>
                          <span className="text-gray-500 text-[10px] ml-1.5 font-mono">{formatSalary(p.capHit)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => togglePlayerA(p)}
                        className="bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white px-2 py-1 rounded font-bold text-[11px] transition"
                      >
                        + Trade
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ══════════════════════ TEAM B PANEL ══════════════════════ */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                {teamBObj && (
                  <img
                    src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/${teamBObj.abbreviation.toLowerCase()}.png&w=48&h=48`}
                    alt=""
                    className="w-10 h-10 object-contain bg-gray-950 p-1 rounded-xl border border-gray-800"
                  />
                )}
                <div>
                  <h2 className="text-lg font-bold text-white">Team B</h2>
                  <span className="text-xs text-gray-400 font-mono">
                    Giving {tradingPlayersB.length} Players + {tradingPicksB.length} Picks
                  </span>
                </div>
              </div>

              <select
                value={teamBId}
                onChange={(e) => setTeamBId(e.target.value)}
                className="bg-gray-950 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.city} {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Trade Package Selected by Team B */}
            <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase tracking-wider">
                <span>{teamBObj?.name || 'Team B'} Trade Package</span>
                <span>{formatSalary(capOutB)} Cap</span>
              </div>

              {tradingPlayersB.length === 0 && tradingPicksB.length === 0 ? (
                <p className="text-gray-500 text-xs italic py-2">Click "+ Trade" on players or draft picks below.</p>
              ) : (
                <div className="space-y-1.5">
                  {tradingPlayersB.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between bg-gray-950 border border-gray-800 px-3 py-1.5 rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-gray-300">{p.position}</span>
                        <span className="text-white font-medium">{p.name}</span>
                        <span className="text-gray-500 font-mono">{formatSalary(p.capHit)}</span>
                      </div>
                      <button
                        onClick={() => togglePlayerB(p)}
                        className="text-rose-400 hover:text-rose-300 font-bold px-1.5 py-0.5 rounded hover:bg-rose-950/40"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {tradingPicksB.map((pk) => (
                    <div
                      key={pk.id}
                      className="flex items-center justify-between bg-indigo-950/50 border border-indigo-800/60 px-3 py-1.5 rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-indigo-300">🎟️ {pk.name}</span>
                        <span className="text-[10px] text-indigo-400 font-mono">({pk.valuePoints} pts)</span>
                      </div>
                      <button
                        onClick={() => togglePickB(pk)}
                        className="text-rose-400 hover:text-rose-300 font-bold px-1.5 py-0.5 rounded hover:bg-rose-950/40"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Team B Draft Picks Picker */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">
                Include Draft Picks
              </span>
              <div className="flex flex-wrap gap-1.5">
                {DRAFT_PICK_TEMPLATES.map((tmpl) => {
                  const pickId = `${teamBId}_${tmpl.year}_r${tmpl.round}`;
                  const isSelected = tradingPicksB.some((pk) => pk.id === pickId);
                  return (
                    <button
                      key={tmpl.name}
                      onClick={() => togglePickB(tmpl)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition ${
                        isSelected
                          ? 'bg-amber-600 text-white border-amber-500'
                          : 'bg-gray-950 text-gray-400 border-gray-800 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      {tmpl.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Team B Roster Browser */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Roster ({availableRosterB.length})
                </span>
                <input
                  type="text"
                  placeholder="Filter player..."
                  value={searchB}
                  onChange={(e) => setSearchB(e.target.value)}
                  className="bg-gray-950 border border-gray-800 text-white text-xs px-2.5 py-1 rounded-lg w-36 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Position Filter */}
              <div className="flex overflow-x-auto touch-scroll gap-1 pb-1 scrollbar-none">
                {POSITIONS.map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setPosFilterB(pos)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition ${
                      posFilterB === pos ? 'bg-amber-600 text-white' : 'bg-gray-950 text-gray-400 hover:text-white'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>

              <div className="bg-gray-950 rounded-xl p-2 border border-gray-800 max-h-72 overflow-y-auto space-y-1">
                {loadingRosterB ? (
                  <p className="text-gray-500 text-xs py-4 text-center">Loading {teamBObj?.name} roster...</p>
                ) : availableRosterB.length === 0 ? (
                  <p className="text-gray-500 text-xs py-4 text-center">No available players found.</p>
                ) : (
                  availableRosterB.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-850 transition text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={p.photoUrl}
                          alt=""
                          className="w-7 h-7 rounded-full bg-gray-800 object-cover flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="truncate">
                          <span className="font-bold text-white mr-1.5">{p.name}</span>
                          <span className="font-mono text-gray-400 text-[10px]">{p.position}</span>
                          <span className="text-gray-500 text-[10px] ml-1.5 font-mono">{formatSalary(p.capHit)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => togglePlayerB(p)}
                        className="bg-amber-600/30 hover:bg-amber-600 text-amber-300 hover:text-white px-2 py-1 rounded font-bold text-[11px] transition"
                      >
                        + Trade
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Summary & Trade Evaluation Bar ──────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-7 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>⚖️</span> Trade Value & Cap Evaluation
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-950 border border-gray-800 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-blue-400">{teamAObj?.name || 'Team A'} Outlook</span>
              <span className={`text-base font-extrabold ${gradeA.color}`}>
                Grade: {gradeA.grade} ({gradeA.label})
              </span>
            </div>
            <div className="text-xs text-gray-400 space-y-1 font-mono pt-1">
              <div className="flex justify-between">
                <span>Cap Sent Out:</span>
                <span className="text-rose-400">{formatSalary(capOutA)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cap Taken On:</span>
                <span className="text-emerald-400">{formatSalary(capInA)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-850 pt-1 font-bold text-white">
                <span>Net Cap Shift:</span>
                <span className={netCapA > 0 ? 'text-rose-300' : 'text-emerald-300'}>
                  {netCapA > 0 ? `+${formatSalary(netCapA)}` : formatSalary(netCapA)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-950 border border-gray-800 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-amber-400">{teamBObj?.name || 'Team B'} Outlook</span>
              <span className={`text-base font-extrabold ${gradeB.color}`}>
                Grade: {gradeB.grade} ({gradeB.label})
              </span>
            </div>
            <div className="text-xs text-gray-400 space-y-1 font-mono pt-1">
              <div className="flex justify-between">
                <span>Cap Sent Out:</span>
                <span className="text-rose-400">{formatSalary(capOutB)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cap Taken On:</span>
                <span className="text-emerald-400">{formatSalary(capInB)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-850 pt-1 font-bold text-white">
                <span>Net Cap Shift:</span>
                <span className={netCapB > 0 ? 'text-rose-300' : 'text-emerald-300'}>
                  {netCapB > 0 ? `+${formatSalary(netCapB)}` : formatSalary(netCapB)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal Breakdown ─────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-xl font-extrabold text-white">Trade Analysis Breakdown</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white font-bold text-lg">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800 space-y-2">
                <div className="font-bold text-blue-400">{teamAObj?.name} Receives:</div>
                {tradingPlayersB.length === 0 && tradingPicksB.length === 0 ? (
                  <p className="text-gray-500 italic">None</p>
                ) : (
                  <ul className="space-y-1 text-gray-300">
                    {tradingPlayersB.map((p) => (
                      <li key={p.id}>• {p.name} ({p.position})</li>
                    ))}
                    {tradingPicksB.map((pk) => (
                      <li key={pk.id} className="text-indigo-300">• {pk.name}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800 space-y-2">
                <div className="font-bold text-amber-400">{teamBObj?.name} Receives:</div>
                {tradingPlayersA.length === 0 && tradingPicksA.length === 0 ? (
                  <p className="text-gray-500 italic">None</p>
                ) : (
                  <ul className="space-y-1 text-gray-300">
                    {tradingPlayersA.map((p) => (
                      <li key={p.id}>• {p.name} ({p.position})</li>
                    ))}
                    {tradingPicksA.map((pk) => (
                      <li key={pk.id} className="text-indigo-300">• {pk.name}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="p-4 bg-gray-950 rounded-xl border border-gray-800 text-xs sm:text-sm text-gray-300 leading-relaxed">
              <span className="font-bold text-white block mb-1">Executive Summary:</span>
              {totalPointsA > totalPointsB ? (
                <span>
                  {teamBObj?.name} receives the stronger surplus value package (+{Math.round(totalPointsA - totalPointsB)} pts).
                  {netCapA < 0 ? ` ${teamAObj?.name} clears ${formatSalary(Math.abs(netCapA))} in salary cap relief.` : ''}
                </span>
              ) : (
                <span>
                  {teamAObj?.name} secures the superior asset package (+{Math.round(totalPointsB - totalPointsA)} pts).
                  {netCapB < 0 ? ` ${teamBObj?.name} clears ${formatSalary(Math.abs(netCapB))} in salary cap space.` : ''}
                </span>
              )}
            </div>

            <div className="text-right">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold"
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
