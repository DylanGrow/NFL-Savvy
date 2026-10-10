import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-gray-950 border-t border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h2 className="text-gray-200 font-semibold text-lg">NFL Savvy 2026 Season</h2>
            <p className="mt-1 text-sm text-gray-500 max-w-md">
              Stats from ESPN. Salaries from public records. Not affiliated with the NFL.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            <Link to="/apis" className="hover:text-blue-400 transition-colors">
              Backup APIs & Data
            </Link>
            <Link to="/trade-analyzer" className="hover:text-blue-400 transition-colors">
              Trade Analyzer
            </Link>
            <Link to="/comparator" className="hover:text-blue-400 transition-colors">
              H2H Compare
            </Link>
            <span className="text-gray-600">|</span>
            <span className="text-xs text-gray-500">
              No Remote Fonts • AdBlock Friendly • Zero Trackers
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
