import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { fetchStandingsData, fetchTeamsData } from '../lib/data';
import type { Team } from '../types';

export interface DraftProspect {
  rank: number;
  name: string;
  position: 'QB' | 'WR' | 'OT' | 'EDGE' | 'CB' | 'DT' | 'TE' | 'RB' | 'S';
  college: string;
  height: string;
  weight: string;
  strengths: string[];
  summary: string;
  comp: string;
}

export const TOP_2026_PROSPECTS: DraftProspect[] = [
  {
    rank: 1,
    name: 'Travis Hunter',
    position: 'CB',
    college: 'Colorado',
    height: "6'1\"",
    weight: '185 lbs',
    strengths: ['Generational ball skills', 'Elite versatility (CB/WR)', 'Instincts in zone/man'],
    summary: 'One of the most unique dual-threat athletes in modern college football history, boasting shutdown cover skills and game-breaking receiving chops.',
    comp: 'Champ Bailey / Garrett Wilson hybrid',
  },
  {
    rank: 2,
    name: 'Carson Beck',
    position: 'QB',
    college: 'Georgia',
    height: "6'4\"",
    weight: '220 lbs',
    strengths: ['Elite pocket processor', 'Anticipation on intermediate routes', 'Pro-ready footwork'],
    summary: 'Classical prototypical pocket passer with pinpoint accuracy, advanced multi-read progression capability, and championship pedigree.',
    comp: 'Kirk Cousins (plus arm strength)',
  },
  {
    rank: 3,
    name: 'Shedeur Sanders',
    position: 'QB',
    college: 'Colorado',
    height: "6'2\"",
    weight: '215 lbs',
    strengths: ['Incredible poise under pressure', 'Elite touch & deep ball placement', 'Clutch decision-making'],
    summary: 'Surgical accuracy from all platforms, extraordinary composure when pocket breaks down, and exceptional toughness in crunch time.',
    comp: 'Geno Smith / C.J. Stroud',
  },
  {
    rank: 4,
    name: 'Cam Ward',
    position: 'QB',
    college: 'Miami (FL)',
    height: "6'2\"",
    weight: '223 lbs',
    strengths: ['Off-script playmaker', 'Explosive arm angles', 'Dynamic red-zone creator'],
    summary: 'Electrifying dual-threat quarterback with rare arm flexibility, escape-ability, and big-play generation outside the pocket.',
    comp: 'Kyler Murray / Jordan Love',
  },
  {
    rank: 5,
    name: 'Abdul Carter',
    position: 'EDGE',
    college: 'Penn State',
    height: "6'3\"",
    weight: '252 lbs',
    strengths: ['Explosive first-step get-off', 'Elite bend around the arc', 'Sideline-to-sideline pursuit'],
    summary: 'Hyper-athletic pass rusher following in the footsteps of Micah Parsons with rare acceleration and disruption off the edge.',
    comp: 'Micah Parsons',
  },
  {
    rank: 6,
    name: 'Will Campbell',
    position: 'OT',
    college: 'LSU',
    height: "6'6\"",
    weight: '320 lbs',
    strengths: ['Anchor strength against bull-rush', 'Elite run-game road grader', 'Impeccable pass set balance'],
    summary: 'Dominant SEC left tackle since his true freshman season. Combines prototype frame with rock-solid technique against elite edge rushers.',
    comp: 'Joe Alt',
  },
  {
    rank: 7,
    name: 'Tetairoa McMillan',
    position: 'WR',
    college: 'Arizona',
    height: "6'5\"",
    weight: '212 lbs',
    strengths: ['Massive catch radius', 'Acrobatic contested-catch winner', 'Sneaky yards after catch'],
    summary: 'Towering alpha wide receiver with basketball rebounding skills in jump-ball situations and fluid release packages off press coverage.',
    comp: 'Mike Evans',
  },
  {
    rank: 8,
    name: 'Mason Graham',
    position: 'DT',
    college: 'Michigan',
    height: "6'3\"",
    weight: '318 lbs',
    strengths: ['Heavy wrestling hands', 'Penetrating interior disruptor', 'Double-team anchor'],
    summary: 'Powerful two-way defensive tackle who collapses pass pockets from the inside while consistently shutting down interior run lanes.',
    comp: 'Christian Wilkins',
  },
  {
    rank: 9,
    name: 'Luther Burden III',
    position: 'WR',
    college: 'Missouri',
    height: "5'11\"",
    weight: '208 lbs',
    strengths: ['Running back tackle-breaking power', 'Explosive short-area burst', 'Dynamic slot separator'],
    summary: 'Contact-seeking playmaker built like a running back with 4.3 speed. Unstoppable on screens, slants, and broken plays.',
    comp: 'Deebo Samuel',
  },
  {
    rank: 10,
    name: 'James Pearce Jr.',
    position: 'EDGE',
    college: 'Tennessee',
    height: "6'5\"",
    weight: '243 lbs',
    strengths: ['Speed rush dips', 'Violent closing burst', 'Pass-swatting wingspan'],
    summary: 'Lengthy edge predator capable of speed-turning the corner before offensive tackles can set their hands. Relentless motor.',
    comp: 'Leonard Floyd',
  },
  {
    rank: 11,
    name: 'Kelvin Banks Jr.',
    position: 'OT',
    college: 'Texas',
    height: "6'4\"",
    weight: '325 lbs',
    strengths: ['Smooth mirror-and-slide movement', 'Heavy punch shock', 'Second-level climb mobility'],
    summary: 'Anchor of the Longhorns line with rare lateral mobility for a 325-pound tackle, neutralizing SEC speed rushers on third down.',
    comp: 'Rashawn Slater',
  },
  {
    rank: 12,
    name: 'Benjamin Morrison',
    position: 'CB',
    college: 'Notre Dame',
    height: "6'0\"",
    weight: '185 lbs',
    strengths: ['Sticky press-man technique', 'Fluid hip transitions', 'Pass deflection rate'],
    summary: 'Lockdown perimeter corner with refined footwork, zero hesitation in recovery, and outstanding football IQ in critical downs.',
    comp: 'Patrick Surtain II',
  },
  {
    rank: 13,
    name: 'Ashton Jeanty',
    position: 'RB',
    college: 'Boise State',
    height: "5'9\"",
    weight: '215 lbs',
    strengths: ['Historic tackle-breaking balance', 'Sublime vision & cutback agility', 'Three-down pass-catching skills'],
    summary: 'College football’s premier running back sensation with legendary contact balance, home-run burst, and dynamic pass protection.',
    comp: 'Maurice Jones-Drew / Bijan Robinson hybrid',
  },
  {
    rank: 14,
    name: 'Kenneth Grant',
    position: 'DT',
    college: 'Michigan',
    height: "6'3\"",
    weight: '339 lbs',
    strengths: ['Unmovable 339-lb mass', 'Surprising chase speed', 'Pocket wrecking bull rush'],
    summary: 'Rare interior athlete who pairs immense size with chase athleticism, consistently drawing double teams in SEC/Big Ten showdowns.',
    comp: 'Jordan Davis',
  },
  {
    rank: 15,
    name: 'Malaki Starks',
    position: 'S',
    college: 'Georgia',
    height: "6'1\"",
    weight: '205 lbs',
    strengths: ['Centerfielder range', 'Run-support alley striker', 'Tight-end coverage ability'],
    summary: 'All-American safety with true 5-tool defensive back capability. Can play deep single-high, robber, or drop down in the nickel slot.',
    comp: 'Kyle Hamilton',
  },
  {
    rank: 16,
    name: 'Nic Scourton',
    position: 'EDGE',
    college: 'Texas A&M',
    height: "6'4\"",
    weight: '280 lbs',
    strengths: ['Heavy hands & spin move', 'Edge setting run stopper', 'Power rusher inside/outside'],
    summary: 'Massive, physically imposing power end with a devastating spin counter and the versatile frame to align anywhere from 3-tech to 7-tech.',
    comp: 'Cameron Jordan',
  },
  {
    rank: 17,
    name: 'Emery Jones Jr.',
    position: 'OT',
    college: 'LSU',
    height: "6'6\"",
    weight: '322 lbs',
    strengths: ['Mauling run blocker', 'Wide base in pass protection', 'Nasty finishing demeanor'],
    summary: 'Physical right tackle cornerstone with violent hands in the run game and proven durability against top edge competition.',
    comp: 'Trent Brown',
  },
  {
    rank: 18,
    name: 'Colston Loveland',
    position: 'TE',
    college: 'Michigan',
    height: "6'5\"",
    weight: '245 lbs',
    strengths: ['Elite route-running for TE', 'Soft hands in traffic', 'Matchup nightmare in seam'],
    summary: 'The consensus top tight end prospect in the country. Plays like an oversized receiver down the seams with reliable hands.',
    comp: 'Travis Kelce / Dalton Kincaid',
  },
  {
    rank: 19,
    name: 'Mykel Williams',
    position: 'EDGE',
    college: 'Georgia',
    height: "6'5\"",
    weight: '265 lbs',
    strengths: ['Length & wingspan leverage', 'Explosive first contact', 'High developmental ceiling'],
    summary: 'Long, explosive Georgia edge setter built in a lab with the length and physical tools NFL defensive line coaches covet in round 1.',
    comp: 'Travon Walker',
  },
  {
    rank: 20,
    name: 'Will Johnson',
    position: 'CB',
    college: 'Michigan',
    height: "6'2\"",
    weight: '202 lbs',
    strengths: ['Boundary press dominance', 'Ball hawking instincts', 'Clutch pick-six threat'],
    summary: 'Prototypical boundary cornerback with ideal size, fluid technique, and a natural knack for stepping in front of boundary out routes.',
    comp: 'Sauce Gardner',
  },
  {
    rank: 21,
    name: 'Shavon Revel Jr.',
    position: 'CB',
    college: 'East Carolina',
    height: "6'2\"",
    weight: '193 lbs',
    strengths: ['4.38 speed with length', 'Physical jamming at line', 'Recovery acceleration'],
    summary: 'Rapid riser on draft boards featuring rare height-weight-speed metrics and shutdown tape against premier college offenses.',
    comp: 'Tariq Woolen',
  },
  {
    rank: 22,
    name: 'Elic Ayomanor',
    position: 'WR',
    college: 'Stanford',
    height: "6'2\"",
    weight: '210 lbs',
    strengths: ['Dominant contested catches', 'Physical boundary release', 'High football toughness'],
    summary: 'Fierce boundary wideout famed for his historic performance against Colorado, showcasing NFL-caliber body control along the sidelines.',
    comp: 'Courtland Sutton',
  },
  {
    rank: 23,
    name: 'Tyler Booker',
    position: 'OT',
    college: 'Alabama',
    height: "6'5\"",
    weight: '325 lbs',
    strengths: ['Crushing interior punch', 'Drive-blocking leverage', 'Leadership anchor'],
    summary: 'Plug-and-play day-one starter at guard with the power to clear defensive tackles out of the A-gap on goal-line and short-yardage downs.',
    comp: 'Quenton Nelson',
  },
  {
    rank: 24,
    name: 'Jalon Walker',
    position: 'EDGE',
    college: 'Georgia',
    height: "6'2\"",
    weight: '245 lbs',
    strengths: ['Blistering blitz burst', 'Hybrid off-ball/edge flexibility', 'Special teams ace'],
    summary: 'Versatile defensive weapon who can line up at inside linebacker on first down and rush the passer on third down with electric get-off.',
    comp: 'Haason Reddick',
  },
  {
    rank: 25,
    name: 'Jonah Savaiinaea',
    position: 'OT',
    college: 'Arizona',
    height: "6'5\"",
    weight: '330 lbs',
    strengths: ['Heavy anchor against speed-to-power', 'Wide base', 'Guard/tackle positional flex'],
    summary: 'Massive Pacific-Islander lineman with nimble feet, excellent hand placement, and versatility to protect either edge or interior.',
    comp: 'Darnell Wright',
  },
  {
    rank: 26,
    name: 'Tre Harris',
    position: 'WR',
    college: 'Ole Miss',
    height: "6'2\"",
    weight: '205 lbs',
    strengths: ['Deep threat ball tracking', 'Contested catch dominance', 'YAC acceleration'],
    summary: 'Dominant SEC receiver who piles up 150-yard games with ease thanks to elite deep tracking and physical play at the catch point.',
    comp: 'A.J. Brown (play style)',
  },
  {
    rank: 27,
    name: 'Derrick Harmon',
    position: 'DT',
    college: 'Oregon',
    height: "6'5\"",
    weight: '310 lbs',
    strengths: ['High-motor interior chase', 'Quick lateral swim move', 'Gap control mastery'],
    summary: 'Transfer star who transformed the Ducks defensive front with violent hand usage, high pass-rush pressure rate, and strong run defense.',
    comp: 'Arik Armstead',
  },
  {
    rank: 28,
    name: 'Quinshon Judkins',
    position: 'RB',
    college: 'Ohio State',
    height: "6'0\"",
    weight: '219 lbs',
    strengths: ['Workhorse tackle breaker', 'Sudden jump cuts in hole', 'Finishes through contact'],
    summary: 'Prototypical bell-cow tailback who wore out SEC defenses for two seasons before joining Ohio State. Natural forward-falling runner.',
    comp: 'Josh Jacobs',
  },
  {
    rank: 29,
    name: 'Aireontae Ersery',
    position: 'OT',
    college: 'Minnesota',
    height: "6'6\"",
    weight: '330 lbs',
    strengths: ['Massive wing reach', 'Physical mauler on power runs', 'Reliable anchor in pass sets'],
    summary: 'Big Ten anchor with high-end size and foot quickness who shuts down interior counter moves and clears runways for the ground game.',
    comp: 'Orlando Brown Jr.',
  },
  {
    rank: 30,
    name: 'T.J. Sanders',
    position: 'DT',
    college: 'South Carolina',
    height: "6'4\"",
    weight: '290 lbs',
    strengths: ['Explosive first-step quickness', 'Interior pass rusher', 'Batted passes at line'],
    summary: 'Lethal 3-technique interior pass rusher with lightning-fast lateral movement to disrupt zone blocking schemes before they develop.',
    comp: 'Javon Hargrave',
  },
  {
    rank: 31,
    name: 'Isaiah Bond',
    position: 'WR',
    college: 'Texas',
    height: "5'11\"",
    weight: '180 lbs',
    strengths: ['Track 4.3 speed', 'Separator on deep posts', 'Dangerous jet-sweep weapon'],
    summary: 'Blazing speedster who can blow the top off Cover-2 shells and turn simple shallow drags into 70-yard touchdowns.',
    comp: 'Jaylen Waddle',
  },
  {
    rank: 32,
    name: 'Landon Jackson',
    position: 'EDGE',
    college: 'Arkansas',
    height: "6'7\"",
    weight: '280 lbs',
    strengths: ['Enormous wingspan & reach', 'Run-stopping anchor', 'Batting down quarterback passes'],
    summary: 'Towering edge defender with the size of a defensive end and the length to disrupt passing lanes and seal the edge against outside zone.',
    comp: 'Carl Granderson',
  },
];

