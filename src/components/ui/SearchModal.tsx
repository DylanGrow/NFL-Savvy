import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SALARIES, formatSalary, PLAYER_METADATA } from '../../lib/salary';
import { fetchTeamsData, fetchRefereesData, fetchCoachesData } from '../../lib/data';
import type { Team, SearchResult } from '../../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [referees, setReferees] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTeamsData()
      .then(setTeams)
      .catch(() => {});

    fetchRefereesData()
      .then(setReferees)
      .catch(() => {});

    fetchCoachesData()
      .then(setCoaches)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const matched: SearchResult[] = [];

    // 1. Teams
    teams.forEach(t => {
      if (t.name.toLowerCase().includes(q) || t.abbreviation.toLowerCase().includes(q) || t.city.toLowerCase().includes(q)) {
        matched.push({
          type: 'team',
          id: t.id,
          name: t.name,
          subtitle: `${t.city} • ${t.conference} ${t.division}`,
          url: `/teams/${t.id}`
        });
      }
    });

    // 2. Players from database
    SALARIES.forEach(s => {
      const pInfo = PLAYER_METADATA[s.playerId];
      const name = pInfo?.name || `Player #${s.playerId}`;
      const pos = pInfo?.position || 'NFL';
      const abbr = pInfo?.teamAbbr || '';

      if (name.toLowerCase().includes(q) || pos.toLowerCase() === q || abbr.toLowerCase() === q) {
        matched.push({
          type: 'player',
          id: s.playerId,
          name: name,
          subtitle: `${pos} • ${abbr} • Cap: ${formatSalary(s.capHit)}`,
          url: `/players/${s.playerId}`
        });
      }
    });

    // 3. Coaches
    coaches.forEach(c => {
      const fullName = `${c.firstName} ${c.lastName}`;
      if (fullName.toLowerCase().includes(q) || c.role.toLowerCase().includes(q) || (c.teamName && c.teamName.toLowerCase().includes(q)) || (c.teamAbbr && c.teamAbbr.toLowerCase() === q)) {
        matched.push({
          type: 'coach',
          id: c.id,
          name: fullName,
          subtitle: `${c.role} • ${c.teamName || c.teamAbbr || 'NFL'}`,
          url: `/coaches`
        });
      }
    });

    // 4. Referees
    referees.forEach(r => {
      if (r.referee.toLowerCase().includes(q) || (r.jerseyNumber && r.jerseyNumber.includes(q))) {
        matched.push({
          type: 'coach',
          id: r.id,
          name: `Ref ${r.referee} #${r.jerseyNumber}`,
          subtitle: `Crew Chief • ${r.experience} yrs exp • Avg ${r.penaltyStats?.avgPenaltiesPerGame || 14} flags/gm`,
          url: `/referees`
        });
      }
    });

    // 5. Hub Navigation Shortcuts
    const HUB_PAGES = [
      { name: 'Injury Report & Medical Wire', keywords: ['injury', 'injuries', 'ir', 'medical', 'hurt'], subtitle: '32-Team Injury Wire, practice status & return dates', url: '/injuries' },
      { name: 'Trade Analyzer', keywords: ['trade', 'analyzer', 'picks', 'swap'], subtitle: 'Simulate blockbuster trades with cap impacts & draft picks', url: '/trade-analyzer' },
      { name: 'Head-to-Head Comparator', keywords: ['compare', 'comparator', 'h2h', 'versus', 'matchup'], subtitle: 'Compare players or franchises side-by-side', url: '/comparator' },
      { name: 'Depth Charts', keywords: ['depth', 'depth chart', 'string', 'starter'], subtitle: '1st/2nd/3rd string rosters across all 32 teams', url: '/depth-charts' },
      { name: '2026 Standings & Playoff Picture', keywords: ['standings', 'playoff', 'division', 'seed', 'race'], subtitle: 'Divisional races, wild card hunt & seeding', url: '/standings' },
      { name: 'Salaries & Cap Allocation', keywords: ['salary', 'salaries', 'cap', 'payroll', 'money', 'contract'], subtitle: 'Team cap space, contracts & top earners', url: '/salaries' },
      { name: 'Coaching Directory', keywords: ['coach', 'coaches', 'staff', 'coordinator'], subtitle: 'Head coaches, OCs, and DCs across all 32 franchises', url: '/coaches' },
      { name: 'Referees & Officiating Crews', keywords: ['ref', 'referee', 'referees', 'penalty', 'flags', 'crew'], subtitle: 'Crew chiefs, penalty tendencies & home win %', url: '/referees' },
    ];

    HUB_PAGES.forEach(page => {
      if (page.keywords.some(kw => kw.includes(q) || q.includes(kw)) || page.name.toLowerCase().includes(q)) {
        matched.unshift({
          type: 'team',
          id: page.url,
          name: `⚡ ${page.name}`,
          subtitle: page.subtitle,
          url: page.url
        });
      }
    });

    return matched.slice(0, 10);
  }, [query, teams, referees, coaches]);

  if (!isOpen) return null;

  const handleSelect = (url?: string) => {
    if (url) {
      navigate(url);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-gray-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center px-4 border-b border-gray-800 bg-gray-950/60">
          <span className="text-gray-400 mr-3 text-lg" aria-hidden="true">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 h-14 bg-transparent border-none outline-none text-gray-100 placeholder-gray-500 text-base"
            placeholder="Search players, teams, referees, positions (e.g. Mahomes, Chiefs, QB, Cheffers)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            onClick={onClose}
            className="text-xs px-2.5 py-1 text-gray-400 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors font-mono"
          >
            ESC
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {query.trim().length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              <p className="font-medium text-gray-400">Instant Global Search</p>
              <p className="text-xs mt-1">Search any player, team, referee crew, or position group</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              No matching records found for "{query}"
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((res, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(res.url)}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-800/80 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {res.type === 'team' ? '🛡️' : res.type === 'player' ? '🏈' : res.name.startsWith('Ref') ? '🦓' : '📋'}
                    </span>
                    <div>
                      <div className="font-semibold text-gray-100 group-hover:text-blue-400 transition-colors text-sm">
                        {res.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {res.subtitle}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 group-hover:text-gray-300">
                    Jump →
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
