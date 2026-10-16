import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchCoachesData } from '../lib/data';
import type { Coach } from '../types';

const SCHEME_FILTERS = [
  { id: 'ALL', label: 'All Schemes' },
  { id: 'WIDE_ZONE', label: '🏈 Wide Zone / Shanahan Tree', match: ['wide zone', 'outside zone', 'shanahan', 'mcvay'] },
  { id: 'SPREAD_AIR_RAID', label: '🏈 Spread & Air Raid', match: ['spread', 'air raid', 'shotgun spread', 'rpo'] },
  { id: 'POWER_GAP', label: '🏈 Power Gap & Multi-TE', match: ['power gap', 'counter', 'duo', 'multi-te', '12 personnel', '13 heavy'] },
  { id: 'WEST_COAST', label: '🏈 West Coast Timing', match: ['west coast', 'timing', 'erhardt-perkins'] },
  { id: 'FANGIO_QUARTERS', label: '🛡️ Fangio 2-High & Quarters', match: ['fangio', 'quarters', 'cover 6', 'split-field', '2-high'] },
  { id: 'COVER_3', label: '🛡️ Seattle Cover 3 / 4-3 Under', match: ['cover 3', 'seattle', '4-3 under', 'single-high'] },
  { id: 'BLITZ_AMOEBA', label: '🛡️ Amoeba & Heavy Blitz', match: ['amoeba', 'blitz', 'cover 0', 'fire zone', 'creeper', 'spagnuolo', 'flores', 'bowles'] },
  { id: 'WIDE_9', label: '🛡️ Wide-9 Front Rush', match: ['wide-9', 'schwartz', 'penetration', 'single-gap'] },
];

