import type { Salary } from '../types';

/** 2025 NFL season salary data — sourced from public OverTheCap/Spotrac figures */
export const SALARIES: Salary[] = [
  // QBs
  { playerId: '3139477', teamId: '12', capHit: 58150000, totalValue: 503000000, guaranteedMoney: 326500000, yearsRemaining: 8, aav: 62500000, signingBonus: 25000000 }, // Mahomes
  { playerId: '3918298', teamId: '2',  capHit: 43005667, totalValue: 258034000, guaranteedMoney: 150000000, yearsRemaining: 4, aav: 43005667, signingBonus: 16500000 }, // Josh Allen
  { playerId: '4241479', teamId: '33', capHit: 52000000, totalValue: 260000000, guaranteedMoney: 185000000, yearsRemaining: 4, aav: 52000000, signingBonus: 20000000 }, // Lamar Jackson
  { playerId: '4360310', teamId: '21', capHit: 51250000, totalValue: 255000000, guaranteedMoney: 179300000, yearsRemaining: 4, aav: 51250000, signingBonus: 15000000 }, // Jalen Hurts
  { playerId: '3054211', teamId: '26', capHit: 31500000, totalValue: 240000000, guaranteedMoney: 161000000, yearsRemaining: 4, aav: 40000000, signingBonus: 12000000 }, // Geno Smith
  { playerId: '4697815', teamId: '34', capHit: 36000000, totalValue: 160000000, guaranteedMoney: 100000000, yearsRemaining: 3, aav: 40000000, signingBonus: 18000000 }, // C.J. Stroud
  { playerId: '4040715', teamId: '6',  capHit: 42000000, totalValue: 240000000, guaranteedMoney: 160000000, yearsRemaining: 4, aav: 50000000, signingBonus: 20000000 }, // Dak Prescott
  { playerId: '3054220', teamId: '9',  capHit: 36000000, totalValue: 150000000, guaranteedMoney: 72000000,  yearsRemaining: 2, aav: 35000000, signingBonus: 8000000  }, // Jordan Love
  { playerId: '4567048', teamId: '14', capHit: 55000000, totalValue: 330000000, guaranteedMoney: 222000000, yearsRemaining: 5, aav: 55000000, signingBonus: 22000000 }, // Matthew Stafford alt
  { playerId: '4360438', teamId: '16', capHit: 45000000, totalValue: 200000000, guaranteedMoney: 140000000, yearsRemaining: 3, aav: 45000000, signingBonus: 18000000 }, // Sam Darnold alt
  // WRs
  { playerId: '3054288', teamId: '34', capHit: 24000000, totalValue: 100000000, guaranteedMoney: 72000000,  yearsRemaining: 3, aav: 24000000, signingBonus: 10000000 }, // Stefon Diggs
  { playerId: '4047646', teamId: '24', capHit: 28000000, totalValue: 120000000, guaranteedMoney: 90000000,  yearsRemaining: 3, aav: 31000000, signingBonus: 10000000 }, // Keenan Allen
  { playerId: '4241478', teamId: '12', capHit: 26000000, totalValue: 126000000, guaranteedMoney: 72000000,  yearsRemaining: 3, aav: 28000000, signingBonus: 8000000  }, // Tyreek Hill
  { playerId: '3054273', teamId: '15', capHit: 30000000, totalValue: 120000000, guaranteedMoney: 80000000,  yearsRemaining: 3, aav: 30000000, signingBonus: 12000000 }, // Davante Adams
  { playerId: '4040570', teamId: '21', capHit: 22000000, totalValue: 100000000, guaranteedMoney: 64000000,  yearsRemaining: 3, aav: 22000000, signingBonus: 8000000  }, // A.J. Brown
  // RBs
  { playerId: '3054239', teamId: '12', capHit: 12000000, totalValue: 48000000,  guaranteedMoney: 25000000,  yearsRemaining: 2, aav: 12000000, signingBonus: 4000000  }, // Isiah Pacheco
  { playerId: '4040749', teamId: '25', capHit: 14000000, totalValue: 56000000,  guaranteedMoney: 30000000,  yearsRemaining: 2, aav: 14000000, signingBonus: 5000000  }, // Christian McCaffrey
  // TEs
  { playerId: '3054275', teamId: '22', capHit: 18000000, totalValue: 72000000,  guaranteedMoney: 42000000,  yearsRemaining: 2, aav: 18000000, signingBonus: 7000000  }, // Trey McBride
  { playerId: '4040611', teamId: '12', capHit: 17000000, totalValue: 68000000,  guaranteedMoney: 36000000,  yearsRemaining: 2, aav: 17000000, signingBonus: 5000000  }, // Travis Kelce
  // OL
  { playerId: '3054294', teamId: '26', capHit: 22000000, totalValue: 112000000, guaranteedMoney: 65000000,  yearsRemaining: 3, aav: 26000000, signingBonus: 12000000 }, // Laremy Tunsil
  // DL / EDGE
  { playerId: '4039348', teamId: '16', capHit: 31000000, totalValue: 155000000, guaranteedMoney: 115500000, yearsRemaining: 4, aav: 31000000, signingBonus: 15000000 }, // Danielle Hunter
  { playerId: '4040557', teamId: '33', capHit: 23000000, totalValue: 98000000,  guaranteedMoney: 70000000,  yearsRemaining: 3, aav: 23000000, signingBonus: 8000000  }, // Odafe Oweh
  // LBs
  { playerId: '3054266', teamId: '6',  capHit: 20000000, totalValue: 80000000,  guaranteedMoney: 50000000,  yearsRemaining: 2, aav: 20000000, signingBonus: 8000000  }, // Micah Parsons
  // CBs
  { playerId: '4037571', teamId: '21', capHit: 26000000, totalValue: 104000000, guaranteedMoney: 75000000,  yearsRemaining: 3, aav: 26000000, signingBonus: 11000000 }, // Darius Slay
  // Safeties
  { playerId: '4040618', teamId: '33', capHit: 19000000, totalValue: 76000000,  guaranteedMoney: 46000000,  yearsRemaining: 2, aav: 19000000, signingBonus: 6000000  }, // Kyle Hamilton
  // Kickers
  { playerId: '3054258', teamId: '12', capHit: 7000000,  totalValue: 28000000,  guaranteedMoney: 12000000,  yearsRemaining: 2, aav: 7000000,  signingBonus: 1000000  }, // Harrison Butker
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

/** 2025 NFL salary cap */
export const NFL_CAP_2025 = 279_000_000;

/** Format a dollar amount into $XM or $XK shorthand */
export function formatSalary(amount: number): string {
  if (amount >= 1_000_000) return `\$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `\$${(amount / 1_000).toFixed(0)}K`;
  return `\$${amount}`;
}