// NFL Team Needs by Franchise
const TEAM_NEEDS: Record<string, string[]> = {
  CAR: ['WR', 'EDGE', 'CB', 'OT'],
  TEN: ['OT', 'EDGE', 'WR', 'CB'],
  NE: ['OT', 'WR', 'EDGE', 'DT'],
  CLE: ['OT', 'QB', 'WR', 'DT'],
  NYJ: ['OT', 'DT', 'WR', 'QB'],
  JAX: ['CB', 'OT', 'S', 'WR'],
  LV: ['QB', 'OT', 'CB', 'RB'],
  MIA: ['OT', 'DT', 'CB', 'S'],
  NO: ['OT', 'QB', 'WR', 'EDGE'],
  NYG: ['QB', 'CB', 'OT', 'DT'],
  ARI: ['EDGE', 'DT', 'CB', 'OT'],
  CIN: ['DT', 'EDGE', 'CB', 'OT'],
  IND: ['CB', 'S', 'TE', 'WR'],
  LAR: ['CB', 'OT', 'EDGE', 'QB'],
  SEA: ['OT', 'DT', 'LB', 'EDGE'],
  CHI: ['OT', 'EDGE', 'DT', 'RB'],
  ATL: ['EDGE', 'CB', 'DT', 'WR'],
  DAL: ['RB', 'DT', 'WR', 'EDGE'],
  SF: ['OT', 'CB', 'DT', 'EDGE'],
  DEN: ['WR', 'TE', 'RB', 'OT'],
  TB: ['EDGE', 'CB', 'WR', 'S'],
  LAC: ['WR', 'CB', 'DT', 'TE'],
  PHI: ['EDGE', 'CB', 'OT', 'WR'],
  GB: ['CB', 'OT', 'EDGE', 'DT'],
  HOU: ['DT', 'OT', 'CB', 'S'],
  BAL: ['OT', 'EDGE', 'WR', 'CB'],
  PIT: ['WR', 'CB', 'QB', 'DT'],
  WSH: ['EDGE', 'CB', 'OT', 'WR'],
  BUF: ['WR', 'CB', 'DT', 'EDGE'],
  DET: ['EDGE', 'CB', 'DT', 'OT'],
  KC: ['OT', 'WR', 'CB', 'DT'],
  MIN: ['CB', 'DT', 'OT', 'RB'],
};

