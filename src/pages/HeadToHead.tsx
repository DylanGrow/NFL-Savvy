import { useEffect, useState, useMemo } from 'react';
import { api } from '../lib/api';
import { getSalary, formatSalary, getTeamCapAllocated, NFL_CAP_2026 } from '../lib/salary';
import { fetchTeamsData, fetchStadiumsData } from '../lib/data';
import type { Team, Stadium } from '../types';

interface ComparedPlayer {
  id: string;
  name: string;
  position: string;
  jersey?: string;
  teamId: string;
  age?: number;
  height?: string;
  weight?: string;
  experience?: number;
  college?: string;
  photoUrl?: string;
  capHit?: number;
  aav?: number;
  totalValue?: number;
  guaranteedMoney?: number;
  yearsRemaining?: number;
  statsSummary?: any[];
}

export default function HeadToHead() {
  const [mode, setMode] = useState<'PLAYERS' | 'TEAMS'>('PLAYERS');
  const [teams, setTeams] = useState<Team[]>([]);
  const [stadiums, setStadiums] = useState<Record<string, Stadium>>({});
  const [loading, setLoading] = useState(true);

  // Player Mode State
  const [teamAId, setTeamAId] = useState('');
  const [teamBId, setTeamBId] = useState('');
  const [rosterA, setRosterA] = useState<any[]>([]);
  const [rosterB, setRosterB] = useState<any[]>([]);
  const [loadingRosterA, setLoadingRosterA] = useState(false);
  const [loadingRosterB, setLoadingRosterB] = useState(false);

  const [playerAId, setPlayerAId] = useState('');
  const [playerBId, setPlayerBId] = useState('');
  const [playerAData, setPlayerAData] = useState<ComparedPlayer | null>(null);
  const [playerBData, setPlayerBData] = useState<ComparedPlayer | null>(null);
  const [loadingPlayerA, setLoadingPlayerA] = useState(false);
  const [loadingPlayerB, setLoadingPlayerB] = useState(false);

  // Team Details for Team Mode
  const [teamADetails, setTeamADetails] = useState<any>(null);
  const [teamBDetails, setTeamBDetails] = useState<any>(null);

  useEffect(() => {
    document.title = 'Head-to-Head Comparator | NFL Hub';
    Promise.all([
      fetchTeamsData(),
      fetchStadiumsData().catch(() => []),
    ])
      .then(([ts, stads]) => {
        setTeams(ts);
        const sMap = (stads as Stadium[]).reduce((acc, s) => ({ ...acc, [s.name]: s }), {});
        setStadiums(sMap);
        if (ts.length >= 2) {
          setTeamAId(ts[0].id);
          setTeamBId(ts[1].id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Fetch Team A Roster
  useEffect(() => {
    if (!teamAId) {
      setRosterA([]);
      setPlayerAId('');
      setPlayerAData(null);
      return;
    }
    setLoadingRosterA(true);
    api
      .fetchRoster(teamAId)
      .then((data) => {
        const raw = (data?.athletes || []).flatMap((g: any) => g.items || []);
        const unique = Array.from(new Map(raw.map((p: any) => [String(p.id), p])).values());
        setRosterA(unique);
        if (unique.length > 0) {
          setPlayerAId(String((unique[0] as any).id));
        }
      })
      .catch(() => setRosterA([]))
      .finally(() => setLoadingRosterA(false));

    api
      .fetchTeam(teamAId)
      .then((res) => setTeamADetails(res?.team || res))
      .catch(() => setTeamADetails(null));
  }, [teamAId]);

  // Fetch Team B Roster
  useEffect(() => {
    if (!teamBId) {
      setRosterB([]);
      setPlayerBId('');
      setPlayerBData(null);
      return;
    }
    setLoadingRosterB(true);
    api
      .fetchRoster(teamBId)
      .then((data) => {
        const raw = (data?.athletes || []).flatMap((g: any) => g.items || []);
        const unique = Array.from(new Map(raw.map((p: any) => [String(p.id), p])).values());
        setRosterB(unique);
        if (unique.length > 0) {
          setPlayerBId(String((unique[0] as any).id));
        }
      })
      .catch(() => setRosterB([]))
      .finally(() => setLoadingRosterB(false));

    api
      .fetchTeam(teamBId)
      .then((res) => setTeamBDetails(res?.team || res))
      .catch(() => setTeamBDetails(null));
  }, [teamBId]);

  // Load Player A Bio & Stats
  useEffect(() => {
    if (!playerAId) {
      setPlayerAData(null);
      return;
    }
    setLoadingPlayerA(true);
    api
      .fetchPlayerBio(playerAId)
      .then((bioRes) => {
        const ath = bioRes?.athlete;
        const sal = getSalary(playerAId);
        setPlayerAData({
          id: playerAId,
          name: ath?.fullName || ath?.displayName || 'Player A',
          position: (ath?.position?.abbreviation || 'UNK').toUpperCase(),
          jersey: ath?.jersey,
          teamId: teamAId,
          age: ath?.age,
          height: ath?.displayHeight,
          weight: ath?.displayWeight,
          experience: ath?.experience?.years,
          college: ath?.college?.name,
          photoUrl: `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${playerAId}.png&w=120&h=90`,
          capHit: sal?.capHit,
          aav: sal?.aav,
          totalValue: sal?.totalValue,
          guaranteedMoney: sal?.guaranteedMoney,
          yearsRemaining: sal?.yearsRemaining,
          statsSummary: ath?.statsSummary?.statistics || [],
        });
      })
      .catch(() => setPlayerAData(null))
      .finally(() => setLoadingPlayerA(false));
  }, [playerAId, teamAId]);

  // Load Player B Bio & Stats
  useEffect(() => {
    if (!playerBId) {
      setPlayerBData(null);
      return;
    }
    setLoadingPlayerB(true);
    api
      .fetchPlayerBio(playerBId)
      .then((bioRes) => {
        const ath = bioRes?.athlete;
        const sal = getSalary(playerBId);
        setPlayerBData({
          id: playerBId,
          name: ath?.fullName || ath?.displayName || 'Player B',
          position: (ath?.position?.abbreviation || 'UNK').toUpperCase(),
          jersey: ath?.jersey,
          teamId: teamBId,
          age: ath?.age,
          height: ath?.displayHeight,
          weight: ath?.displayWeight,
          experience: ath?.experience?.years,
          college: ath?.college?.name,
          photoUrl: `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${playerBId}.png&w=120&h=90`,
          capHit: sal?.capHit,
          aav: sal?.aav,
          totalValue: sal?.totalValue,
          guaranteedMoney: sal?.guaranteedMoney,
          yearsRemaining: sal?.yearsRemaining,
          statsSummary: ath?.statsSummary?.statistics || [],
        });
      })
      .catch(() => setPlayerBData(null))
      .finally(() => setLoadingPlayerB(false));
  }, [playerBId, teamBId]);

  const teamA = useMemo(() => teams.find((t) => t.id === teamAId), [teams, teamAId]);
  const teamB = useMemo(() => teams.find((t) => t.id === teamBId), [teams, teamBId]);

  const compareMetric = (valA?: number, valB?: number, isLowerBetter = false) => {
    if (valA === undefined || valB === undefined || isNaN(valA) || isNaN(valB)) return { aClass: '', bClass: '' };
    if (valA === valB) return { aClass: 'text-gray-300 font-bold', bClass: 'text-gray-300 font-bold' };

    const aWins = isLowerBetter ? valA < valB : valA > valB;
    return {
      aClass: aWins ? 'text-emerald-400 font-extrabold' : 'text-gray-400',
      bClass: !aWins ? 'text-emerald-400 font-extrabold' : 'text-gray-400',
    };
  };

  const capStyles = compareMetric(playerAData?.capHit, playerBData?.capHit, true);
  const aavStyles = compareMetric(playerAData?.aav, playerBData?.aav, false);
  const totalStyles = compareMetric(playerAData?.totalValue, playerBData?.totalValue, false);
  const guarStyles = compareMetric(playerAData?.guaranteedMoney, playerBData?.guaranteedMoney, false);
  const ageStyles = compareMetric(playerAData?.age, playerBData?.age, true);

  return (
    <div className="app-container py-4 sm:py-8 space-y-6 sm:space-y-8 font-sans text-gray-100">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-900 border border-gray-800 p-4 sm:p-6 rounded-2xl gap-4 shadow-xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Head-to-Head Comparator</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Compare players across the entire NFL with full bios, contract metrics & live 2026 performance stats.
          </p>
        </div>

        <div className="bg-gray-950 rounded-xl p-1 border border-gray-800 flex w-full md:w-auto">
          <button
            className={`flex-1 md:flex-initial px-6 py-2.5 rounded-lg font-semibold text-xs sm:text-sm transition touch-target min-h-[44px] ${
              mode === 'PLAYERS' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
            }`}
            onClick={() => setMode('PLAYERS')}
          >
            Players Mode
          </button>
          <button
            className={`flex-1 md:flex-initial px-6 py-2.5 rounded-lg font-semibold text-xs sm:text-sm transition touch-target min-h-[44px] ${
              mode === 'TEAMS' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
            }`}
            onClick={() => setMode('TEAMS')}
          >
            Teams Mode
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-gray-500">Loading data...</div>
      ) : mode === 'PLAYERS' ? (
        /* ══════════════════════ PLAYER MODE ══════════════════════ */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Player A Selector Panel */}
            <div className="space-y-3 bg-gray-900 p-5 sm:p-6 rounded-2xl border border-gray-800 shadow-xl">
              <div className="flex items-center gap-3">
                {teamA && (
                  <img
                    src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/${teamA.abbreviation.toLowerCase()}.png&w=48&h=48`}
                    alt=""
                    className="w-10 h-10 object-contain bg-gray-950 p-1 rounded-xl border border-gray-800"
                  />
                )}
                <h2 className="text-lg font-bold text-white">Player A Selection</h2>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400">Team</label>
                <select
                  value={teamAId}
                  onChange={(e) => setTeamAId(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl p-2.5 text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.city} {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400">
                  Player ({rosterA.length} rostered)
                </label>
                <select
                  value={playerAId}
                  onChange={(e) => setPlayerAId(e.target.value)}
                  disabled={loadingRosterA || rosterA.length === 0}
                  className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl p-2.5 text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40"
                >
                  {loadingRosterA ? (
                    <option>Loading roster...</option>
                  ) : (
                    rosterA.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName || p.displayName} ({p.position?.abbreviation || 'UNK'}{' '}
                        {p.jersey ? `#${p.jersey}` : ''})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Player B Selector Panel */}
            <div className="space-y-3 bg-gray-900 p-5 sm:p-6 rounded-2xl border border-gray-800 shadow-xl">
              <div className="flex items-center gap-3">
                {teamB && (
                  <img
                    src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/${teamB.abbreviation.toLowerCase()}.png&w=48&h=48`}
                    alt=""
                    className="w-10 h-10 object-contain bg-gray-950 p-1 rounded-xl border border-gray-800"
                  />
                )}
                <h2 className="text-lg font-bold text-white">Player B Selection</h2>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400">Team</label>
                <select
                  value={teamBId}
                  onChange={(e) => setTeamBId(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl p-2.5 text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.city} {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400">
                  Player ({rosterB.length} rostered)
                </label>
                <select
                  value={playerBId}
                  onChange={(e) => setPlayerBId(e.target.value)}
                  disabled={loadingRosterB || rosterB.length === 0}
                  className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl p-2.5 text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40"
                >
                  {loadingRosterB ? (
                    <option>Loading roster...</option>
                  ) : (
                    rosterB.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName || p.displayName} ({p.position?.abbreviation || 'UNK'}{' '}
                        {p.jersey ? `#${p.jersey}` : ''})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* ── Side-by-Side Comparison Display ─────────────────────── */}
          {(playerAData || playerBData) && (
            <div className="bg-gray-900 p-5 sm:p-7 rounded-2xl border border-gray-800 shadow-xl space-y-6">
              {/* Profile Cards Header */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="flex flex-col items-center">
                  {playerAData?.photoUrl && (
                    <img
                      src={playerAData.photoUrl}
                      alt=""
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-800 object-cover border-2 border-blue-500 shadow mb-2"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <h3 className="font-extrabold text-base sm:text-xl text-white">
                    {loadingPlayerA ? 'Loading...' : playerAData?.name}
                  </h3>
                  <span className="text-xs font-mono text-blue-400">
                    {playerAData?.position} {playerAData?.jersey ? `#${playerAData.jersey}` : ''} • {teamA?.abbreviation}
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  {playerBData?.photoUrl && (
                    <img
                      src={playerBData.photoUrl}
                      alt=""
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-800 object-cover border-2 border-amber-500 shadow mb-2"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <h3 className="font-extrabold text-base sm:text-xl text-white">
                    {loadingPlayerB ? 'Loading...' : playerBData?.name}
                  </h3>
                  <span className="text-xs font-mono text-amber-400">
                    {playerBData?.position} {playerBData?.jersey ? `#${playerBData.jersey}` : ''} • {teamB?.abbreviation}
                  </span>
                </div>
              </div>

              {/* Comparison Table */}
              <div className="overflow-x-auto touch-scroll">
                <table className="w-full text-xs sm:text-sm font-mono border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4 text-left font-sans">Attribute / Stat</th>
                      <th className="py-3 px-4 text-center text-blue-400 font-sans">{playerAData?.name}</th>
                      <th className="py-3 px-4 text-center text-amber-400 font-sans">{playerBData?.name}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    <tr>
                      <td className="py-3 px-4 text-gray-300 font-sans font-medium">Position</td>
                      <td className="py-3 px-4 text-center">{playerAData?.position || '-'}</td>
                      <td className="py-3 px-4 text-center">{playerBData?.position || '-'}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-gray-300 font-sans font-medium">Age</td>
                      <td className={`py-3 px-4 text-center ${ageStyles.aClass}`}>{playerAData?.age || '-'}</td>
                      <td className={`py-3 px-4 text-center ${ageStyles.bClass}`}>{playerBData?.age || '-'}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-gray-300 font-sans font-medium">Height / Weight</td>
                      <td className="py-3 px-4 text-center">
                        {playerAData?.height || '-'} / {playerAData?.weight || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {playerBData?.height || '-'} / {playerBData?.weight || '-'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-gray-300 font-sans font-medium">Experience</td>
                      <td className="py-3 px-4 text-center">
                        {playerAData?.experience ? `${playerAData.experience} yrs` : 'Active'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {playerBData?.experience ? `${playerBData.experience} yrs` : 'Active'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-gray-300 font-sans font-medium">College</td>
                      <td className="py-3 px-4 text-center font-sans">{playerAData?.college || '-'}</td>
                      <td className="py-3 px-4 text-center font-sans">{playerBData?.college || '-'}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-gray-300 font-sans font-medium">2026 Cap Hit</td>
                      <td className={`py-3 px-4 text-center ${capStyles.aClass}`}>
                        {playerAData?.capHit ? formatSalary(playerAData.capHit) : 'Unlisted'}
                      </td>
                      <td className={`py-3 px-4 text-center ${capStyles.bClass}`}>
                        {playerBData?.capHit ? formatSalary(playerBData.capHit) : 'Unlisted'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-gray-300 font-sans font-medium">Average Annual (AAV)</td>
                      <td className={`py-3 px-4 text-center ${aavStyles.aClass}`}>
                        {playerAData?.aav ? formatSalary(playerAData.aav) : '-'}
                      </td>
                      <td className={`py-3 px-4 text-center ${aavStyles.bClass}`}>
                        {playerBData?.aav ? formatSalary(playerBData.aav) : '-'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-gray-300 font-sans font-medium">Contract Total Value</td>
                      <td className={`py-3 px-4 text-center ${totalStyles.aClass}`}>
                        {playerAData?.totalValue ? formatSalary(playerAData.totalValue) : '-'}
                      </td>
                      <td className={`py-3 px-4 text-center ${totalStyles.bClass}`}>
                        {playerBData?.totalValue ? formatSalary(playerBData.totalValue) : '-'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-gray-300 font-sans font-medium">Guaranteed Money</td>
                      <td className={`py-3 px-4 text-center ${guarStyles.aClass}`}>
                        {playerAData?.guaranteedMoney ? formatSalary(playerAData.guaranteedMoney) : '-'}
                      </td>
                      <td className={`py-3 px-4 text-center ${guarStyles.bClass}`}>
                        {playerBData?.guaranteedMoney ? formatSalary(playerBData.guaranteedMoney) : '-'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ══════════════════════ TEAM MODE ══════════════════════ */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Team A Selection */}
            <div className="space-y-4 bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl">
              <h2 className="text-xl font-bold text-white">Team A</h2>
              <select
                value={teamAId}
                onChange={(e) => setTeamAId(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl p-2.5 font-semibold text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.city} {t.name}
                  </option>
                ))}
              </select>

              {teamA && (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/${teamA.abbreviation.toLowerCase()}.png&w=64&h=64`}
                      alt={teamA.name}
                      className="w-16 h-16 object-contain bg-gray-950 p-2 rounded-2xl border border-gray-800"
                    />
                    <div>
                      <div className="text-xl font-extrabold text-white">{teamA.name}</div>
                      <div className="text-xs text-gray-400 font-mono">
                        {teamA.conference} {teamA.division} • {teamADetails?.record?.items?.[0]?.summary || '2026 Season'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-gray-400">
                      <span>Salary Cap Usage:</span>
                      <span className="font-bold text-white">
                        {formatSalary(getTeamCapAllocated(teamAId))} / {formatSalary(NFL_CAP_2026)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (getTeamCapAllocated(teamAId) / NFL_CAP_2026) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Team B Selection */}
            <div className="space-y-4 bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl">
              <h2 className="text-xl font-bold text-white">Team B</h2>
              <select
                value={teamBId}
                onChange={(e) => setTeamBId(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl p-2.5 font-semibold text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.city} {t.name}
                  </option>
                ))}
              </select>

              {teamB && (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/${teamB.abbreviation.toLowerCase()}.png&w=64&h=64`}
                      alt={teamB.name}
                      className="w-16 h-16 object-contain bg-gray-950 p-2 rounded-2xl border border-gray-800"
                    />
                    <div>
                      <div className="text-xl font-extrabold text-white">{teamB.name}</div>
                      <div className="text-xs text-gray-400 font-mono">
                        {teamB.conference} {teamB.division} • {teamBDetails?.record?.items?.[0]?.summary || '2026 Season'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-gray-400">
                      <span>Salary Cap Usage:</span>
                      <span className="font-bold text-white">
                        {formatSalary(getTeamCapAllocated(teamBId))} / {formatSalary(NFL_CAP_2026)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (getTeamCapAllocated(teamBId) / NFL_CAP_2026) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
