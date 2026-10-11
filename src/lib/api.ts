// ESPN API wrapper with 5-minute cache + persistent localStorage offline fallback + timeout

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

  fetchDepthChart: async (teamId: string) => {
    try {
      const res = await fetchWithCache<any>(`${ESPN_BASE}/teams/${teamId}/depthchart`);
      if (res && res.items && res.items.length > 0) return res;
    } catch {}

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
      const items = Object.keys(posMap).map(pos => ({
        position: { abbreviation: pos, name: pos },
        athletes: posMap[pos].map((athlete, idx) => ({ rank: idx + 1, athlete }))
      }));
      return { items };
    } catch {
      return { items: [] };
    }
  },

  fetchInjuries: (teamId: string) =>
    fetchWithCache<any>(`${ESPN_BASE}/teams/${teamId}/injuries`),

  fetchStatistics: () =>
    fetchWithCache<any>(`${ESPN_BASE}/statistics`),

  fetchLeagueLeaders: async (stat = 'passing') => {
    try {
      const data = await fetchWithCache<any>(`${ESPN_BASE}/statistics`);
      const cats = data?.stats?.categories || [];
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
      return (category.leaders || []).map((l: any) => ({
        name: l.athlete?.displayName || l.athlete?.fullName || 'Athlete',
        headshot: l.athlete?.headshot?.href || l.athlete?.headshot,
        team: l.team?.abbreviation || l.team?.displayName || '',
        statLine: `${l.displayValue || l.value} ${category.displayName || ''}`.trim(),
        value: l.value || 0,
        athleteId: l.athlete?.id,
      }));
    } catch {
      return [];
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
