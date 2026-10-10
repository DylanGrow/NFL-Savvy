// ESPN API wrapper with 5-minute in-memory cache
// No unused imports — types used only in JSDoc/comments

const CACHE = new Map<string, { data: unknown; timestamp: number }>();
const TTL = 5 * 60 * 1000; // 5 minutes

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';
const ESPN_COMMON = 'https://site.api.espn.com/apis/common/v3/sports/football/nfl';
const ESPN_V2 = 'https://site.api.espn.com/apis/v2/sports/football/nfl';

async function fetchWithCache<T>(url: string): Promise<T> {
  const cached = CACHE.get(url);
  if (cached && Date.now() - cached.timestamp < TTL) {
    return cached.data as T;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  const data = await res.json();
  CACHE.set(url, { data, timestamp: Date.now() });
  return data as T;
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
    fetchWithCache<any>(`${ESPN_V2}/standings?season=2025`),

  fetchPlayerStats: (playerId: string) =>
    fetchWithCache<any>(`${ESPN_COMMON}/athletes/${playerId}/stats`),

  fetchPlayerBio: (playerId: string) =>
    fetchWithCache<any>(`${ESPN_COMMON}/athletes/${playerId}`),

  fetchDepthChart: (teamId: string) =>
    fetchWithCache<any>(`${ESPN_BASE}/teams/${teamId}/depthchart`),

  fetchInjuries: (teamId: string) =>
    fetchWithCache<any>(`${ESPN_BASE}/teams/${teamId}/injuries`),

  fetchLeagueLeaders: (stat: string) =>
    fetchWithCache<any>(`${ESPN_BASE}/leaders?stat=${stat}&limit=20`),

  fetchGamePlayByPlay: (gameId: string) =>
    fetchWithCache<any>(`${ESPN_BASE}/playbyplay?event=${gameId}`),

  clearCache: () => CACHE.clear(),
};
