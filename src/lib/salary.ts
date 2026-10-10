import type { Salary } from '../types';

/** 2026 NFL season salary data — sourced from OverTheCap/Spotrac active figures */
export const SALARIES: Salary[] = [
  // QBs
  { playerId: '3139477', teamId: '12', capHit: 66250000, totalValue: 503000000, guaranteedMoney: 326500000, yearsRemaining: 7, aav: 62500000, signingBonus: 25000000 }, // Mahomes
  { playerId: '4040715', teamId: '6',  capHit: 55150000, totalValue: 240000000, guaranteedMoney: 231000000, yearsRemaining: 4, aav: 60000000, signingBonus: 80000000 }, // Dak Prescott
  { playerId: '4241479', teamId: '33', capHit: 54650000, totalValue: 260000000, guaranteedMoney: 185000000, yearsRemaining: 3, aav: 52000000, signingBonus: 20000000 }, // Lamar Jackson
  { playerId: '4360310', teamId: '21', capHit: 52800000, totalValue: 255000000, guaranteedMoney: 179300000, yearsRemaining: 3, aav: 51250000, signingBonus: 15000000 }, // Jalen Hurts
  { playerId: '3054220', teamId: '9',  capHit: 48000000, totalValue: 220000000, guaranteedMoney: 160000000, yearsRemaining: 4, aav: 55000000, signingBonus: 75000000 }, // Jordan Love
  { playerId: '4360438', teamId: '30', capHit: 47000000, totalValue: 275000000, guaranteedMoney: 200000000, yearsRemaining: 5, aav: 55000000, signingBonus: 37500000 }, // Trevor Lawrence
  { playerId: '3918298', teamId: '2',  capHit: 45005667, totalValue: 258034000, guaranteedMoney: 150000000, yearsRemaining: 3, aav: 43005667, signingBonus: 16500000 }, // Josh Allen
  { playerId: '4697815', teamId: '34', capHit: 39500000, totalValue: 160000000, guaranteedMoney: 100000000, yearsRemaining: 2, aav: 40000000, signingBonus: 18000000 }, // C.J. Stroud
  { playerId: '4241478', teamId: '15', capHit: 38000000, totalValue: 212000000, guaranteedMoney: 167000000, yearsRemaining: 4, aav: 53100000, signingBonus: 42000000 }, // Tua Tagovailoa
  { playerId: '4567048', teamId: '14', capHit: 50500000, totalValue: 330000000, guaranteedMoney: 222000000, yearsRemaining: 4, aav: 55000000, signingBonus: 22000000 }, // Matthew Stafford
  // WRs
  { playerId: '4262921', teamId: '16', capHit: 38000000, totalValue: 140000000, guaranteedMoney: 110000000, yearsRemaining: 4, aav: 35000000, signingBonus: 36900000 }, // Justin Jefferson
  { playerId: '4372016', teamId: '6',  capHit: 33500000, totalValue: 136000000, guaranteedMoney: 100000000, yearsRemaining: 4, aav: 34000000, signingBonus: 38000000 }, // CeeDee Lamb
  { playerId: '4360434', teamId: '25', capHit: 30000000, totalValue: 120000000, guaranteedMoney: 76000000,  yearsRemaining: 4, aav: 30000000, signingBonus: 23000000 }, // Brandon Aiyuk
  { playerId: '4040570', teamId: '21', capHit: 28000000, totalValue: 96000000,  guaranteedMoney: 84000000,  yearsRemaining: 3, aav: 32000000, signingBonus: 20000000 }, // A.J. Brown
  { playerId: '3054273', teamId: '20', capHit: 31000000, totalValue: 120000000, guaranteedMoney: 80000000,  yearsRemaining: 2, aav: 30000000, signingBonus: 12000000 }, // Davante Adams
  // RBs
  { playerId: '4040749', teamId: '25', capHit: 15800000, totalValue: 62000000,  guaranteedMoney: 38000000,  yearsRemaining: 3, aav: 19000000, signingBonus: 8000000  }, // Christian McCaffrey
  { playerId: '4241457', teamId: '21', capHit: 13500000, totalValue: 37750000,  guaranteedMoney: 26000000,  yearsRemaining: 2, aav: 12583333, signingBonus: 11600000 }, // Saquon Barkley
  { playerId: '3054239', teamId: '12', capHit: 12500000, totalValue: 48000000,  guaranteedMoney: 25000000,  yearsRemaining: 1, aav: 12000000, signingBonus: 4000000  }, // Isiah Pacheco
  // TEs
  { playerId: '4040611', teamId: '12', capHit: 19500000, totalValue: 68000000,  guaranteedMoney: 36000000,  yearsRemaining: 1, aav: 17000000, signingBonus: 5000000  }, // Travis Kelce
  { playerId: '3054275', teamId: '22', capHit: 18500000, totalValue: 72000000,  guaranteedMoney: 42000000,  yearsRemaining: 1, aav: 18000000, signingBonus: 7000000  }, // Trey McBride
  // OL
  { playerId: '4360439', teamId: '27', capHit: 28100000, totalValue: 140630000, guaranteedMoney: 88240000,  yearsRemaining: 5, aav: 28126000, signingBonus: 25000000 }, // Tristan Wirfs
  { playerId: '4240578', teamId: '8',  capHit: 28000000, totalValue: 112000000, guaranteedMoney: 84000000,  yearsRemaining: 4, aav: 28000000, signingBonus: 23000000 }, // Penei Sewell
  // DL / EDGE
  { playerId: '4360437', teamId: '25', capHit: 34700000, totalValue: 170000000, guaranteedMoney: 122500000, yearsRemaining: 3, aav: 34000000, signingBonus: 50000000 }, // Nick Bosa
  { playerId: '4039348', teamId: '34', capHit: 31000000, totalValue: 155000000, guaranteedMoney: 115500000, yearsRemaining: 3, aav: 31000000, signingBonus: 15000000 }, // Danielle Hunter
  { playerId: '4040557', teamId: '33', capHit: 24000000, totalValue: 98000000,  guaranteedMoney: 70000000,  yearsRemaining: 2, aav: 23000000, signingBonus: 8000000  }, // Odafe Oweh
  // LBs
  { playerId: '3054266', teamId: '6',  capHit: 25000000, totalValue: 140000000, guaranteedMoney: 95000000,  yearsRemaining: 4, aav: 35000000, signingBonus: 25000000 }, // Micah Parsons
  // CBs & DBs
  { playerId: '4426515', teamId: '7',  capHit: 24000000, totalValue: 100500000, guaranteedMoney: 66000000,  yearsRemaining: 4, aav: 24000000, signingBonus: 21000000 }, // Patrick Surtain II
  { playerId: '4040618', teamId: '33', capHit: 21000000, totalValue: 86000000,  guaranteedMoney: 55000000,  yearsRemaining: 3, aav: 21500000, signingBonus: 12000000 }, // Kyle Hamilton
  // Kickers
  { playerId: '3054258', teamId: '12', capHit: 7500000,  totalValue: 25600000,  guaranteedMoney: 17750000,  yearsRemaining: 3, aav: 6400000,   signingBonus: 5000000  }, // Harrison Butker
];

