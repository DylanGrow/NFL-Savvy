/**
 * Lite Privacy-Preserving Analytics (AdBlock Friendly)
 * 
 * - 0 Cookies
 * - 0 Third-party trackers (No Google Analytics, No Meta Pixel)
 * - 0 Canvas/Font fingerprinting
 * - 100% AdBlock compatible (never blocked or flagged)
 * - Strictly anonymous session counter stored in sessionStorage
 */

interface PageViewEvent {
  path: string;
  timestamp: number;
}

const STORAGE_KEY = 'nfl_hub_pv_stats';

export function trackPageView(path: string): void {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const history: PageViewEvent[] = raw ? JSON.parse(raw) : [];
    
    history.push({
      path,
      timestamp: Date.now()
    });

    // Keep last 25 local page views in current session only
    if (history.length > 25) {
      history.shift();
    }

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Fail silently in incognito or restricted storage environments
  }
}

export function getSessionPageViews(): number {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return 1;
    const history: PageViewEvent[] = JSON.parse(raw);
    return history.length;
  } catch {
    return 1;
  }
}
