import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Skeleton } from './components/ui/Skeleton';
import { trackPageView } from './lib/analytics';

// Lazy load all pages for code splitting (Lighthouse 100 performance)
const Home        = lazy(() => import('./pages/Home'));
const Teams       = lazy(() => import('./pages/Teams'));
const TeamDetail  = lazy(() => import('./pages/TeamDetail'));
const Players     = lazy(() => import('./pages/Players'));
const PlayerDetail= lazy(() => import('./pages/PlayerDetail'));
const Games       = lazy(() => import('./pages/Games'));
const GameDetail  = lazy(() => import('./pages/GameDetail'));
const Salaries    = lazy(() => import('./pages/Salaries'));
const Coaches     = lazy(() => import('./pages/Coaches'));
const Standings   = lazy(() => import('./pages/Standings'));
const DepthCharts = lazy(() => import('./pages/DepthCharts'));
const TradeAnalyzer = lazy(() => import('./pages/TradeAnalyzer'));
const HeadToHead  = lazy(() => import('./pages/HeadToHead'));
const ApiSources  = lazy(() => import('./pages/ApiSources'));
const Referees    = lazy(() => import('./pages/Referees'));
const NotFound    = lazy(() => import('./pages/NotFound'));

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
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/"                    element={<Home />} />
              <Route path="/teams"               element={<Teams />} />
              <Route path="/teams/:teamId"        element={<TeamDetail />} />
              <Route path="/players"             element={<Players />} />
              <Route path="/players/:playerId"   element={<PlayerDetail />} />
              <Route path="/games"               element={<Games />} />
              <Route path="/games/:gameId"       element={<GameDetail />} />
              <Route path="/salaries"            element={<Salaries />} />
              <Route path="/coaches"             element={<Coaches />} />
              <Route path="/standings"           element={<Standings />} />
              <Route path="/depth-charts"        element={<DepthCharts />} />
              <Route path="/trade-analyzer"      element={<TradeAnalyzer />} />
              <Route path="/comparator"          element={<HeadToHead />} />
              <Route path="/apis"                element={<ApiSources />} />
              <Route path="/referees"            element={<Referees />} />
              <Route path="*"                    element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
