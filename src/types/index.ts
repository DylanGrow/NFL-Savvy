// ============================================================
// Core domain types for NFL Savvy 2026
// ============================================================

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  city: string;
  conference: 'AFC' | 'NFC';
  division: 'North' | 'South' | 'East' | 'West';
  primaryColor: string;
  secondaryColor: string;
  stadiumId: string;
  espnId?: string;
}

export interface Stadium {
  id: string;
  name: string;
  city: string;
  state: string;
  surface: string;
  capacity: number;
  isDome: boolean;
  isRetractable?: boolean;
  coordinates: { lat: number; lon: number };
  opened?: number;
}

export interface Player {
  id: string;
  fullName?: string;
  displayName?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  position: string;
  jersey?: string;
  jerseyNumber?: string;
  teamId?: string;
  age?: number;
  height?: string;
  weight?: string;
  college?: string;
  experience?: number;
  status?: string;
  injuryStatus?: string;
  injuryDesignation?: string;
  fantasyScore?: number;
}

export interface Coach {
  id: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  role: string;
  teamId?: string;
  record?: string;
  experience?: number;
  yearsExperience?: number;
}

export interface Salary {
  playerId: string;
  teamId: string;
  capHit: number;
  totalValue: number;
  guaranteedMoney: number;
  yearsRemaining: number;
  aav: number;
  signingBonus: number;
}

export interface PlayerStats {
  passing?: {
    completions: number;
    attempts: number;
    yards: number;
    touchdowns: number;
    interceptions: number;
    rating: number;
    sacks: number;
  };
  rushing?: {
    carries: number;
    yards: number;
    touchdowns: number;
    fumbles: number;
    yardsPerCarry: number;
  };
  receiving?: {
    targets: number;
    receptions: number;
    yards: number;
    touchdowns: number;
    drops: number;
    yardsPerReception: number;
  };
  defense?: {
    tackles: number;
    assistedTackles: number;
    sacks: number;
    interceptions: number;
    passBreakups: number;
    forcedFumbles: number;
    tacklesForLoss: number;
    qbHits: number;
  };
}

export interface Game {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  week: number;
  date: string;
  stadiumId: string;
  status: string;
  score?: {
    home: number;
    away: number;
  };
}

/** Weather data for a specific game — matches Open-Meteo response parsing in weather.ts */
export interface Weather {
  temp: number;
  feelsLike: number;
  windSpeed: number;
  windDirection: string;
  precipitation: number;
  condition: string;
  icon: string;
}

export interface InjuryReport {
  playerId: string;
  playerName?: string;
  week: number;
  designation: string;
  injury: string;
  practiceStatus: string;
}

export interface DepthChartEntry {
  teamId: string;
  position: string;
  depth: number;
  playerId: string;
  playerName?: string;
}

export type SearchResultType = 'player' | 'team' | 'coach' | 'game';

export interface SearchResult {
  type: SearchResultType;
  id: string;
  name: string;
  subtitle: string;
  url?: string;
}

// Badge variants available in the Badge component
export type BadgeVariant =
  | 'injury'
  | 'dome'
  | 'weather'
  | 'position'
  | 'highlight'
  | 'contract'
  | 'fantasy'
  | 'afc'
  | 'nfc'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'default';

export interface Official {
  id?: string;
  displayName: string;
  position: string;
  jerseyNumber?: string;
  order?: number;
}

export interface RefereeCrew {
  id: string;
  referee: string;
  jerseyNumber: string;
  experience: number;
  superBowls?: number[];
  umpire?: string;
  downJudge?: string;
  lineJudge?: string;
  fieldJudge?: string;
  sideJudge?: string;
  backJudge?: string;
  replayOfficial?: string;
  penaltyStats?: {
    avgPenaltiesPerGame: number;
    avgPenaltyYards: number;
    homeWinPct: number;
    tendency: string;
  };
}