/** Build a Map for O(1) lookup by playerId */
export const SALARY_BY_PLAYER = new Map<string, Salary>(
  SALARIES.map(s => [s.playerId, s])
);

/** Build a Map grouping salaries by teamId */
export const SALARY_BY_TEAM = SALARIES.reduce((acc, s) => {
  if (!acc.has(s.teamId)) acc.set(s.teamId, []);
  acc.get(s.teamId)!.push(s);
  return acc;
}, new Map<string, Salary[]>());

export function getSalary(playerId: string): Salary | undefined {
  return SALARY_BY_PLAYER.get(playerId);
}

export function getTeamSalaries(teamId: string): Salary[] {
  return SALARY_BY_TEAM.get(teamId) ?? [];
}

/** Total cap allocated for a team from known data */
export function getTeamCapAllocated(teamId: string): number {
  return getTeamSalaries(teamId).reduce((sum, s) => sum + s.capHit, 0);
}

/** 2026 NFL salary cap ($305M) */
export const NFL_CAP_2026 = 305_000_000;
/** Legacy alias for backwards compatibility */
export const NFL_CAP_2025 = 279_000_000;
export const CURRENT_NFL_CAP = NFL_CAP_2026;

/** Format a dollar amount into $XM or $XK shorthand */
export function formatSalary(amount: number): string {
  if (amount >= 1_000_000) return `\$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `\$${(amount / 1_000).toFixed(0)}K`;
  return `\$${amount}`;
}
