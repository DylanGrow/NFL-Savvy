import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SALARIES, formatSalary } from '../../lib/salary';
import { fetchTeamsData, fetchRefereesData } from '../../lib/data';
import type { Team, SearchResult } from '../../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PLAYER_NAME_LOOKUP: Record<string, { name: string; position: string; teamAbbr: string }> = {
  '3139477': { name: 'Patrick Mahomes', position: 'QB', teamAbbr: 'KC' },
  '3918298': { name: 'Josh Allen', position: 'QB', teamAbbr: 'BUF' },
  '4241479': { name: 'Lamar Jackson', position: 'QB', teamAbbr: 'BAL' },
  '4360310': { name: 'Jalen Hurts', position: 'QB', teamAbbr: 'PHI' },
  '3054211': { name: 'Geno Smith', position: 'QB', teamAbbr: 'SEA' },
  '4697815': { name: 'C.J. Stroud', position: 'QB', teamAbbr: 'HOU' },
  '4040715': { name: 'Dak Prescott', position: 'QB', teamAbbr: 'DAL' },
  '3054220': { name: 'Jordan Love', position: 'QB', teamAbbr: 'GB' },
  '4567048': { name: 'Matthew Stafford', position: 'QB', teamAbbr: 'LAR' },
  '4360438': { name: 'Sam Darnold', position: 'QB', teamAbbr: 'MIN' },
  '3054288': { name: 'Stefon Diggs', position: 'WR', teamAbbr: 'HOU' },
  '4047646': { name: 'Keenan Allen', position: 'WR', teamAbbr: 'CHI' },
  '4241478': { name: 'Tyreek Hill', position: 'WR', teamAbbr: 'MIA' },
  '3054273': { name: 'Davante Adams', position: 'WR', teamAbbr: 'NYJ' },
  '4040570': { name: 'A.J. Brown', position: 'WR', teamAbbr: 'PHI' },
  '3054239': { name: 'Isiah Pacheco', position: 'RB', teamAbbr: 'KC' },
  '4040749': { name: 'Christian McCaffrey', position: 'RB', teamAbbr: 'SF' },
  '3054275': { name: 'Trey McBride', position: 'TE', teamAbbr: 'ARI' },
  '4040611': { name: 'Travis Kelce', position: 'TE', teamAbbr: 'KC' },
  '3054294': { name: 'Laremy Tunsil', position: 'OT', teamAbbr: 'HOU' },
  '4039348': { name: 'Danielle Hunter', position: 'DE', teamAbbr: 'HOU' },
  '4040557': { name: 'Odafe Oweh', position: 'OLB', teamAbbr: 'BAL' },
  '3054266': { name: 'Micah Parsons', position: 'LB', teamAbbr: 'DAL' },
  '4037571': { name: 'Darius Slay', position: 'CB', teamAbbr: 'PHI' },
  '4040618': { name: 'Kyle Hamilton', position: 'S', teamAbbr: 'BAL' },
  '3054258': { name: 'Harrison Butker', position: 'K', teamAbbr: 'KC' }
};

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [referees, setReferees] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTeamsData()
      .then(setTeams)
      .catch(() => {});

    fetchRefereesData()
      .then(setReferees)
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
      const pInfo = PLAYER_NAME_LOOKUP[s.playerId];
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

    // 3. Referees
    referees.forEach(r => {
      if (r.referee.toLowerCase().includes(q) || (r.jerseyNumber && r.jerseyNumber.includes(q))) {
        matched.push({
          type: 'coach',
          id: r.id,
          name: `Ref ${r.referee} #${r.jerseyNumber}`,
          subtitle: `Crew Chief • ${r.experience} yrs exp • Avg ${r.penaltyStats?.avgPenaltiesPerGame || 14} flags/gm`,
          url: `/games`
        });
      }
    });

    return matched.slice(0, 10);
  }, [query, teams, referees]);

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
                      {res.type === 'team' ? '🛡️' : res.type === 'player' ? '🏈' : '🦓'}
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
