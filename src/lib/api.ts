// ESPN API wrapper with 5-minute cache + persistent localStorage offline fallback + timeout
import type { TeamDepthChart, DepthChartGroup, DepthChartPosition, DepthChartAthlete } from '../types';

const CACHE = new Map<string, { data: unknown; timestamp: number }>();
const TTL = 5 * 60 * 1000; // 5 minutes

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';
const ESPN_COMMON = 'https://site.api.espn.com/apis/common/v3/sports/football/nfl';
const ESPN_V2 = 'https://site.api.espn.com/apis/v2/sports/football/nfl';

function getPersistentCache<T>(key: string): { data: T; isExpired: boolean } | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = localStorage.getItem('nfl_api_' + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const isExpired = Date.now() - parsed.timestamp > TTL;
    return { data: parsed.data as T, isExpired };
  } catch {
    return null;
  }
}

function setPersistentCache(key: string, data: unknown) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.setItem('nfl_api_' + key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {}
}

async function fetchWithCache<T>(url: string, timeoutMs = 8000): Promise<T> {
  const inMem = CACHE.get(url);
  if (inMem && Date.now() - inMem.timestamp < TTL) {
    return inMem.data as T;
  }

  const persistent = getPersistentCache<T>(url);
  if (persistent && !persistent.isExpired) {
    CACHE.set(url, { data: persistent.data, timestamp: Date.now() });
    return persistent.data;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    const data = await res.json();
    CACHE.set(url, { data, timestamp: Date.now() });
    setPersistentCache(url, data);
    return data as T;
  } catch (err) {
    clearTimeout(timer);
    // Return stale persistent or in-memory cache on network error or timeout
    if (persistent?.data) {
      return persistent.data;
    }
    if (inMem?.data) {
      return inMem.data as T;
    }
    throw err;
  }
}