interface DraftOrderEntry {
  pick: number;
  team: Team;
  record: string;
  winPct: number;
  diff: number;
  needs: string[];
  projectedProspect: DraftProspect;
}

export default function DraftOrder() {
  const [standings, setStandings] = useState<any>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [positionFilter, setPositionFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [customPicks, setCustomPicks] = useState<Record<number, DraftProspect>>({});

  useEffect(() => {
    document.title = '2026 NFL Draft Order & Top Prospects | NFL Savvy';

    async function loadData() {
      try {
        const [standRes, teamsRes] = await Promise.allSettled([
          api.fetchStandings().catch(() => fetchStandingsData()),
          fetchTeamsData(),
        ]);

        if (standRes.status === 'fulfilled' && standRes.value) {
          setStandings(standRes.value);
        } else {
          const fallback = await fetchStandingsData();
          setStandings(fallback);
        }

        if (teamsRes.status === 'fulfilled' && Array.isArray(teamsRes.value)) {
          setTeams(teamsRes.value);
        }
      } catch (err) {
        console.warn('Draft order data loading warning:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Compute 2026 Draft Order (Reverse Standings Order for Picks 1–32)
  const draftOrderList = useMemo<DraftOrderEntry[]>(() => {
    if (!teams.length) return [];

    const teamsMap = new Map<string, Team>();
    teams.forEach(t => {
      teamsMap.set(t.id, t);
      teamsMap.set(t.abbreviation.toUpperCase(), t);
      if (t.espnId) teamsMap.set(t.espnId, t);
    });

    // Extract records from standings
    const teamRecords: Array<{
      team: Team;
      wins: number;
      losses: number;
      ties: number;
      winPct: number;
      diff: number;
    }> = [];

    const conferences = standings?.children || [];
    const entriesList: any[] = [];
    conferences.forEach((c: any) => {
      (c.standings?.entries || []).forEach((e: any) => entriesList.push(e));
    });

    if (entriesList.length > 0) {
      entriesList.forEach((entry: any) => {
        const tid = String(entry.team?.id || '');
        const tabbr = String(entry.team?.abbreviation || '').toUpperCase();
        const matched = teamsMap.get(tid) || teamsMap.get(tabbr);
        if (!matched) return;

        const stats: Record<string, any> = {};
        (entry.stats || []).forEach((s: any) => {
          if (s.name) stats[s.name] = s.value ?? s.displayValue;
          if (s.abbreviation) stats[s.abbreviation] = s.value ?? s.displayValue;
        });

        const wins = parseInt(stats.wins ?? stats.W ?? '0', 10);
        const losses = parseInt(stats.losses ?? stats.L ?? '0', 10);
        const ties = parseInt(stats.ties ?? stats.T ?? '0', 10);
        const winPct = parseFloat(stats.winPercent ?? stats.PCT ?? '0');
        const diff = parseFloat(stats.pointDifferential ?? stats.DIFF ?? stats.differential ?? '0');

        teamRecords.push({
          team: matched,
          wins,
          losses,
          ties,
          winPct,
          diff,
        });
      });
    } else {
      // Fallback: alphabetical list with arbitrary draft seed
      teams.forEach((t, i) => {
        teamRecords.push({
          team: t,
          wins: 4,
          losses: 13,
          ties: 0,
          winPct: 0.235,
          diff: -50 + i * 2,
        });
      });
    }

    // Sort by WORST record first (lowest win%, then lowest point diff)
    teamRecords.sort((a, b) => {
      if (a.winPct !== b.winPct) return a.winPct - b.winPct;
      if (a.diff !== b.diff) return a.diff - b.diff;
      return a.wins - b.wins;
    });

    // Pair with prospects
    return teamRecords.slice(0, 32).map((tr, idx) => {
      const pickNum = idx + 1;
      const needs = TEAM_NEEDS[tr.team.abbreviation] || ['OT', 'EDGE', 'CB', 'WR'];
      const defaultProspect = TOP_2026_PROSPECTS[idx] || TOP_2026_PROSPECTS[0];
      const prospect = customPicks[pickNum] || defaultProspect;

      return {
        pick: pickNum,
        team: tr.team,
        record: `${tr.wins}-${tr.losses}${tr.ties ? `-${tr.ties}` : ''}`,
        winPct: tr.winPct,
        diff: tr.diff,
        needs,
        projectedProspect: prospect,
      };
    });
  }, [teams, standings, customPicks]);

  // Filtered prospects database
  const filteredProspects = useMemo(() => {
    return TOP_2026_PROSPECTS.filter(p => {
      if (positionFilter !== 'ALL' && p.position !== positionFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.college.toLowerCase().includes(q) ||
          p.position.toLowerCase().includes(q) ||
          p.comp.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [positionFilter, search]);

  const handleAssignProspect = (pickNum: number, prospect: DraftProspect) => {
    setCustomPicks(prev => ({
      ...prev,
      [pickNum]: prospect,
    }));
  };

  const handleResetPicks = () => {
    setCustomPicks({});
  };

  return (
    <div className="app-container py-4 sm:py-8 text-gray-100 font-sans space-y-6 sm:space-y-8">
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 p-4 sm:p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-2xl sm:text-3xl" aria-hidden="true">🎯</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              2026 NFL Draft Order & Top Prospects
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-400">
            Real-time reverse standings order, franchise team needs, and official scouting reports on top college prospects
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto">
          {Object.keys(customPicks).length > 0 && (
            <button
              onClick={handleResetPicks}
              className="px-3.5 py-2 bg-gray-950 border border-gray-800 hover:bg-gray-800 rounded-xl text-xs font-bold text-gray-300 transition"
            >
              Reset Mock Picks
            </button>
          )}
          <Link
            to="/trade-analyzer"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow transition flex items-center gap-1.5"
          >
            <span>⚖️</span> Trade Pick Analyzer
          </Link>
        </div>
      </div>

      {/* ── Draft Order & Mock Board ────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8 items-start">
        {/* Left Column: 1st Round Projected Draft Order (Picks 1–32) */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span>📋</span> Round 1 Projected Order (Picks 1–32)
            </h2>
            <span className="text-xs text-gray-400 font-mono">Reverse Win % Order</span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {draftOrderList.map(entry => {
                const p = entry.projectedProspect;
                return (
                  <div
                    key={entry.pick}
                    className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-3.5 sm:p-4 transition flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                    style={{ borderLeftWidth: '4px', borderLeftColor: entry.team.primaryColor || '#3b82f6' }}
                  >
                    {/* Pick # & Team */}
                    <div className="flex items-center gap-3.5 min-w-[200px]">
                      <div className="w-8 h-8 rounded-lg bg-gray-950 border border-gray-800 flex items-center justify-center font-mono font-black text-sm text-amber-400 shrink-0">
                        #{entry.pick}
                      </div>

                      <img
                        src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/${entry.team.abbreviation.toLowerCase()}.png&w=48&h=48`}
                        alt=""
                        className="w-9 h-9 object-contain shrink-0"
                        onError={e => { e.currentTarget.style.display = 'none'; }}
                      />

                      <div>
                        <Link
                          to={`/teams/${entry.team.id}`}
                          className="font-bold text-sm text-white hover:text-blue-400 transition"
                        >
                          {entry.team.name}
                        </Link>
                        <div className="text-[11px] text-gray-400 font-mono">
                          {entry.record} · Diff: {entry.diff > 0 ? `+${entry.diff}` : entry.diff}
                        </div>
                      </div>
                    </div>

                    {/* Team Needs Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 md:justify-center">
                      <span className="text-[10px] text-gray-500 font-semibold uppercase mr-1">Needs:</span>
                      {entry.needs.slice(0, 3).map((need, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded bg-gray-950 border border-gray-800 text-[10px] font-mono text-gray-300"
                        >
                          {need}
                        </span>
                      ))}
                    </div>

                    {/* Projected Mock Pick */}
                    <div className="bg-gray-950/80 border border-gray-850 p-2.5 rounded-lg flex items-center justify-between gap-3 min-w-[240px]">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono">
                            {p.position}
                          </span>
                          <span className="font-bold text-xs sm:text-sm text-gray-200">{p.name}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {p.college} · Comp: {p.comp}
                        </div>
                      </div>

                      <select
                        value={p.rank}
                        onChange={e => {
                          const chosen = TOP_2026_PROSPECTS.find(pr => pr.rank === Number(e.target.value));
                          if (chosen) handleAssignProspect(entry.pick, chosen);
                        }}
                        className="bg-gray-900 border border-gray-800 rounded px-2 py-1 text-[11px] text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 shrink-0"
                        title="Swap Mock Pick"
                      >
                        {TOP_2026_PROSPECTS.map(opt => (
                          <option key={opt.rank} value={opt.rank}>
                            #{opt.rank} {opt.name} ({opt.position})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Top Consensus 2026 Draft Board */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
          <div className="border-b border-gray-800 pb-3">
            <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
              <span>🌟</span> Top 2026 Big Board
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Consensus top 32 prospects with measurables, scouting blurbs & NFL comparisons
            </p>
          </div>

          {/* Search & Position Filter */}
          <div className="space-y-2.5">
            <input
              type="text"
              placeholder="Search prospect, college, or NFL comparison..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex flex-wrap gap-1">
              {['ALL', 'QB', 'WR', 'OT', 'EDGE', 'CB', 'DT', 'RB', 'TE', 'S'].map(pos => (
                <button
                  key={pos}
                  onClick={() => setPositionFilter(pos)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                    positionFilter === pos
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-950 text-gray-400 hover:text-white border border-gray-800'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          {/* Prospects List */}
          <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
            {filteredProspects.map(pr => (
              <div
                key={pr.rank}
                className="bg-gray-950/70 border border-gray-800/80 rounded-xl p-3.5 space-y-2 hover:border-gray-700 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded bg-gray-900 border border-gray-800 flex items-center justify-center text-xs font-mono font-bold text-amber-400 shrink-0">
                      {pr.rank}
                    </span>
                    <div className="truncate">
                      <h4 className="font-bold text-xs sm:text-sm text-white truncate">{pr.name}</h4>
                      <p className="text-[11px] text-gray-400 font-mono">
                        {pr.college} · {pr.height}, {pr.weight}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-mono font-bold shrink-0">
                    {pr.position}
                  </span>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">{pr.summary}</p>

                <div className="flex flex-wrap gap-1 pt-1">
                  {pr.strengths.map((str, sIdx) => (
                    <span
                      key={sIdx}
                      className="text-[10px] bg-gray-900 border border-gray-850 px-1.5 py-0.5 rounded text-gray-400"
                    >
                      ✓ {str}
                    </span>
                  ))}
                </div>

                <div className="pt-1.5 border-t border-gray-850 text-[11px] flex items-center justify-between text-gray-400">
                  <span>
                    Pro Comp: <strong className="text-gray-200">{pr.comp}</strong>
                  </span>
                  <span className="text-[10px] text-blue-400 font-mono">Consensus R1</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
