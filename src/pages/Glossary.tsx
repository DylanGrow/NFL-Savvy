import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

interface GlossaryTerm {
  abbr: string;
  name: string;
  category: 'Advanced' | 'Passing' | 'Rushing' | 'Receiving' | 'Defense' | 'Fantasy';
  formula?: string;
  description: string;
  context: string;
  benchmark?: string;
}

const GLOSSARY_TERMS: GlossaryTerm[] = [
  // Advanced Analytics
  {
    abbr: 'EPA',
    name: 'Expected Points Added',
    category: 'Advanced',
    formula: 'EPA = EP_after - EP_before',
    description: 'Measures the net value of individual plays in terms of expected scoring probability, taking into account down, distance, field position, and game clock.',
    context: 'A 3-yard run on 3rd-and-2 adds high positive EPA because it converts a first down; a 3-yard run on 3rd-and-10 yields negative EPA because a punt is still required.',
    benchmark: 'Elite offenses average > +0.15 EPA/play; below-average units sit below -0.05.',
  },
  {
    abbr: 'CPOE',
    name: 'Completion Percentage Over Expected',
    category: 'Advanced',
    formula: 'Actual Completion % - Expected Completion %',
    description: "Calculates a quarterback's actual completion percentage compared to an NFL Next Gen Stats tracking model that estimates completion probability based on receiver separation, pass rush distance, throw distance, and sideline speed.",
    context: 'Isolates quarterback passing accuracy and ball placement from schematic open receivers.',
    benchmark: 'Top QBs maintain +4.0% to +8.0% CPOE over a full season.',
  },
  {
    abbr: 'DVOA',
    name: 'Defense-adjusted Value Over Average',
    category: 'Advanced',
    formula: 'Proprietary FTN / Football Outsiders formula',
    description: 'Breaks down every single NFL play and compares a team’s success to the league average based on situation, then adjusts for the strength of the opposing defense or offense.',
    context: 'Ensures running for 100 yards against the top-ranked defense is credited much higher than against the 32nd-ranked run defense.',
    benchmark: 'Top 5 units exceed +20% offensive DVOA or -15% defensive DVOA.',
  },
  {
    abbr: 'Success Rate',
    name: 'Play Success Rate',
    category: 'Advanced',
    formula: 'Percentage of plays with positive EPA (or 50% on 1st down, 70% on 2nd, 100% on 3rd/4th)',
    description: 'Measures down-to-down consistency of an offense or defense, ensuring big 70-yard explosive outliers do not mask an otherwise inefficient offense.',
    context: 'High success rate teams consistently stay on schedule and sustain 10+ play scoring drives.',
    benchmark: 'League average is ~44%; elite units surpass 50%.',
  },
  {
    abbr: 'WPA',
    name: 'Win Probability Added',
    category: 'Advanced',
    formula: 'WP_after - WP_before',
    description: 'The net change in a team’s win probability caused by a single play.',
    context: 'A 4th-quarter Hail Mary or goal-line stand will carry huge WPA (>25%), whereas a 1st-quarter touchdown has moderate WPA (~8%).',
    benchmark: 'Game-winning plays often generate +30% to +60% WPA in a single snap.',
  },

  // Passing Metrics
  {
    abbr: 'Passer Rating',
    name: 'NFL Passer Rating',
    category: 'Passing',
    formula: 'Sum of 4 capped components based on CMP%, Y/A, TD%, and INT% scaled from 0 to 158.3',
    description: 'The traditional official NFL quarterback rating benchmark created in 1973.',
    context: 'Standard measurement for passing efficiency, though it does not factor in sacks or rushing.',
    benchmark: '158.3 is a perfect rating; 100+ is Pro Bowl caliber; 88-92 is league average.',
  },
  {
    abbr: 'ANY/A',
    name: 'Adjusted Net Yards per Attempt',
    category: 'Passing',
    formula: '(Passing Yards + 20*TD - 45*INT - Sack Yards) / (Attempts + Sacks)',
    description: 'One of the single most statistically predictive passing efficiency metrics in NFL analytics. Accounts for the high negative cost of sacks and turnovers alongside touchdowns.',
    context: 'Consistently correlates higher with winning percentage than traditional passer rating.',
    benchmark: '7.5+ is MVP tier; 6.5 is league average; under 5.5 signals offensive struggles.',
  },
  {
    abbr: 'AY/A',
    name: 'Adjusted Yards per Attempt',
    category: 'Passing',
    formula: '(Passing Yards + 20*TD - 45*INT) / Attempts',
    description: 'Pass yards per attempt with heavy rewards for passing touchdowns (+20 yds) and heavy penalties for interceptions (-45 yds).',
    context: 'A quick measure of passing aggression vs turnover avoidance.',
    benchmark: '8.0+ is upper echelon; 6.8 is average.',
  },
  {
    abbr: 'QBR',
    name: 'Total Quarterback Rating',
    category: 'Passing',
    formula: 'ESPN proprietary metric (0-100 scale)',
    description: 'Evaluates quarterbacks on all plays including scrambles, designed runs, sacks, scrambles, penalties, and situational leverage (e.g. 3rd-and-long conversions).',
    context: 'A 50 QBR is strictly average; 70+ is playoff-caliber; 80+ is All-Pro territory.',
    benchmark: '2026 NFL leaders hover between 72.0 and 81.5.',
  },
  {
    abbr: 'ADOT',
    name: 'Average Depth of Target',
    category: 'Passing',
    formula: 'Total Target Air Yards / Total Pass Attempts',
    description: 'Measures how far downfield a quarterback delivers the football on average, past the line of scrimmage.',
    context: 'Distinguishes vertical deep-ball gunslingers (ADOT 9.0+) from quick-strike rhythm spread passers (ADOT 6.5-7.5).',
    benchmark: 'NFL average is approximately 7.8 to 8.2 yards.',
  },
  {
    abbr: 'Sack Rate',
    name: 'Quarterback Sack Percentage',
    category: 'Passing',
    formula: 'Sacks / (Pass Attempts + Sacks) * 100',
    description: 'The percentage of quarterback pass dropbacks that result in a sack.',
    context: 'Research demonstrates sack rate is predominantly a quarterback metric rather than purely offensive line fault.',
    benchmark: 'Elite pocket navigators sit under 5.0%; league average is ~6.6%.',
  },

  // Receiving Metrics
  {
    abbr: 'YAC',
    name: 'Yards After the Catch',
    category: 'Receiving',
    formula: 'Total Receiving Yards - Air Yards at Catch Point',
    description: 'Distance gained by a receiver with the ball in their hands after completing the catch.',
    context: 'Crucial for evaluating elusive slot receivers, tight ends, and screen-game weapons.',
    benchmark: '5.5+ YAC/reception is exceptional for boundary receivers; screen backs average 8+.',
  },
  {
    abbr: 'YPRR',
    name: 'Yards Per Route Run',
    category: 'Receiving',
    formula: 'Total Receiving Yards / Routes Run on Passing Snaps',
    description: 'The holy grail metric for wide receiver efficiency. Evaluates production independent of total team snap volume or run-heavy offensive playcalling.',
    context: 'Identifies breakout superstars who may have limited target totals due to low team passing attempts.',
    benchmark: '2.50+ YPRR is elite (top 10 NFL); 1.80 is a solid starting receiver.',
  },
  {
    abbr: 'RACR',
    name: 'Receiver Air Conversion Ratio',
    category: 'Receiving',
    formula: 'Receiving Yards / Total Air Yards',
    description: 'Created by Josh Hermsmeyer to quantify how efficiently a pass-catcher converts intended air yards into actual receiving yardage.',
    context: 'A low RACR (<0.70) with high air yards indicates an inefficient deep threat or inaccurate quarterback targeting.',
    benchmark: 'League average is around 0.85; elite receivers top 1.05.',
  },
  {
    abbr: 'Target Share',
    name: 'Team Target Percentage',
    category: 'Receiving',
    formula: 'Player Targets / Total Team Pass Attempts * 100',
    description: 'The slice of an offense’s passing pie directed towards an individual pass-catcher.',
    context: 'Alpha wide receivers consistently command 25% or higher of their offense’s targets.',
    benchmark: '28%+ signifies a true target hog (CeeDee Lamb, Justin Jefferson tier).',
  },

  // Rushing & Line Metrics
  {
    abbr: 'RBOE',
    name: 'Rushing Yards Over Expected',
    category: 'Rushing',
    formula: 'Actual Rushing Yards - Expected Rushing Yards',
    description: 'Uses NFL Next Gen Stats tracking to simulate expected rush yards given offensive/defensive player locations, speeds, and block angles at handoff.',
    context: 'Highlights explosive backs who create positive gains even when defenders penetrate the backfield.',
    benchmark: 'Over +1.0 RBOE per carry is exceptional.',
  },
  {
    abbr: 'YCO/A',
    name: 'Yards After Contact per Attempt',
    category: 'Rushing',
    formula: 'Total Rushing Yards after Defender Contact / Rush Attempts',
    description: 'Isolates a running back’s balance, leg drive, and tackle-breaking capability from offensive line blocking.',
    context: 'Separates power runners who create their own yards from systemic backs dependent on clear holes.',
    benchmark: '3.2+ YCO/A marks a premier contact-balance running back.',
  },
  {
    abbr: 'PRWR',
    name: 'Pass Rush Win Rate',
    category: 'Rushing',
    formula: 'Pass rushes where defender beats blocker in under 2.5 seconds / Total pass rush snaps',
    description: 'ESPN tracking metric indicating how quickly a pass rusher defeats their offensive blocker.',
    context: 'Prevents coverage sacks from artificially elevating edge rusher ratings.',
    benchmark: 'Top edge rushers win on 22%+ of pass-rush snaps.',
  },

  // Defense & Coverage
  {
    abbr: 'PBU',
    name: 'Pass Breakup',
    category: 'Defense',
    formula: 'Count of passes deflected or batted down by a defender',
    description: 'Direct defensive disruption preventing a reception without recording an interception.',
    context: 'Crucial metric for elite lockdown corners who deter targets and swat passes away.',
    benchmark: 'Top cornerbacks record 12 to 18 PBUs per season.',
  },
  {
    abbr: 'Havoc Rate',
    name: 'Defensive Havoc Percentage',
    category: 'Defense',
    formula: '(Tackles for Loss + Forced Fumbles + Interceptions + Pass Breakups) / Total Plays',
    description: 'Measures the disruptive big-play generation of an entire defense.',
    context: 'High-havoc defenses manufacture turnovers and force offenses into 2nd/3rd-and-long situations.',
    benchmark: 'Elite units generate havoc on over 18% of defensive snaps.',
  },

  // Fantasy
  {
    abbr: 'PPR',
    name: 'Points Per Reception',
    category: 'Fantasy',
    formula: 'Standard Scoring + 1.0 point per reception',
    description: 'Fantasy football scoring system rewarding receptions, elevating the value of pass-catching running backs, slot receivers, and tight ends.',
    context: 'Shifts draft strategy toward high-volume possession targets.',
    benchmark: '20.0+ PPR fantasy points per game is RB1/WR1 tier.',
  },
  {
    abbr: 'Opportunity Share',
    name: 'Running Back Opportunity Share',
    category: 'Fantasy',
    formula: '(Player Rushes + Targets) / (Team Total Rushes + RB Targets) * 100',
    description: 'The combined market share of rushing attempts and targets allocated to a backfield weapon.',
    context: 'Believed to be the single highest predictor of fantasy running back scoring.',
    benchmark: '70%+ represents a true workhorse three-down bellcow.',
  },
];