export const api = {
  fetchTeams: () =>
    fetchWithCache<any>(`${ESPN_BASE}/teams?limit=32`),

  fetchTeam: (id: string) =>
    fetchWithCache<any>(`${ESPN_BASE}/teams/${id}`),

  fetchRoster: (teamId: string) =>
    fetchWithCache<any>(`${ESPN_BASE}/teams/${teamId}/roster?limit=100`),

  fetchCoaches: (teamId: string) =>
    fetchWithCache<any>(`${ESPN_BASE}/teams/${teamId}`),

  fetchSchedule: (seasonType = 2, week?: number) =>
    fetchWithCache<any>(
      `${ESPN_BASE}/scoreboard?seasontype=${seasonType}${week ? `&week=${week}` : ''}&limit=16`
    ),

  fetchGame: (gameId: string) =>
    fetchWithCache<any>(`${ESPN_BASE}/summary?event=${gameId}`),

  fetchScoreboard: () =>
    fetchWithCache<any>(`${ESPN_BASE}/scoreboard`),

  fetchStandings: () =>
    fetchWithCache<any>(`${ESPN_V2}/standings?season=2026`),

  fetchPlayerStats: (playerId: string) =>
    fetchWithCache<any>(`${ESPN_COMMON}/athletes/${playerId}/stats`),

  fetchPlayerBio: (playerId: string) =>
    fetchWithCache<any>(`${ESPN_COMMON}/athletes/${playerId}`),

  fetchDepthChart: async (teamId: string): Promise<TeamDepthChart> => {
    try {
      const res = await fetchWithCache<any>(`${ESPN_BASE}/teams/${teamId}/depthcharts`);
      if (res && res.depthchart) {
        // Fetch roster in background or cache for jersey numbers and headshot fallbacks
        let rosterMap: Record<string, any> = {};
        try {
          const rosterRes = await fetchWithCache<any>(`${ESPN_BASE}/teams/${teamId}/roster?limit=100`);
          if (rosterRes?.athletes) {
            rosterRes.athletes.forEach((grp: any) => {
              (grp.items || []).forEach((p: any) => {
                if (p.id) rosterMap[String(p.id)] = p;
              });
            });
          }
        } catch {}

        const OFFENSE_KEYS = ['qb', 'rb', 'fb', 'wr1', 'wr2', 'wr3', 'wr', 'te', 'lt', 'lg', 'c', 'rg', 'rt'];
        const DEFENSE_KEYS = ['lde', 'nt', 'ldt', 'rdt', 'rde', 'wlb', 'mlb', 'lilb', 'rilb', 'slb', 'lcb', 'rcb', 'nb', 'ss', 'fs'];
        const SPECIAL_KEYS = ['pk', 'p', 'h', 'ls', 'pr', 'kr'];

        const getOrderIndex = (key: string, list: string[]) => {
          const idx = list.indexOf((key || '').toLowerCase());
          return idx === -1 ? 999 : idx;
        };

        const POSITION_DISPLAY_MAP: Record<string, { abbr: string; name: string }> = {
          qb: { abbr: 'QB', name: 'Quarterback' },
          rb: { abbr: 'RB', name: 'Running Back' },
          fb: { abbr: 'FB', name: 'Fullback' },
          wr1: { abbr: 'WR1', name: 'Wide Receiver 1' },
          wr2: { abbr: 'WR2', name: 'Wide Receiver 2' },
          wr3: { abbr: 'WR3', name: 'Wide Receiver 3' },
          wr: { abbr: 'WR', name: 'Wide Receiver' },
          te: { abbr: 'TE', name: 'Tight End' },
          lt: { abbr: 'LT', name: 'Left Tackle' },
          lg: { abbr: 'LG', name: 'Left Guard' },
          c: { abbr: 'C', name: 'Center' },
          rg: { abbr: 'RG', name: 'Right Guard' },
          rt: { abbr: 'RT', name: 'Right Tackle' },
          lde: { abbr: 'LDE', name: 'Left Defensive End' },
          nt: { abbr: 'NT', name: 'Nose Tackle' },
          ldt: { abbr: 'LDT', name: 'Left Defensive Tackle' },
          rdt: { abbr: 'RDT', name: 'Right Defensive Tackle' },
          rde: { abbr: 'RDE', name: 'Right Defensive End' },
          wlb: { abbr: 'WLB', name: 'Weakside Linebacker' },
          mlb: { abbr: 'MLB', name: 'Middle Linebacker' },
          lilb: { abbr: 'LILB', name: 'Left Inside Linebacker' },
          rilb: { abbr: 'RILB', name: 'Right Inside Linebacker' },
          slb: { abbr: 'SLB', name: 'Strongside Linebacker' },
          lcb: { abbr: 'LCB', name: 'Left Cornerback' },
          rcb: { abbr: 'RCB', name: 'Right Cornerback' },
          nb: { abbr: 'NB', name: 'Nickelback' },
          ss: { abbr: 'SS', name: 'Strong Safety' },
          fs: { abbr: 'FS', name: 'Free Safety' },
          pk: { abbr: 'PK', name: 'Place Kicker' },
          p: { abbr: 'P', name: 'Punter' },
          h: { abbr: 'H', name: 'Holder' },
          ls: { abbr: 'LS', name: 'Long Snapper' },
          pr: { abbr: 'PR', name: 'Punt Returner' },
          kr: { abbr: 'KR', name: 'Kick Returner' },
        };

        const rawGroups = Object.values(res.depthchart) as any[];
        const parsedGroups: DepthChartGroup[] = [];

        for (const grp of rawGroups) {
          const gName = (grp.name || '').trim();
          let category: 'Offense' | 'Defense' | 'Special Teams' | 'Other' = 'Other';
          if (grp.id === '21' || gName.toLowerCase().includes('offense') || gName.includes('WR') || gName.includes('TE')) {
            category = 'Offense';
          } else if (grp.id === '15' || grp.id === '16' || gName.toLowerCase().includes('defense') || gName.endsWith(' D')) {
            category = 'Defense';
          } else if (grp.id === '18' || gName.toLowerCase().includes('special')) {
            category = 'Special Teams';
          }

          const orderList = category === 'Offense' ? OFFENSE_KEYS : category === 'Defense' ? DEFENSE_KEYS : SPECIAL_KEYS;

          const sortedPosKeys = Object.keys(grp.positions || {}).sort(
            (a, b) => getOrderIndex(a, orderList) - getOrderIndex(b, orderList)
          );

          const positions: DepthChartPosition[] = [];

          for (const posKey of sortedPosKeys) {
            const posData = grp.positions[posKey];
            const meta = POSITION_DISPLAY_MAP[posKey.toLowerCase()];
            const posObj = {
              id: posData?.position?.id || posKey,
              name: meta?.name || posData?.position?.name || posKey.toUpperCase(),
              displayName: meta?.name || posData?.position?.displayName || posKey.toUpperCase(),
              abbreviation: meta?.abbr || posData?.position?.abbreviation || posKey.toUpperCase(),
              parent: posData?.position?.parent,
            };

            const athletes: DepthChartAthlete[] = (posData?.athletes || []).map((a: any, idx: number) => {
              const matched = rosterMap[String(a.id)];
              const athleteObj: DepthChartAthlete = {
                id: String(a.id),
                displayName: a.displayName || matched?.displayName || 'Unknown Player',
                shortName: a.shortName || matched?.shortName || a.displayName,
                jersey: matched?.jersey || a.jersey || (matched?.jerseyNumber ? String(matched.jerseyNumber) : undefined),
                headshot: matched?.headshot?.href
                  ? matched.headshot
                  : { href: `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${a.id}.png&w=96&h=70` },
                injuries: a.injuries && a.injuries.length > 0 ? a.injuries : matched?.injuries || [],
                rank: idx + 1,
                slot: a.slot || idx + 1,
              };
              athleteObj.athlete = athleteObj; // backward-compatibility
              return athleteObj;
            });

            positions.push({
              key: posKey,
              position: posObj,
              athletes,
            });
          }

          parsedGroups.push({
            id: grp.id,
            name: grp.name,
            category,
            positions,
          });
        }

        // Order groups: Offense -> Defense -> Special Teams -> Other
        const GROUP_ORDER = ['Offense', 'Defense', 'Special Teams', 'Other'];
        parsedGroups.sort((a, b) => GROUP_ORDER.indexOf(a.category) - GROUP_ORDER.indexOf(b.category));

        return {
          team: res.team,
          season: res.season,
          groups: parsedGroups,
          items: parsedGroups.flatMap(g => g.positions),
        };
      }
    } catch (err) {
      console.warn('Official ESPN depthcharts failed, falling back:', err);
    }

    // Fallback: roster-based
    try {
      const roster = await fetchWithCache<any>(`${ESPN_BASE}/teams/${teamId}/roster?limit=100`);
      const posMap: Record<string, any[]> = {};
      (roster.athletes || []).forEach((grp: any) => {
        (grp.items || []).forEach((p: any) => {
          const pos = p.position?.abbreviation || 'UNK';
          if (!posMap[pos]) posMap[pos] = [];
          posMap[pos].push(p);
        });
      });
      const items: DepthChartPosition[] = Object.keys(posMap).map(pos => ({
        key: pos.toLowerCase(),
        position: { abbreviation: pos, name: pos, displayName: pos },
        athletes: posMap[pos].map((athlete, idx) => {
          const aObj: DepthChartAthlete = {
            id: String(athlete.id),
            displayName: athlete.displayName,
            jersey: athlete.jersey,
            headshot: athlete.headshot?.href
              ? athlete.headshot
              : { href: `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${athlete.id}.png&w=96&h=70` },
            injuries: athlete.injuries || [],
            rank: idx + 1,
          };
          aObj.athlete = aObj;
          return aObj;
        }),
      }));
      return { groups: [{ id: '0', name: 'Roster', category: 'Other', positions: items }], items };
    } catch {
      return { groups: [], items: [] };
    }
  },

  fetchInjuries: (teamId: string) =>
    fetchWithCache<any>(`${ESPN_BASE}/teams/${teamId}/injuries`),

  fetchStatistics: () =>
    fetchWithCache<any>(`${ESPN_BASE}/statistics`),

  fetchLeagueLeaders: async (stat = 'passing') => {
    try {
      // Official ESPN 2026 Regular Season League Leaders API
      const data = await fetchWithCache<any>(
        'https://site.api.espn.com/apis/site/v3/sports/football/nfl/leaders?season=2026&seasontype=2'
      );
      const cats = data?.leaders?.categories || [];
      const statMap: Record<string, string> = {
        passing: 'passingYards',
        rushing: 'rushingYards',
        receiving: 'receivingYards',
        sacks: 'sacks',
        tackles: 'totalTackles',
        interceptions: 'interceptions',
      };
      const targetName = statMap[stat.toLowerCase()] || stat;
      const category = cats.find(
        (c: any) =>
          c.name?.toLowerCase() === targetName.toLowerCase() ||
          c.displayName?.toLowerCase().includes(stat.toLowerCase())
      );
      if (!category) return [];
      return (category.leaders || []).map((l: any) => {
        const rawVal = l.displayValue || l.value || '0';
        const numVal = Number(rawVal);
        const formattedVal = !isNaN(numVal) && numVal >= 1000 ? numVal.toLocaleString() : rawVal;
        const catLabel = category.displayName || '';
        return {
          name: l.athlete?.displayName || l.athlete?.fullName || 'Athlete',
          headshot:
            l.athlete?.headshot?.href ||
            l.athlete?.headshot ||
            (l.athlete?.id
              ? `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${l.athlete.id}.png&w=96&h=70`
              : undefined),
          team: l.team?.abbreviation || l.team?.displayName || '',
          statLine: `${formattedVal} ${catLabel}`.trim(),
          value: l.value || numVal || 0,
          athleteId: l.athlete?.id,
          position: l.athlete?.position?.abbreviation,
        };
      });
    } catch {
      return [];
    }
  },

  fetchAllLeagueLeaders: async () => {
    try {
      const data = await fetchWithCache<any>(
        'https://site.api.espn.com/apis/site/v3/sports/football/nfl/leaders?season=2026&seasontype=2'
      );
      const cats = data?.leaders?.categories || [];
      const result: Record<string, any[]> = {};
      const statMap: Record<string, string> = {
        passing: 'passingYards',
        rushing: 'rushingYards',
        receiving: 'receivingYards',
        sacks: 'sacks',
        tackles: 'totalTackles',
        interceptions: 'interceptions',
      };
      Object.entries(statMap).forEach(([key, targetName]) => {
        const category = cats.find((c: any) => c.name?.toLowerCase() === targetName.toLowerCase());
        if (category) {
          result[key] = (category.leaders || []).slice(0, 5).map((l: any) => {
            const rawVal = l.displayValue || l.value || '0';
            const numVal = Number(rawVal);
            const formattedVal = !isNaN(numVal) && numVal >= 1000 ? numVal.toLocaleString() : rawVal;
            const catLabel = category.displayName || '';
            return {
              name: l.athlete?.displayName || l.athlete?.fullName || 'Athlete',
              headshot:
                l.athlete?.headshot?.href ||
                l.athlete?.headshot ||
                (l.athlete?.id
                  ? `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${l.athlete.id}.png&w=96&h=70`
                  : undefined),
              team: l.team?.abbreviation || l.team?.displayName || '',
              statLine: `${formattedVal} ${catLabel}`.trim(),
              value: l.value || numVal || 0,
              athleteId: l.athlete?.id,
              position: l.athlete?.position?.abbreviation,
            };
          });
        }
      });
      return result;
    } catch {
      return {};
    }
  },

  fetchGamePlayByPlay: (gameId: string) =>
    fetchWithCache<any>(`${ESPN_BASE}/playbyplay?event=${gameId}`),

  clearCache: () => {
    CACHE.clear();
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        Object.keys(localStorage)
          .filter(k => k.startsWith('nfl_api_'))
          .forEach(k => localStorage.removeItem(k));
      }
    } catch {}
  },
};
