import type { Team, Stadium, RefereeCrew } from '../types';

const JSON_CACHE = new Map<string, any>();

/**
 * Universal local JSON fetcher that works across all environments:
 * - Local dev (http://localhost:5173/)
 * - Local preview (http://localhost:4173/ or http://localhost:4173/keen-maxwell/)
 * - GitHub Pages (https://<user>.github.io/keen-maxwell/)
 */
export async function fetchLocalJson<T>(relativePath: string): Promise<T> {
  const clean = relativePath.replace(/^\//, '').replace(/^(NFL-Savvy|keen-maxwell)\//, '');
  
  if (JSON_CACHE.has(clean)) {
    return JSON_CACHE.get(clean) as T;
  }

  const base = import.meta.env.BASE_URL || './';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;

  const candidateUrls = [
    `${normalizedBase}${clean}`,
    `./${clean}`,
    `/${clean}`,
    `/NFL-Savvy/${clean}`,
    `/keen-maxwell/${clean}`
  ];

  // Try unique candidate URLs in order
  const uniqueUrls = Array.from(new Set(candidateUrls));
  let lastError: Error | null = null;

  for (const url of uniqueUrls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        JSON_CACHE.set(clean, data);
        return data as T;
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error(`Failed to load ${clean} from any URL candidates`);
}

export function fetchTeamsData(): Promise<Team[]> {
  return fetchLocalJson<Team[]>('data/teams.json');
}

export function fetchStadiumsData(): Promise<Stadium[]> {
  return fetchLocalJson<Stadium[]>('data/stadiums.json');
}

export function fetchRefereesData(): Promise<RefereeCrew[]> {
  return fetchLocalJson<RefereeCrew[]>('data/referees.json');
}

export function fetchCoachesData(): Promise<any[]> {
  return fetchLocalJson<any[]>('data/coaches.json');
}

export function fetchStandingsData(): Promise<any> {
  return fetchLocalJson<any>('data/standings.json');
}
