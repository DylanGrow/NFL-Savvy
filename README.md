# 🏈 NFL Savvy (2026 Season)

> **NFL Savant-level deep analytics meets OverTheCap/Spotrac salary cap intelligence, stadium weather forecasts, officiating crew tendencies, and 5-tier multi-API resilience.**

[![Deploy to GitHub Pages](https://github.com/DylanGrow/NFL-Savvy/actions/workflows/deploy.yml/badge.svg)](https://github.com/DylanGrow/NFL-Savvy/actions/workflows/deploy.yml)
[![Live Site](https://img.shields.io/badge/Demo-GitHub%20Pages-blue?style=flat&logo=github)](https://DylanGrow.github.io/NFL-Savvy/)
[![Lighthouse](https://img.shields.io/badge/Lighthouse-100%2F100-brightgreen?style=flat)](https://DylanGrow.github.io/NFL-Savvy/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 Core Features

- **💰 2026 Player Salaries & Contract Intelligence:**
  - Full breakdown against the **$305,000,000** 2026 NFL Salary Cap ceiling.
  - Cap hit, average annual value (AAV), total contract value, and guaranteed money.
  - **Contract Value vs. Performance Index:** Algorithmic rating identifying *Undervalued / High Surplus*, *Fair Value*, and *Overpaid* assets.
  - Positional spending SVG donut charts (QB, WR, OL, DL, DB, LB, RB, ST).

- **⚖️ Referees & Officiating Crew Tendencies:**
  - 17 active NFL crew chiefs tracked with complete 8-man officiating crews (Umpire, Down Judge, Line Judge, Field Judge, Side Judge, Back Judge, Replay Official).
  - Penalty tendencies, average flags per game, penalty yards, and home win % bias (Carl Cheffers, Shawn Hochuli, Brad Allen, Clete Blakeman, etc.).

- **🏟️ Live Scoreboards & Open-Meteo Stadium Weather:**
  - Live scores, quarter clocks, and week-by-week schedule (Weeks 1–18).
  - Live hourly weather forecasts for outdoor games via **Open-Meteo API** (Temperature, Feels Like, Wind Speed/Direction, Precipitation %).
  - `🏟️ Dome` climate-controlled badges for covered stadiums.

- **📋 32 Coaching Staff Directories:**
  - Head Coaches, Offensive Coordinators, Defensive Coordinators, and Special Teams Coordinators across all 32 franchises.
  - Historical career records, years of experience, and scheme tags.

- **🔄 Interactive Trade Analyzer:**
  - Two-team roster trade simulator with salary absorption feasibility checks.
  - Net cap impact and positional value weights (QB 1.5x, EDGE 1.2x, WR 1.0x, RB 0.8x).

- **⚡ Multi-Source API Fallback Engine:**
  - 5-tier failover architecture ensuring 100% uptime:
    1. **Primary:** ESPN Public REST API (Scoreboards, Rosters, Boxscores)
    2. **Fallback 1:** Sleeper API (1,000 req/min, free, open CORS, player IDs)
    3. **Fallback 2:** nflverse / nflfastR (GitHub Releases CDN, deep analytics, EPA/CPOE)
    4. **Fallback 3:** CBS Sports Mobile API (Live scoreboard feeds)
    5. **Fallback 4:** Tank01 / SportsDataIO (Boxscores & betting consensus)

- **🔍 Global Instant Search (<kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd>):**
  - Instant debounced search across all 32 franchises, 2,000+ players, and 17 referee crew chiefs.

---

## 🛡️ Production Standards & Lighthouse 100+

- **Zero Remote Fonts:** 100% native system typography (`-apple-system, BlinkMacSystemFont, Segoe UI, Roboto`) — zero render-blocking Google Fonts.
- **Zero Third-Party Trackers & AdBlock Friendly:** Lightweight, zero-cookie session analytics using in-memory and `sessionStorage` counters.
- **Strict Content Security Policy (CSP):** `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.
- **Progressive Web App (PWA):** Offline Service Worker with 27 precached assets via `vite-plugin-pwa` and Web App Manifest.
- **Full Responsive Matrix:**
  - **iPhone SE (375px):** Accessible 44px tap targets, slide-out drawer, touch-friendly tables.
  - **iPads & Tablets (768px–1024px):** Overflow dropdown navigation, multi-column card layout.
  - **Laptops (10"–14"):** Full 12-route header navigation, dense data views.
  - **Ultrawide Displays (21"–35"+ / 3440px):** Dynamic `app-container` scaling up to 2800px width.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (tested with Node 20 & 24)
- npm or pnpm

### Installation
```bash
# Clone the repository
git clone https://github.com/DylanGrow/NFL-Savvy.git
cd NFL-Savvy

# Install dependencies
npm install

# Start local development server
npm run dev
# or
npm start
```

Visit [http://localhost:5173/](http://localhost:5173/) in your browser.

### Building for Production
```bash
npm run build
npm run preview
```

---

## 🛠️ Tech Stack

- **Framework:** React 18 + TypeScript
- **Bundler:** Vite 5
- **Styling:** Tailwind CSS v3 (System font stack)
- **Routing:** React Router v6 (`HashRouter` for GitHub Pages zero-config compatibility)
- **State Management:** Zustand
- **PWA:** `vite-plugin-pwa` (Workbox)
- **APIs:** ESPN REST API, Open-Meteo Forecast API, Sleeper API, nflverse
- **Deployment:** GitHub Pages via GitHub Actions

---

## 📄 License

MIT © [Dylan Grow](https://github.com/DylanGrow)
