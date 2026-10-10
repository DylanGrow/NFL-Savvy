/**
 * NFL Data Backup APIs & Fallback Adapters
 * 
 * Provides 4 reliable alternatives to ESPN's public API:
 * 1. Sleeper API (Free, No Key, High Rate Limit, CORS-friendly)
 * 2. nflverse / nflfastR (Free, Open Source MIT, GitHub Releases CDN)
 * 3. CBS Sports Mobile API (Free, Public endpoints, Real-time scoreboards)
 * 4. Tank01 NFL API (RapidAPI / Freemium, Boxscores & Odds)
 */

export interface BackupApiInfo {
  name: string;
  provider: string;
  authRequired: boolean;
  rateLimit: string;
  bestFor: string;
  baseUrl: string;
  endpoints: {
    name: string;
    path: string;
    description: string;
  }[];
}

export const BACKUP_APIS: BackupApiInfo[] = [
  {
    name: 'Sleeper API',
    provider: 'Sleeper App Inc.',
    authRequired: false,
    rateLimit: '1,000 req / minute (Very generous, CORS open)',
    bestFor: 'Player database, injury designations, trending adds/drops, weekly stats & depth positions',
    baseUrl: 'https://api.sleeper.app/v1',
    endpoints: [
      {
        name: 'NFL State',
        path: '/state/nfl',
        description: 'Current season, active week, season type (regular/postseason), display week'
      },
      {
        name: 'All NFL Players',
        path: '/players/nfl',
        description: 'Complete dictionary of active NFL players with ID, team, age, college, depth chart, injury status'
      },
      {
        name: 'Weekly Player Stats',
        path: '/stats/nfl/regular/{season}/{week}',
        description: 'Deep passing, rushing, receiving, kicking, and IDP defense statistics per player'
      },
      {
        name: 'Trending Players',
        path: '/players/nfl/trending/add?lookback_hours=24&limit=25',
        description: 'Most added/dropped players across the league in real time'
      }
    ]
  },
  {
    name: 'nflverse (nflfastR / nflreadr)',
    provider: 'Open Source Sports Analytics (nflverse)',
    authRequired: false,
    rateLimit: 'Unlimited (Hosted on GitHub Releases / AWS CDN)',
    bestFor: 'Official referee assignments, play-by-play, EPA, CPOE, OverTheCap contract data, deep savant stats',
    baseUrl: 'https://github.com/nflverse/nflverse-data/releases/download',
    endpoints: [
      {
        name: 'Officials & Referees',
        path: '/officials/officials.csv',
        description: 'Full historical and weekly referee crew assignments, penalty rates, and head referee records'
      },
      {
        name: 'Rosters & Depth',
        path: '/rosters/roster_2024.csv',
        description: 'Official 53-man and practice squad rosters with jersey numbers, colleges, status'
      },
      {
        name: 'Contracts & Salaries (OTC Mirror)',
        path: '/contracts/historical_contracts.csv',
        description: 'OverTheCap mirrored dataset with guarantees, AAV, cap hits, and contract length'
      },
      {
        name: 'Play-by-Play with Advanced Metrics',
        path: '/pbp/play_by_play_2024.parquet',
        description: 'Every play with EPA, CPOE, win probability, down, distance, personnel groupings'
      }
    ]
  },
  {
    name: 'CBS Sports Mobile API',
    provider: 'CBS Interactive',
    authRequired: false,
    rateLimit: 'Public mobile app API, fast responses',
    bestFor: 'Live scoreboards on game day, down & distance, red zone flags, live game clocks',
    baseUrl: 'https://www.cbssports.com/api/mobile/v1/football/nfl',
    endpoints: [
      {
        name: 'Live Scoreboard',
        path: '/scoreboard',
        description: 'Real-time scores, quarter clocks, possession, down & distance, red-zone indicators'
      },
      {
        name: 'Team Schedules',
        path: '/teams/{teamId}/schedule',
        description: 'Complete 18-week schedule with network broadcast info and venue'
      },
      {
        name: 'Injury Wire',
        path: '/injuries',
        description: 'Full league injury reports with practice status and game designation'
      }
    ]
  },
  {
    name: 'Tank01 NFL API / SportsDataIO',
    provider: 'Tank01 (RapidAPI) / SportsDataIO',
    authRequired: true,
    rateLimit: 'Freemium (500 to 1,000 free calls/month)',
    bestFor: 'Vegas lines/spreads, referee assignments, red zone efficiency, real-time boxscores',
    baseUrl: 'https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com',
    endpoints: [
      {
        name: 'Game Info & Referees',
        path: '/getNFLGameInfo?gameID={id}',
        description: 'Full game metadata including stadium, weather, betting spread, and referee crew'
      },
      {
        name: 'Betting Odds & Lines',
        path: '/getNFLBettingOdds?gameDate={date}',
        description: 'Over/Under, spreads, and moneyline consensus from major sportsbooks'
      },
      {
        name: 'Player Depth Charts',
        path: '/getNFLDepthCharts?teamAbbr={abbr}',
        description: 'Up-to-the-minute 1st, 2nd, and 3rd string depth charts'
      }
    ]
  }
];

// ============================================================
// Concrete Backup Clients / Fallbacks
// ============================================================

/**
 * 1. Sleeper Client (Direct browser fetch, no API key required)
 */
export const sleeperApi = {
  /** Fetch current NFL state (season year, current week, season type) */
  fetchState: async () => {
    const res = await fetch('https://api.sleeper.app/v1/state/nfl');
    if (!res.ok) throw new Error(`Sleeper API HTTP ${res.status}`);
    return res.json();
  },

  /** Fetch trending added players in the last 24h */
  fetchTrendingAdds: async (limit = 10) => {
    const res = await fetch(`https://api.sleeper.app/v1/players/nfl/trending/add?lookback_hours=24&limit=${limit}`);
    if (!res.ok) throw new Error(`Sleeper API HTTP ${res.status}`);
    return res.json();
  },

  /** Fetch trending dropped players in the last 24h */
  fetchTrendingDrops: async (limit = 10) => {
    const res = await fetch(`https://api.sleeper.app/v1/players/nfl/trending/drop?lookback_hours=24&limit=${limit}`);
    if (!res.ok) throw new Error(`Sleeper API HTTP ${res.status}`);
    return res.json();
  }
};

/**
 * 2. CBS Sports Public Scoreboard Fallback
 */
export const cbsApi = {
  fetchScoreboard: async () => {
    const res = await fetch('https://www.cbssports.com/api/mobile/v1/football/nfl/scoreboard');
    if (!res.ok) throw new Error(`CBS Sports HTTP ${res.status}`);
    return res.json();
  }
};

/**
 * Multi-provider Fallback Engine:
 * Executes a primary API fetch, and automatically cascades to backup providers
 * if the primary fails (network down, rate limited, CORS blocked).
 */
export async function fetchWithFallback<T>(
  primary: () => Promise<T>,
  fallbacks: (() => Promise<T>)[]
): Promise<T> {
  try {
    return await primary();
  } catch (primaryErr) {
    console.warn('Primary API failed, attempting backup provider...', primaryErr);
    for (let i = 0; i < fallbacks.length; i++) {
      try {
        const backupResult = await fallbacks[i]();
        console.info(`Backup provider #${i + 1} succeeded!`);
        return backupResult;
      } catch (err) {
        console.warn(`Backup provider #${i + 1} failed:`, err);
      }
    }
    throw primaryErr;
  }
}