export default function Glossary() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // ── Interactive Passer Rating & ANY/A Calculator State ────
  const [calcComp, setCalcComp] = useState<number>(24);
  const [calcAtt, setCalcAtt] = useState<number>(34);
  const [calcYds, setCalcYds] = useState<number>(285);
  const [calcTd, setCalcTd] = useState<number>(3);
  const [calcInt, setCalcInt] = useState<number>(0);
  const [calcSack, setCalcSack] = useState<number>(2);
  const [calcSackYds, setCalcSackYds] = useState<number>(14);

  // Official NFL Passer Rating Calculation
  const qbCalculations = useMemo(() => {
    const att = Math.max(1, calcAtt);
    const comp = Math.min(att, Math.max(0, calcComp));
    const yds = calcYds;
    const td = Math.max(0, calcTd);
    const interceptions = Math.max(0, calcInt);
    const sck = Math.max(0, calcSack);
    const sckYds = Math.max(0, calcSackYds);

    // Official Formula Components:
    // a = ((CMP / ATT) - 0.3) * 5
    // b = ((YDS / ATT) - 3) * 0.25
    // c = (TD / ATT) * 20
    // d = 2.375 - ((INT / ATT) * 25)
    // Each component is capped between 0 and 2.375
    const a = Math.max(0, Math.min(2.375, (comp / att - 0.3) * 5));
    const b = Math.max(0, Math.min(2.375, (yds / att - 3) * 0.25));
    const c = Math.max(0, Math.min(2.375, (td / att) * 20));
    const d = Math.max(0, Math.min(2.375, 2.375 - (interceptions / att) * 25));

    const passerRating = Math.round(((a + b + c + d) / 6) * 100 * 10) / 10;
    const compPct = Math.round((comp / att) * 1000) / 10;
    const ypa = Math.round((yds / att) * 10) / 10;
    const aya = Math.round(((yds + 20 * td - 45 * interceptions) / att) * 10) / 10;
    const anya = Math.round(((yds + 20 * td - 45 * interceptions - sckYds) / (att + sck)) * 10) / 10;

    let tier = 'Average';
    let tierColor = 'text-gray-300 bg-gray-800 border-gray-700';

    if (passerRating >= 158.3) {
      tier = 'Perfect (158.3)';
      tierColor = 'text-amber-400 bg-amber-500/10 border-amber-500/40';
    } else if (passerRating >= 115) {
      tier = 'Elite / MVP Tier';
      tierColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40';
    } else if (passerRating >= 100) {
      tier = 'Pro Bowl Caliber';
      tierColor = 'text-blue-400 bg-blue-500/10 border-blue-500/40';
    } else if (passerRating >= 88) {
      tier = 'League Average';
      tierColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/40';
    } else {
      tier = 'Below Average';
      tierColor = 'text-rose-400 bg-rose-500/10 border-rose-500/40';
    }

    return {
      passerRating,
      compPct,
      ypa,
      aya,
      anya,
      tier,
      tierColor,
    };
  }, [calcComp, calcAtt, calcYds, calcTd, calcInt, calcSack, calcSackYds]);

  const loadPreset = (preset: 'perfect' | 'dak' | 'mahomes' | 'struggle') => {
    if (preset === 'perfect') {
      setCalcComp(18);
      setCalcAtt(20);
      setCalcYds(320);
      setCalcTd(4);
      setCalcInt(0);
      setCalcSack(1);
      setCalcSackYds(6);
    } else if (preset === 'dak') {
      setCalcComp(26);
      setCalcAtt(38);
      setCalcYds(312);
      setCalcTd(3);
      setCalcInt(1);
      setCalcSack(2);
      setCalcSackYds(15);
    } else if (preset === 'mahomes') {
      setCalcComp(24);
      setCalcAtt(33);
      setCalcYds(288);
      setCalcTd(2);
      setCalcInt(0);
      setCalcSack(1);
      setCalcSackYds(8);
    } else {
      setCalcComp(14);
      setCalcAtt(32);
      setCalcYds(145);
      setCalcTd(0);
      setCalcInt(3);
      setCalcSack(5);
      setCalcSackYds(38);
    }
  };

  // Filtered glossary entries
  const filteredTerms = useMemo(() => {
    return GLOSSARY_TERMS.filter(item => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.abbr.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.context.toLowerCase().includes(q) ||
          (item.formula || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedCategory, search]);

  return (
    <div className="app-container py-4 sm:py-8 text-gray-100 font-sans space-y-6 sm:space-y-8">
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 p-4 sm:p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-2xl sm:text-3xl" aria-hidden="true">📖</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              NFL Analytics Glossary & Passer Rating Studio
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-400">
            Interactive Passer Rating & ANY/A formulas, EPA/CPOE models, and comprehensive modern football analytics encyclopedia
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/players"
            className="px-4 py-2 bg-gray-950 border border-gray-800 hover:bg-gray-800 rounded-xl text-xs sm:text-sm font-bold text-gray-300 transition"
          >
            Explore Players
          </Link>
          <Link
            to="/trade-analyzer"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow transition"
          >
            Trade Analyzer
          </Link>
        </div>
      </div>

      {/* ── Interactive NFL Passer Rating & ANY/A Calculator ──── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
              <span>🧮</span> Interactive NFL Passer Rating & ANY/A Calculator
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Input single-game or season passing stats to calculate official Passer Rating, Yards per Attempt, and ANY/A in real-time
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 self-stretch sm:self-auto">
            <span className="text-[10px] text-gray-500 font-semibold uppercase mr-1">Presets:</span>
            <button
              onClick={() => loadPreset('perfect')}
              className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold transition"
            >
              ⭐ Perfect 158.3
            </button>
            <button
              onClick={() => loadPreset('dak')}
              className="px-2.5 py-1 bg-gray-950 hover:bg-gray-800 text-gray-300 border border-gray-800 rounded-lg text-xs font-medium transition"
            >
              Dak Prescott
            </button>
            <button
              onClick={() => loadPreset('mahomes')}
              className="px-2.5 py-1 bg-gray-950 hover:bg-gray-800 text-gray-300 border border-gray-800 rounded-lg text-xs font-medium transition"
            >
              Patrick Mahomes
            </button>
            <button
              onClick={() => loadPreset('struggle')}
              className="px-2.5 py-1 bg-gray-950 hover:bg-gray-800 text-rose-300 border border-gray-800 rounded-lg text-xs font-medium transition"
            >
              Cold Game
            </button>
          </div>
        </div>

        {/* Input Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
          <div className="bg-gray-950 border border-gray-800 p-2.5 rounded-xl space-y-1">
            <label className="text-gray-400 font-semibold uppercase tracking-wider text-[10px] block">
              Completions (CMP)
            </label>
            <input
              type="number"
              min="0"
              max={calcAtt}
              value={calcComp}
              onChange={e => setCalcComp(Number(e.target.value) || 0)}
              className="w-full bg-gray-900 border border-gray-800 rounded px-2.5 py-1.5 text-sm font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="bg-gray-950 border border-gray-800 p-2.5 rounded-xl space-y-1">
            <label className="text-gray-400 font-semibold uppercase tracking-wider text-[10px] block">
              Attempts (ATT)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={calcAtt}
              onChange={e => setCalcAtt(Math.max(1, Number(e.target.value) || 1))}
              className="w-full bg-gray-900 border border-gray-800 rounded px-2.5 py-1.5 text-sm font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="bg-gray-950 border border-gray-800 p-2.5 rounded-xl space-y-1">
            <label className="text-gray-400 font-semibold uppercase tracking-wider text-[10px] block">
              Passing Yards (YDS)
            </label>
            <input
              type="number"
              value={calcYds}
              onChange={e => setCalcYds(Number(e.target.value) || 0)}
              className="w-full bg-gray-900 border border-gray-800 rounded px-2.5 py-1.5 text-sm font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="bg-gray-950 border border-gray-800 p-2.5 rounded-xl space-y-1">
            <label className="text-gray-400 font-semibold uppercase tracking-wider text-[10px] block">
              Touchdowns (TD)
            </label>
            <input
              type="number"
              min="0"
              value={calcTd}
              onChange={e => setCalcTd(Number(e.target.value) || 0)}
              className="w-full bg-gray-900 border border-gray-800 rounded px-2.5 py-1.5 text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="bg-gray-950 border border-gray-800 p-2.5 rounded-xl space-y-1">
            <label className="text-gray-400 font-semibold uppercase tracking-wider text-[10px] block">
              Interceptions (INT)
            </label>
            <input
              type="number"
              min="0"
              value={calcInt}
              onChange={e => setCalcInt(Number(e.target.value) || 0)}
              className="w-full bg-gray-900 border border-gray-800 rounded px-2.5 py-1.5 text-sm font-mono font-bold text-rose-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="bg-gray-950 border border-gray-800 p-2.5 rounded-xl space-y-1">
            <label className="text-gray-400 font-semibold uppercase tracking-wider text-[10px] block">
              Sacks Taken (SCK)
            </label>
            <input
              type="number"
              min="0"
              value={calcSack}
              onChange={e => setCalcSack(Number(e.target.value) || 0)}
              className="w-full bg-gray-900 border border-gray-800 rounded px-2.5 py-1.5 text-sm font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="bg-gray-950 border border-gray-800 p-2.5 rounded-xl space-y-1">
            <label className="text-gray-400 font-semibold uppercase tracking-wider text-[10px] block">
              Sack Yards Lost
            </label>
            <input
              type="number"
              min="0"
              value={calcSackYds}
              onChange={e => setCalcSackYds(Number(e.target.value) || 0)}
              className="w-full bg-gray-900 border border-gray-800 rounded px-2.5 py-1.5 text-sm font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Live Calculated Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {/* Main Passer Rating */}
          <div className="col-span-2 bg-gradient-to-r from-gray-950 to-gray-900 border border-gray-800 p-4 rounded-xl flex items-center justify-between shadow-inner">
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                NFL Passer Rating
              </span>
              <div className="text-3xl sm:text-4xl font-black font-mono text-white mt-1">
                {qbCalculations.passerRating}
              </div>
            </div>
            <div className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border ${qbCalculations.tierColor}`}>
              {qbCalculations.tier}
            </div>
          </div>

          {/* ANY/A */}
          <div className="bg-gray-950 border border-gray-800 p-3.5 rounded-xl space-y-0.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ANY/A</span>
            <div className="text-xl font-bold font-mono text-blue-400">{qbCalculations.anya}</div>
            <span className="text-[10px] text-gray-500 font-mono">Adj. Net Yds / Att</span>
          </div>

          {/* AY/A */}
          <div className="bg-gray-950 border border-gray-800 p-3.5 rounded-xl space-y-0.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">AY/A</span>
            <div className="text-xl font-bold font-mono text-indigo-300">{qbCalculations.aya}</div>
            <span className="text-[10px] text-gray-500 font-mono">Adjusted Yds / Att</span>
          </div>

          {/* Y/A */}
          <div className="bg-gray-950 border border-gray-800 p-3.5 rounded-xl space-y-0.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">YPA (Y/A)</span>
            <div className="text-xl font-bold font-mono text-gray-200">{qbCalculations.ypa}</div>
            <span className="text-[10px] text-gray-500 font-mono">Yards / Attempt</span>
          </div>

          {/* Completion % */}
          <div className="bg-gray-950 border border-gray-800 p-3.5 rounded-xl space-y-0.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">CMP %</span>
            <div className="text-xl font-bold font-mono text-emerald-400">{qbCalculations.compPct}%</div>
            <span className="text-[10px] text-gray-500 font-mono">{calcComp} of {calcAtt}</span>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Category Bar ────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        {/* Category Chips */}
        <div className="flex flex-wrap gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'Advanced', 'Passing', 'Receiving', 'Rushing', 'Defense', 'Fantasy'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-gray-950 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search stat (e.g. EPA, CPOE, ANY/A)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* ── Glossary Terms Grid ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTerms.map((term, idx) => (
          <div
            key={idx}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3 hover:border-gray-700 transition shadow-sm"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-lg text-white font-mono">{term.abbr}</span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {term.category}
                    </span>
                  </div>
                  <h3 className="text-xs font-semibold text-gray-400 mt-0.5">{term.name}</h3>
                </div>
              </div>

              {term.formula && (
                <div className="bg-gray-950 border border-gray-850 p-2 rounded-lg font-mono text-[11px] text-cyan-300 break-words">
                  <code>{term.formula}</code>
                </div>
              )}

              <p className="text-xs text-gray-300 leading-relaxed">{term.description}</p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-gray-850 text-[11px]">
              <div className="text-gray-400">
                <strong className="text-gray-300">Context:</strong> {term.context}
              </div>
              {term.benchmark && (
                <div className="text-emerald-400/90 font-mono text-[10px]">
                  <strong>Benchmark:</strong> {term.benchmark}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
