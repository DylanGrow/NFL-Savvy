import { useState, useEffect } from 'react';
import { BACKUP_APIS, sleeperApi } from '../lib/backupApis';

export default function ApiSources() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [sleeperState, setSleeperState] = useState<any>(null);
  const [testingSleeper, setTestingSleeper] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Data Sources & Backup APIs | NFL Hub';
  }, []);

  const handleTestSleeper = async () => {
    setTestingSleeper(true);
    setTestResult(null);
    try {
      const state = await sleeperApi.fetchState();
      setSleeperState(state);
      setTestResult('Success! Sleeper API responded in real-time without authentication.');
    } catch (err: any) {
      setTestResult(`Error connecting to Sleeper API: ${err.message}`);
    } finally {
      setTestingSleeper(false);
    }
  };

  return (
    <div className="app-container py-4 sm:py-8 text-gray-100 font-sans space-y-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">⚡</span>
          <h1 className="text-3xl font-extrabold tracking-tight">NFL Data Architecture & Backup APIs</h1>
        </div>
        <p className="text-gray-400 max-w-3xl leading-relaxed">
          The site uses ESPN's public endpoints as its primary data source. If ESPN experiences downtime, CORS blocks, or rate limits, 
          we have engineered fallback adapters across 4 production-grade alternative APIs.
        </p>
      </div>

      {/* Primary vs Backup Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 border border-blue-500/40 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Primary API</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold">ESPN Public API</h3>
          <p className="text-xs text-gray-400 mt-1">Live scores, team rosters, play-by-play, referee crews, standings</p>
          <div className="mt-3 text-xs text-gray-500 font-mono">site.api.espn.com</div>
        </div>

        <div className="bg-gray-900 border border-emerald-500/30 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Backup #1 (Best Free)</span>
            <span className="text-xs bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800">No Key</span>
          </div>
          <h3 className="text-lg font-bold">Sleeper API</h3>
          <p className="text-xs text-gray-400 mt-1">Full NFL player database, injuries, trending adds/drops, weekly stats</p>
          <div className="mt-3 text-xs text-gray-500 font-mono">api.sleeper.app/v1</div>
        </div>

        <div className="bg-gray-900 border border-purple-500/30 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Backup #2 (Analytics)</span>
            <span className="text-xs bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800">Open Data</span>
          </div>
          <h3 className="text-lg font-bold">nflverse / nflfastR</h3>
          <p className="text-xs text-gray-400 mt-1">Official referee logs, EPA, CPOE, OverTheCap contract data mirrors</p>
          <div className="mt-3 text-xs text-gray-500 font-mono">github.com/nflverse</div>
        </div>

        <div className="bg-gray-900 border border-amber-500/30 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Backup #3 & #4</span>
            <span className="text-xs bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800">Live / Odds</span>
          </div>
          <h3 className="text-lg font-bold">CBS Sports & Tank01</h3>
          <p className="text-xs text-gray-400 mt-1">Game-day scoreboards, down & distance, Vegas lines, referee crews</p>
          <div className="mt-3 text-xs text-gray-500 font-mono">cbssports.com / RapidAPI</div>
        </div>
      </div>

      {/* Interactive Live API Test Widget */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-900 to-gray-800 border border-gray-700/80 rounded-2xl p-6 mb-10 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>🔌</span> Live Backup Health Check: Sleeper API
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Verify live connectivity to the zero-auth Sleeper endpoint directly from your browser:
            </p>
          </div>
          <button
            onClick={handleTestSleeper}
            disabled={testingSleeper}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white font-medium text-sm rounded-lg transition-colors flex items-center gap-2 shadow"
          >
            {testingSleeper ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Pinging Sleeper...</span>
              </>
            ) : (
              <>
                <span>📡</span>
                <span>Test Live Ping</span>
              </>
            )}
          </button>
        </div>

        {testResult && (
          <div className={`p-3 rounded-lg text-xs mb-3 font-mono ${
            testResult.startsWith('Success') ? 'bg-emerald-950/70 border border-emerald-800 text-emerald-300' : 'bg-red-950/70 border border-red-800 text-red-300'
          }`}>
            {testResult}
          </div>
        )}

        {sleeperState && (
          <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 overflow-x-auto text-xs font-mono text-gray-300">
            <div className="text-gray-400 mb-2 font-sans font-bold">Returned NFL State Payload:</div>
            <pre>{JSON.stringify(sleeperState, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Deep Breakdown of 4 Backup APIs */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold border-b border-gray-800 pb-3">4 Backup APIs Detailed Specification</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {BACKUP_APIS.map((api, idx) => (
            <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-white">{api.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded font-semibold border ${
                    api.authRequired 
                      ? 'bg-amber-950/60 text-amber-300 border-amber-800' 
                      : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                  }`}>
                    {api.authRequired ? 'API Key Required' : '100% Free / No Key'}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-300 mb-4">
                  <div><strong className="text-gray-400">Provider:</strong> {api.provider}</div>
                  <div><strong className="text-gray-400">Rate Limit:</strong> {api.rateLimit}</div>
                  <div><strong className="text-gray-400">Best For:</strong> {api.bestFor}</div>
                  <div><strong className="text-gray-400">Base URL:</strong> <code className="bg-gray-950 px-1.5 py-0.5 rounded text-blue-400 text-xs font-mono">{api.baseUrl}</code></div>
                </div>

                <div className="border-t border-gray-800 pt-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Available Endpoints:</h4>
                  <div className="space-y-2">
                    {api.endpoints.map((ep, eIdx) => (
                      <div key={eIdx} className="bg-gray-950/80 p-2.5 rounded border border-gray-800/80 text-xs">
                        <div className="font-semibold text-blue-300 mb-0.5">{ep.name}</div>
                        <div className="font-mono text-gray-400 text-[11px] break-all">{ep.path}</div>
                        <div className="text-gray-400 mt-1">{ep.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
