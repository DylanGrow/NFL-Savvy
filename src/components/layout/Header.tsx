import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SearchModal } from '../ui/SearchModal';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Teams', path: '/teams' },
  { name: 'Players', path: '/players' },
  { name: 'Games', path: '/games' },
  { name: 'Salaries', path: '/salaries' },
  { name: 'Coaches', path: '/coaches' },
  { name: 'Standings', path: '/standings' },
  { name: 'Depth Charts', path: '/depth-charts' },
  { name: 'Trade Analyzer', path: '/trade-analyzer' },
  { name: 'H2H Compare', path: '/comparator' },
  { name: 'Referees', path: '/referees' },
  { name: 'APIs', path: '/apis' },
];

export function Header() {
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle escape key to close menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Accessible Skip to Content Link for Keyboard Users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-blue-600 focus:text-white focus:font-bold focus:rounded-lg focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      <header className="bg-gray-950/95 backdrop-blur border-b border-gray-800 sticky top-0 z-40 w-full transition-all">
        <div className="app-container">
          <div className="flex justify-between items-center h-16 sm:h-18">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link 
                to="/" 
                className="flex items-center gap-2 text-white font-extrabold text-lg sm:text-xl tracking-tight focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md p-1 -ml-1 touch-target group"
                aria-label="NFL Savvy Homepage"
              >
                <svg viewBox="0 0 64 64" className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 drop-shadow group-hover:scale-105 transition-transform" aria-hidden="true">
                  <path d="M32 3 C42 6.5 52 8 57 9.5 L57 31 C57 46.5 45.5 56.5 32 61.5 C18.5 56.5 7 46.5 7 31 L7 9.5 C12 8 22 6.5 32 3 Z" fill="#cbd5e1" />
                  <path d="M32 6.2 C40.8 9.2 49.5 10.5 53.8 11.8 L53.8 30.8 C53.8 44.3 43.7 53.2 32 57.8 C20.3 53.2 10.2 44.3 10.2 30.8 L10.2 11.8 C14.5 10.5 23.2 9.2 32 6.2 Z" fill="#013369" />
                  <path d="M32 6.2 C40.8 9.2 49.5 10.5 53.8 11.8 L53.8 20.5 C46 18 39 18 32 21 C25 18 18 18 10.2 20.5 L10.2 11.8 C14.5 10.5 23.2 9.2 32 6.2 Z" fill="#d50a0a" />
                  <path d="M10.2 20.5 C18 18 25 18 32 21 C39 18 46 18 53.8 20.5" fill="none" stroke="#ffffff" strokeWidth="1.8" />
                  <g transform="translate(32, 36) rotate(-32)">
                    <path d="M-16,0 C-10.5,-9.5 10.5,-9.5 16,0 C10.5,9.5 -10.5,9.5 -16,0 Z" fill="#b45309" stroke="#ffffff" strokeWidth="1.6" />
                    <line x1="-6" y1="0" x2="6" y2="0" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
                    <line x1="-3.5" y1="-2.5" x2="-3.5" y2="2.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="0" y1="-2.5" x2="0" y2="2.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="3.5" y1="-2.5" x2="3.5" y2="2.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                  </g>
                </svg>
                <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                  NFL Savvy
                </span>
                <span className="hidden xs:inline-block text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  2026
                </span>
              </Link>
            </div>

            {/* Desktop Navigation (Laptops, Desktops, Ultrawides 1280px+) */}
            <nav className="hidden xl:flex items-center space-x-1" aria-label="Main Navigation">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`px-2.5 py-2 text-xs 2xl:text-sm font-medium rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      isActive 
                        ? 'text-blue-400 bg-blue-500/10 font-semibold' 
                        : 'text-gray-300 hover:text-white hover:bg-gray-800/60'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* Tablet Navigation (iPad 768px - 1279px) */}
            <nav className="hidden md:flex xl:hidden items-center space-x-1" aria-label="Tablet Navigation">
              {navLinks.slice(0, 6).map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      isActive 
                        ? 'text-blue-400 bg-blue-500/10 font-bold' 
                        : 'text-gray-300 hover:text-white hover:bg-gray-800/60'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="px-2 py-1.5 text-xs font-medium text-gray-400 hover:text-white rounded-md hover:bg-gray-800/60 transition-colors flex items-center gap-1"
                aria-expanded={isMobileMenuOpen}
                aria-label="More navigation items"
              >
                <span>More</span>
                <span className="text-[10px]">▼</span>
              </button>
            </nav>

            {/* Right Action: Search Button */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2 text-gray-300 bg-gray-900 hover:bg-gray-850 border border-gray-700/80 hover:border-gray-500 rounded-lg px-3 py-2 text-xs sm:text-sm transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500 touch-target"
                aria-label="Search players, teams, coaches, and referees"
              >
                <span aria-hidden="true" className="text-sm">🔍</span>
                <span className="hidden sm:inline font-medium">Search</span>
                <kbd className="hidden lg:inline-block ml-1 text-[11px] font-mono text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700">
                  ⌘K
                </kbd>
              </button>

              {/* Mobile / Tablet Hamburger Button (min 44x44 touch target) */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="xl:hidden text-gray-300 hover:text-white bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-lg p-2.5 transition-colors touch-target focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
                aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              >
                <span className="text-lg leading-none select-none" aria-hidden="true">
                  {isMobileMenuOpen ? '✕' : '☰'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile & Tablet Dropdown Navigation Drawer */}
        {isMobileMenuOpen && (
          <div 
            id="mobile-menu"
            ref={menuRef}
            className="xl:hidden border-t border-gray-800/80 bg-gray-950/98 backdrop-blur-md shadow-2xl animate-in slide-in-from-top-2 duration-150 max-h-[calc(100vh-4rem)] overflow-y-auto touch-scroll"
          >
            <div className="app-container py-3 space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 px-3 py-1">
                NFL Hub Navigation
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.name}
                      to={link.path}
                      className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-colors touch-target ${
                        isActive 
                          ? 'bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/20' 
                          : 'text-gray-300 hover:bg-gray-800/80 hover:text-white'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span>{link.name}</span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </header>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
