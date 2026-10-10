import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { fetchTeamsData } from '../lib/data';

export default function DepthCharts() {
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [depthData, setDepthData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Depth Charts | NFL Hub';
    fetchTeamsData()
      .then(data => {
        const ts = Array.isArray(data) ? data : (data as any).teams || [];
        setTeams(ts);
        if (ts.length > 0) {
          setSelectedTeam(ts[0].id || ts[0].team?.id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedTeam) return;
    setLoading(true);
    setError(null);
    setDepthData(null);
    
    api.fetchDepthChart(selectedTeam)
      .then(res => {
        setDepthData(res);
      })
      .catch(err => {
        setError(err.message || 'Failed to load depth chart');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedTeam]);

  const offPos = ['QB', 'RB', 'HB', 'FB', 'WR', 'TE', 'LT', 'LG', 'C', 'RG', 'RT'];
  const defPos = ['DE', 'DT', 'NT', 'LOLB', 'MLB', 'ROLB', 'LB', 'CB', 'SS', 'FS', 'S'];
  const stPos = ['K', 'P', 'KR', 'PR', 'LS', 'H'];

  const getGroup = (abbr: string) => {
    const a = abbr.toUpperCase();
    if (offPos.includes(a)) return 'Offense';
    if (defPos.includes(a)) return 'Defense';
    if (stPos.includes(a)) return 'Special Teams';
    return 'Other';
  };

  const grouped: Record<string, any[]> = {
    'Offense': [],
    'Defense': [],
    'Special Teams': [],
    'Other': []
  };

  if (depthData?.items) {
    depthData.items.forEach((item: any) => {
      const pos = item.position?.abbreviation || 'UNK';
      const group = getGroup(pos);
      grouped[group].push(item);
    });
  }

  const renderTable = (title: string, items: any[]) => {
    if (!items || items.length === 0) return null;
    
    return (
      <div className="mb-6 bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-md">
        <div className="bg-gray-950 px-4 py-3 border-b border-gray-800 font-bold text-sm sm:text-base text-gray-200 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          {title}
        </div>
        <div className="overflow-x-auto touch-scroll">
          <table className="w-full text-left text-xs sm:text-sm min-w-[500px]">
            <thead className="bg-gray-950/60 text-gray-400 border-b border-gray-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 w-20">POS</th>
                <th className="px-4 py-3">1st String</th>
                <th className="px-4 py-3">2nd String</th>
                <th className="px-4 py-3">3rd String</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {items.map((row: any, i) => {
                const athletes = row.athletes || [];
                const getStr = (rank: number) => athletes.find((a: any) => a.rank === rank)?.athlete;

                const s1 = getStr(1);
                const s2 = getStr(2);
                const s3 = getStr(3);

                const renderPlayer = (p: any) => {
                  if (!p) return <span className="text-gray-600">-</span>;
                  return (
                    <Link to={`/players/${p.id}`} className="inline-flex items-center space-x-2 text-gray-200 hover:text-blue-400 group py-1">
                      <div className="w-6 h-6 rounded-full bg-gray-800 overflow-hidden flex-shrink-0 border border-gray-700">
                        {p.headshot?.href && <img src={p.headshot.href} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <span className="truncate group-hover:underline">{p.displayName || p.lastName}</span>
                    </Link>
                  );
                };

                return (
                  <tr key={`${row.position?.id || i}`} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 font-bold font-mono text-gray-300">{row.position?.abbreviation}</td>
                    <td className="px-4 py-3">{renderPlayer(s1)}</td>
                    <td className="px-4 py-3">{renderPlayer(s2)}</td>
                    <td className="px-4 py-3">{renderPlayer(s3)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="app-container py-4 sm:py-8 text-white font-sans space-y-6">
      <div className="bg-gray-900 border border-gray-800 p-4 sm:p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">NFL Depth Charts</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">Official 1st, 2nd, and 3rd string depth charts across Offense, Defense, and Special Teams</p>
        </div>
        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          className="w-full sm:w-auto bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm min-h-[44px]"
        >
          {teams.map((t: any) => {
            const id = t.id || t.team?.id;
            const name = t.displayName || t.name || t.team?.displayName || `Team ${id}`;
            return <option key={id} value={id}>{name}</option>;
          })}
        </select>
      </div>


      {loading && (
        <div className="space-y-6 animate-pulse">
          <div className="h-64 bg-gray-800 rounded-lg"></div>
          <div className="h-64 bg-gray-800 rounded-lg"></div>
        </div>
      )}

      {error && <div className="text-red-500 bg-red-900/20 p-4 rounded">{error}</div>}

      {!loading && !error && depthData && (
        <div>
          {renderTable('Offense', grouped['Offense'])}
          {renderTable('Defense', grouped['Defense'])}
          {renderTable('Special Teams', grouped['Special Teams'])}
          {renderTable('Other', grouped['Other'])}
          
          {Object.values(grouped).every(g => g.length === 0) && (
            <div className="text-center text-gray-400 py-12 bg-gray-800 rounded-lg">
              No depth chart data available for this team.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
