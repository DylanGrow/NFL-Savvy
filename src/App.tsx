import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect, ComponentType } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Skeleton } from './components/ui/Skeleton';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { trackPageView } from './lib/analytics';
import Home from './pages/Home';

// Resilient chunk loader that reloads once if a new deployment changed chunk hashes
function lazyWithRetry<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(async () => {
    const pageHasBeenForceRefreshed = sessionStorage.getItem('nfl_savvy_chunk_retry');
    try {
      const component = await factory();
      sessionStorage.removeItem('nfl_savvy_chunk_retry');
      return component;
    } catch (error) {
      if (!pageHasBeenForceRefreshed) {
        sessionStorage.setItem('nfl_savvy_chunk_retry', 'true');
        window.location.reload();
        return new Promise(() => {}); // Hold in suspense while page reloads
      }
      throw error;
    }
  });
}

// Lazy load secondary pages for performance optimization
const Teams       = lazyWithRetry(() => import('./pages/Teams'));
const TeamDetail  = lazyWithRetry(() => import('./pages/TeamDetail'));
const Players     = lazyWithRetry(() => import('./pages/Players'));
const PlayerDetail= lazyWithRetry(() => import('./pages/PlayerDetail'));
const Games       = lazyWithRetry(() => import('./pages/Games'));
const GameDetail  = lazyWithRetry(() => import('./pages/GameDetail'));
const Injuries    = lazyWithRetry(() => import('./pages/Injuries'));
const Salaries    = lazyWithRetry(() => import('./pages/Salaries'));
const Coaches     = lazyWithRetry(() => import('./pages/Coaches'));
const Standings   = lazyWithRetry(() => import('./pages/Standings'));
const DepthCharts = lazyWithRetry(() => import('./pages/DepthCharts'));
const TradeAnalyzer = lazyWithRetry(() => import('./pages/TradeAnalyzer'));
const HeadToHead  = lazyWithRetry(() => import('./pages/HeadToHead'));
const DraftOrder  = lazyWithRetry(() => import('./pages/DraftOrder'));
const Glossary    = lazyWithRetry(() => import('./pages/Glossary'));
const Stadiums    = lazyWithRetry(() => import('./pages/Stadiums'));
const ApiSources  = lazyWithRetry(() => import('./pages/ApiSources'));
const Referees    = lazyWithRetry(() => import('./pages/Referees'));
const NotFound    = lazyWithRetry(() => import('./pages/NotFound'));

function PageLoader() {
  return (
    <div className="p-8 space-y-4 max-w-6xl mx-auto">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function RouteTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);
  return null;
}

export default function App() {
  return (
    <Router>
      <RouteTracker />
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
        <Header />
        <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/"                    element={<Home />} />
                <Route path="/home"                element={<Home />} />
                <Route path="/index"               element={<Home />} />
                <Route path="/teams"               element={<Teams />} />
                <Route path="/teams/:teamId"        element={<TeamDetail />} />
                <Route path="/players"             element={<Players />} />
                <Route path="/players/:playerId"   element={<PlayerDetail />} />
                <Route path="/games"               element={<Games />} />
                <Route path="/games/:gameId"       element={<GameDetail />} />
                <Route path="/injuries"            element={<Injuries />} />
                <Route path="/salaries"            element={<Salaries />} />
                <Route path="/coaches"             element={<Coaches />} />
                <Route path="/standings"           element={<Standings />} />
                <Route path="/depth-charts"        element={<DepthCharts />} />
                <Route path="/trade-analyzer"      element={<TradeAnalyzer />} />
                <Route path="/comparator"          element={<HeadToHead />} />
                <Route path="/draft-order"         element={<DraftOrder />} />
                <Route path="/draft"               element={<DraftOrder />} />
                <Route path="/glossary"            element={<Glossary />} />
                <Route path="/stadiums"            element={<Stadiums />} />
                <Route path="/weather"             element={<Stadiums />} />
                <Route path="/apis"                element={<ApiSources />} />
                <Route path="/referees"            element={<Referees />} />
                <Route path="*"                    element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