export default function Coaches() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [schemeFilter, setSchemeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCoachId, setExpandedCoachId] = useState<string | null>(null);

  useEffect(() => {
    document.title = '2026 Coaches & Schemes | NFL Savvy';
    fetchCoachesData()
      .then(data => {
        setCoaches(data || []);
      })
      .catch(err => {
        console.error('Failed to load coaches data:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const roles = ['ALL', 'Head Coach', 'Offensive Coordinator', 'Defensive Coordinator'];

  const filtered = useMemo(() => {
    return coaches.filter(c => {
      // 1. Role filter
      if (roleFilter !== 'ALL') {
        const roleLower = (c.role || '').toLowerCase();
        const fLower = roleFilter.toLowerCase();
        if (fLower === 'head coach' && !roleLower.includes('head')) return false;
        if (fLower === 'offensive coordinator' && !roleLower.includes('offensive') && !roleLower.includes('run game') && !roleLower.includes('pass game')) return false;
        if (fLower === 'defensive coordinator' && !roleLower.includes('defensive')) return false;
      }

      // 2. Scheme Filter
      if (schemeFilter !== 'ALL') {
        const activeFilterObj = SCHEME_FILTERS.find(s => s.id === schemeFilter);
        if (activeFilterObj?.match) {
          const combinedSchemeText = [
            c.offensiveScheme || '',
            c.defensiveScheme || '',
            c.philosophy || '',
            c.baseFront || '',
            c.tree || '',
            ...(c.schemeTags || []),
          ].join(' ').toLowerCase();

          const hasMatch = activeFilterObj.match.some(m => combinedSchemeText.includes(m.toLowerCase()));
          if (!hasMatch) return false;
        }
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
        const teamMatch = (c.teamName || '').toLowerCase().includes(q) || (c.teamAbbr || '').toLowerCase().includes(q);
        const roleMatch = (c.role || '').toLowerCase().includes(q);
        const treeMatch = (c.tree || '').toLowerCase().includes(q);
        const offSchemeMatch = (c.offensiveScheme || '').toLowerCase().includes(q);
        const defSchemeMatch = (c.defensiveScheme || '').toLowerCase().includes(q);
        const philMatch = (c.philosophy || '').toLowerCase().includes(q);
        const tagMatch = (c.schemeTags || []).some(t => t.toLowerCase().includes(q));

        if (
          !fullName.includes(q) &&
          !teamMatch &&
          !roleMatch &&
          !treeMatch &&
          !offSchemeMatch &&
          !defSchemeMatch &&
          !philMatch &&
          !tagMatch
        ) {
          return false;
        }
      }

      return true;
    });
  }, [coaches, roleFilter, schemeFilter, searchQuery]);

  const schemeStats = useMemo(() => {
    const wideZoneCount = coaches.filter(c => (c.offensiveScheme || '').toLowerCase().includes('zone')).length;
    const fangioCount = coaches.filter(c => (c.defensiveScheme || '').toLowerCase().includes('fangio') || (c.coverageTendency || '').toLowerCase().includes('quarters')).length;
    const blitzCount = coaches.filter(c => (c.defensiveScheme || '').toLowerCase().includes('blitz') || (c.defensiveScheme || '').toLowerCase().includes('amoeba')).length;
    const playcallersCount = coaches.filter(c => (c.playCalling || '').toLowerCase().includes('playcaller')).length;
    return { wideZoneCount, fangioCount, blitzCount, playcallersCount };
  }, [coaches]);

  const getRoleBadgeColor = (role: string) => {
    const r = (role || '').toLowerCase();
    if (r.includes('head')) return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40';
    if (r.includes('offensive') || r.includes('run game') || r.includes('pass game')) {
      return 'bg-blue-500/15 text-blue-300 border-blue-500/40';
    }
    if (r.includes('defensive')) return 'bg-red-500/15 text-red-300 border-red-500/40';
    return 'bg-gray-800 text-gray-300 border-gray-700';
  };

  return (
    <div className="app-container py-4 sm:py-8 text-white font-sans space-y-6 sm:space-y-8">
      {/* ── Page Header & Search ────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 p-4 sm:p-6 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl sm:text-3xl" aria-hidden="true">📋</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              2026 NFL Coaching & Scheme Hub
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
            Detailed breakdown of what kind of offense and defense every Head Coach, OC, and DC runs across all 32 NFL franchises, including playcalling duties, coaching trees, and personnel tendencies.
          </p>
        </div>

        {/* Search input with scheme autocomplete hint */}
        <div className="w-full lg:w-80">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search coach, scheme (e.g. Wide Zone, Fangio, Air Raid)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Scheme Intelligence KPI Bar ─────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gray-900/90 border border-gray-800 p-3 sm:p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Coaches</div>
            <div className="text-xl sm:text-2xl font-black font-mono text-white mt-0.5">
              {loading ? '--' : coaches.length}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">32 HC • 32 OC • 32 DC</div>
          </div>
          <span className="text-2xl opacity-80">🏈</span>
        </div>

        <div className="bg-gray-900/90 border border-gray-800 p-3 sm:p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs text-blue-400 font-semibold uppercase tracking-wider">Wide Zone Leaders</div>
            <div className="text-xl sm:text-2xl font-black font-mono text-blue-300 mt-0.5">
              {loading ? '--' : schemeStats.wideZoneCount}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">Shanahan & McVay Offenses</div>
          </div>
          <span className="text-2xl opacity-80">🏃</span>
        </div>

        <div className="bg-gray-900/90 border border-gray-800 p-3 sm:p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs text-red-400 font-semibold uppercase tracking-wider">2-High Quarters</div>
            <div className="text-xl sm:text-2xl font-black font-mono text-red-300 mt-0.5">
              {loading ? '--' : schemeStats.fangioCount}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">Vic Fangio Match Tree</div>
          </div>
          <span className="text-2xl opacity-80">🛡️</span>
        </div>

        <div className="bg-gray-900/90 border border-gray-800 p-3 sm:p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs text-purple-400 font-semibold uppercase tracking-wider">Heavy Blitz Fronts</div>
            <div className="text-xl sm:text-2xl font-black font-mono text-purple-300 mt-0.5">
              {loading ? '--' : schemeStats.blitzCount}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">Flores • Spags • Bowles</div>
          </div>
          <span className="text-2xl opacity-80">⚡</span>
        </div>
      </div>

      {/* ── Filters Section ─────────────────────────────────── */}
      <div className="space-y-3 bg-gray-900/60 border border-gray-800 p-3 sm:p-4 rounded-2xl">
        {/* Role Filters */}
        <div className="flex items-center gap-2 overflow-x-auto touch-scroll pb-1 scrollbar-none">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 shrink-0 mr-1">
            Role:
          </span>
          {roles.map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap min-h-[36px] ${
                roleFilter === r
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-900 text-gray-300 hover:bg-gray-800 border border-gray-800'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Scheme Concept Filters */}
        <div className="flex items-center gap-2 overflow-x-auto touch-scroll pb-1 scrollbar-none pt-1 border-t border-gray-800/80">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 shrink-0 mr-1">
            Scheme:
          </span>
          {SCHEME_FILTERS.map(sf => (
            <button
              key={sf.id}
              onClick={() => setSchemeFilter(sf.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap min-h-[34px] ${
                schemeFilter === sf.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-900/90 text-gray-300 hover:bg-gray-800 border border-gray-800'
              }`}
            >
              {sf.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Coach Cards Grid ─────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-2xl p-5 h-72 animate-pulse border border-gray-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filtered.map((c, i) => {
            const isHeadCoach = (c.role || '').toLowerCase().includes('head');
            const isOffensive = (c.role || '').toLowerCase().includes('offensive') || (c.role || '').toLowerCase().includes('run game') || (c.role || '').toLowerCase().includes('pass game');
            const isDefensive = (c.role || '').toLowerCase().includes('defensive');
            const isExpanded = expandedCoachId === `${c.id}-${i}`;

            return (
              <div
                key={`${c.id}-${i}`}
                className="bg-gray-900 rounded-2xl p-5 border border-gray-800 hover:border-gray-700 transition flex flex-col justify-between shadow-md hover:shadow-xl relative group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/teams/${c.teamId || c.teamAbbr}`}
                          className="font-extrabold text-base sm:text-lg text-white hover:text-blue-400 transition truncate"
                        >
                          {c.firstName} {c.lastName}
                        </Link>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap mt-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeColor(c.role)}`}>
                          {c.role}
                        </span>

                        {c.playCalling && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-indigo-950/70 text-indigo-300 border border-indigo-500/30">
                            <span aria-hidden="true">🎙️</span>
                            <span className="truncate max-w-[140px]">{c.playCalling}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {c.teamAbbr && (
                      <Link
                        to={`/teams/${c.teamId || c.teamAbbr}`}
                        title={`View ${c.teamName}`}
                        className="p-1 rounded-lg hover:bg-gray-800 transition shrink-0"
                      >
                        <img
                          src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/${c.teamAbbr.toLowerCase()}.png&w=48&h=48`}
                          alt={c.teamAbbr}
                          className="w-10 h-10 object-contain drop-shadow"
                          loading="lazy"
                        />
                      </Link>
                    )}
                  </div>

                  {/* Coaching Tree Lineage */}
                  {c.tree && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-950/30 px-2.5 py-1 rounded-lg border border-emerald-800/40">
                      <span aria-hidden="true">🌳</span>
                      <span className="truncate">{c.tree}</span>
                    </div>
                  )}

                  {/* ── Scheme Breakdown Boxes ──────────────────────── */}
                  <div className="mt-3.5 space-y-2.5">
                    {/* Offensive Scheme Box */}
                    {(c.offensiveScheme || isHeadCoach || isOffensive) && c.offensiveScheme && (
                      <div className="bg-blue-950/25 border border-blue-900/50 rounded-xl p-3">
                        <div className="flex items-center justify-between text-xs font-bold text-blue-300 mb-1">
                          <span className="flex items-center gap-1.5">
                            <span>🏈</span>
                            <span>Offensive Scheme</span>
                          </span>
                          {c.passRunTendency && (
                            <span className="text-[10px] text-gray-400 font-mono font-medium">
                              {c.passRunTendency.split('(')[0].trim()}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-100 font-medium leading-relaxed">
                          {c.offensiveScheme}
                        </p>

                        {c.personnelPreference && (
                          <div className="mt-1.5 text-[11px] text-gray-400 flex items-center gap-1 flex-wrap">
                            <span className="text-gray-500 font-semibold">Personnel:</span>
                            <span className="text-gray-300">{c.personnelPreference}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Defensive Scheme Box */}
                    {(c.defensiveScheme || isHeadCoach || isDefensive) && c.defensiveScheme && (
                      <div className="bg-red-950/25 border border-red-900/50 rounded-xl p-3">
                        <div className="flex items-center justify-between text-xs font-bold text-red-300 mb-1">
                          <span className="flex items-center gap-1.5">
                            <span>🛡️</span>
                            <span>Defensive Scheme</span>
                          </span>
                          {c.baseFront && (
                            <span className="text-[10px] text-gray-400 font-mono font-medium">
                              {c.baseFront}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-100 font-medium leading-relaxed">
                          {c.defensiveScheme}
                        </p>

                        {c.coverageTendency && (
                          <div className="mt-1.5 text-[11px] text-gray-400 flex items-center gap-1 flex-wrap">
                            <span className="text-gray-500 font-semibold">Coverage:</span>
                            <span className="text-gray-300">{c.coverageTendency}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tactical Philosophy Statement */}
                    {c.philosophy && (
                      <div className="bg-gray-950/70 p-3 rounded-xl border border-gray-800 text-xs text-gray-300 leading-relaxed italic">
                        "{c.philosophy}"
                      </div>
                    )}

                    {/* Scheme Tags */}
                    {c.schemeTags && c.schemeTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {c.schemeTags.map((tag, tIdx) => (
                          <button
                            key={tIdx}
                            onClick={() => setSearchQuery(tag)}
                            className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-gray-800/80 hover:bg-gray-700 text-gray-300 border border-gray-700/60 transition"
                            title={`Filter by #${tag}`}
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="mt-4 pt-3.5 border-t border-gray-800/80 flex justify-between items-center text-xs text-gray-400">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/teams/${c.teamId || c.teamAbbr}`}
                      className="font-medium text-gray-300 hover:text-white transition truncate max-w-[160px]"
                    >
                      {c.teamName}
                    </Link>
                    {isHeadCoach && c.record && (
                      <span className="text-gray-500 font-mono">
                        ({c.record})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {c.experience !== undefined && c.experience > 0 && (
                      <span className="text-gray-500 text-[11px]">
                        {c.experience} yr{c.experience !== 1 ? 's' : ''} exp
                      </span>
                    )}
                    <Link
                      to={`/teams/${c.teamId || c.teamAbbr}`}
                      className="text-xs text-blue-400 hover:text-blue-300 font-semibold ml-1"
                    >
                      Team &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center col-span-full space-y-3">
              <div className="text-3xl">🔍</div>
              <h3 className="text-lg font-bold text-gray-200">No coaches match your search criteria</h3>
              <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto">
                Try searching for scheme names like "Wide Zone", "Air Raid", "Fangio", "Cover 3", or clearing your filters.
              </p>
              <button
                onClick={() => {
                  setRoleFilter('ALL');
                  setSchemeFilter('ALL');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
