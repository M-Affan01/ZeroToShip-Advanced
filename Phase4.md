# Sentinel-Sync: Phase 4 — Campus Hub Dashboard & AI Assistant UI

---

## Table of Contents

- [Overview](#overview)
- [Phase 4 Objectives](#phase-4-objectives)
- [OST — Onboarding & System Truth](#ost--onboarding--system-truth)
- [FST — Framework, Stack & Tooling](#fst--framework-stack--tooling)
- [SST — Services, Streams & Topics](#sst--services-streams--topics)
- [LST — Libraries, Scripts & Tooling](#lst--libraries-scripts--tooling)
- [Architecture](#architecture)
- [Directory Structure](#directory-structure)
- [Environment Configuration](#environment-configuration)
- [Data Model — Static Mock Data](#data-model--static-mock-data)
- [State Management](#state-management)
- [Component Inventory](#component-inventory)
- [Dashboard Features](#dashboard-features)
- [AI Assistant & Chat Widget](#ai-assistant--chat-widget)
- [Toast Notification System](#toast-notification-system)
- [Settings & Preferences](#settings--preferences)
- [Responsive Layout & Accessibility](#responsive-layout--accessibility)
- [Phase 4 Backend Verification](#phase-4-backend-verification)
- [Testing](#testing)
- [Build & Verification](#build--verification)
- [Operational Commands](#operational-commands)
- [Troubleshooting](#troubleshooting)
- [Compliance Summary](#compliance-summary)
- [References](#references)

---

## Overview

**Phase 4** delivers the **Campus Hub Dashboard & AI Assistant** — a modern, real-world-style single-page web application (static UI) that unifies all Sentinel-Sync data streams into one polished interface. Built on **React 18 + Tailwind CSS + Framer Motion**, it renders the simulated live campus directory (equipment, cafe, transit), an AI FAQ chatbot with a floating launcher, real-time-style toast notifications, and a full preferences system.

### What Phase 4 Delivers

| Component | Description |
|-----------|-------------|
| **Application Shell** | Fixed left sidebar + sticky header + scrollable content (real-world layout) |
| **Dashboard View** | Overview summary cards, lightweight charts, searchable/filterable gallery |
| **Category Views** | Dedicated Equipment / Cafe / Transit tabs (sidebar + pills) showing only their items |
| **AI Assistant** | Keyword-matching FAQ chatbot with typing indicator, suggestion chips, chat history |
| **Floating Chat Widget** | Chat launcher FAB (open/close) available on every page |
| **Toast System** | Top-right notification toasts (4 variants) with pause / clear controls |
| **Preferences** | Theme (light/dark), compact mode, animations, refresh interval, toast duration, reset |
| **Persistence** | Chat + preferences saved to `localStorage` (`campus_hub_state`) |
| **Simulated Live Data** | Equipment/transit polling, periodic toast events, boot notification queue |
| **Phase 4 Backend Fixes** | Content-service health check (`SELECT 1`) + Redis pub/sub event consumer fixed |

---

## Phase 4 Objectives

| # | Objective | Status |
|---|-----------|--------|
| 1 | Build real-world application shell (fixed sidebar, header, content area) | ✅ |
| 2 | Add dashboard overview: total/summary cards + lightweight graphs | ✅ |
| 3 | Implement Equipment / Cafe / Transit category views showing only their items | ✅ |
| 4 | Implement search across equipment, cafe, and transit | ✅ |
| 5 | Add multi-filter panel (status, category, dietary, price, delay, capacity) | ✅ |
| 6 | Add Grid / List view-mode toggle | ✅ |
| 7 | Add per-category sort controls (field + direction) | ✅ |
| 8 | Add card detail modal for the active item | ✅ |
| 9 | Build AI Assistant FAQ chatbot with dynamic suggestion chips | ✅ |
| 10 | Add floating chat button (open/close) reusing shared chat state | ✅ |
| 11 | Add toast notification system (4 variants, max 3 active, pause/clear) | ✅ |
| 12 | Add preferences settings modal (theme, compact, animations, refresh, toast duration) | ✅ |
| 13 | Persist chat + preferences to LocalStorage | ✅ |
| 14 | Add simulated live polling for equipment and transit | ✅ |
| 15 | Align navbar (sidebar) gutters and header control heights | ✅ |
| 16 | Use the main page scrollbar for card lists (no nested card scrollbars) | ✅ |
| 17 | Validate chat input only after a submit attempt (no premature "Message cannot be empty") | ✅ |
| 18 | Fix content-service `/health` to report connected DB/Redis | ✅ |
| 19 | Fix Redis pub/sub event consumer via `asyncio.to_thread` | ✅ |
| 20 | Production build passes (Vite) | ✅ |

---

## OST — Onboarding & System Truth

### System Context

| Attribute | Specification |
|-----------|---------------|
| System Name | Sentinel-Sync Campus Intelligence Hub — Campus Hub Dashboard |
| Phase | Phase 4 — Frontend Dashboard & AI Assistant UI |
| Version | v4.0 |
| Date | 2026-08-02 |
| Dev Server | `http://localhost:5173` |
| Backend APIs | Auth `:8000`, Content Service `:8001`, AI Assistant `:8002` |
| Frontend Stack | React 18.3 SPA (Vite 5.4) |
| Rendering | Client-side static mock (no backend calls in the browser) |
| Persistence | Browser `localStorage` (key `campus_hub_state`) |

### Scope Boundaries

| In Scope (Phase 4) | Out of Scope (Phase 4) |
|---------------------|------------------------|
| Static mock data-driven dashboard UI | Live API consumption from the browser |
| Equipment / Cafe / Transit catalog + search + filters | Real WebSocket / SSE UI streaming |
| AI FAQ chatbot (keyword matching on mock FAQ) | Groq LLM integration in the browser |
| Floating chat launcher (open/close) | Multi-user chat sessions |
| Toast notification system with controls | Push notifications |
| Light / dark theme, compact mode, animations toggle | i18n multi-language runtime switch |
| LocalStorage persistence of chat + preferences | Server-side auth on the frontend |
| Simulated polling (visual live-update effect) | Real-time persistence layer |
| Dashboard overview charts (pure CSS/Tailwind) | Third-party charting library |

### Functional Domains

```
┌─────────────────────────────────────────────────────────────────────┐
│                   CAMPUS HUB DASHBOARD — PHASE 4                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  DASHBOARD   │  │   CATALOG    │  │  ASSISTANT   │             │
│  │  DOMAIN      │  │   DOMAIN     │  │  DOMAIN      │             │
│  │              │  │              │  │              │             │
│  │  • Overview  │  │  • Equipment │  │  • FAQ bot   │             │
│  │  • Summary   │  │  • Cafe      │  │  • Suggest.  │             │
│  │  • Charts    │  │  • Transit   │  │  • Typing    │             │
│  │  • Search    │  │  • Filter    │  │  • FAB launcher            │
│  │  • Tabs      │  │  • Sort      │  │  • History   │             │
│  └──────────────┘  │  • View mode │  └──────────────┘             │
│                    └──────────────┘                                │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  TOASTS      │  │ PREFERENCES  │  │  PERSISTENCE │             │
│  │  DOMAIN      │  │   DOMAIN     │  │   DOMAIN     │             │
│  │              │  │              │  │              │             │
│  │  • 4 variants│  │  • Theme     │  │  • LocalStorage            │
│  │  • Max 3     │  │  • Compact   │  │  • Hydration │             │
│  │  • Pause     │  │  • Animations│  │  • Defaults  │             │
│  │  • Clear     │  │  • Refresh   │  │  • Merge     │             │
│  │  • Boot queue│  │  • Duration  │  └──────────────┘             │
│  └──────────────┘  └──────────────┘                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Onboarding Quick Start

```bash
# 1. Install dependencies
cd frontend
npm install

# 2. Start the dev server (HMR enabled)
npm.cmd run dev            # Windows PowerShell — npm.cmd (npm.ps1 is blocked)

# 3. Open
#    http://localhost:5173

# 4. Production build
npm.cmd run build          # outputs to frontend/dist
```

> ⚠️ **Windows PowerShell note:** PowerShell blocks `npm.ps1`. Always use `npm.cmd`. Restart the dev server after editing `tailwind.config.js` (Tailwind config is **not** HMR'd and a stale server silently drops `dark:` rules).

---

## FST — Framework, Stack & Tooling

### Technology Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **UI Framework** | React | 18.3.1 | Component-based user interface |
| **DOM Renderer** | react-dom | 18.3.1 | Client-side rendering (`createRoot`) |
| **Build Tool** | Vite | 5.4.2 | Dev server + production bundler |
| **React Plugin** | @vitejs/plugin-react | 4.3.1 | JSX transform + Fast Refresh |
| **Styling** | Tailwind CSS | 3.4.10 | Utility-first styling, JIT |
| **PostCSS** | postcss | 8.4.41 | CSS processing pipeline |
| **Autoprefixer** | autoprefixer | 10.4.20 | Vendor prefixing |
| **Animation** | framer-motion | 12.43.0 | Motion components, layout animations, springs |
| **Icons** | lucide-react | 1.28.0 | SVG icon set (57 icons registered) |
| **Fonts** | Google Fonts (Inter + Outfit) | — | Sans + display typography |
| **Runtime** | Node.js | 18+ (Vite 5 requirement) | Package + tooling runtime |

### `package.json`

```json
{
  "name": "campus-hub-frontend",
  "version": "1.0.0",
  "type": "module",
  "description": "Campus Hub Dashboard & AI Assistant Interface - Phase 4 static mock UI",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "framer-motion": "^12.43.0",
    "lucide-react": "^1.28.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.41",
    "tailwindcss": "^3.4.10",
    "vite": "^5.4.2"
  }
}
```

### Vite Configuration (`vite.config.js`)

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
  },
});
```

### Tailwind Configuration (`tailwind.config.js`)

| Key | Value | Notes |
|-----|-------|-------|
| `darkMode` | `class` | Dark theme toggled by adding/removing `dark` on `<html>` |
| `content` | `./index.html`, `./src/**/*.{js,jsx}` | JIT scan scope |
| `fontFamily.sans` | `Inter`, system-ui | Body font |
| `fontFamily.display` | `Outfit`, `Inter` | Headings / display font |
| `boxShadow.card` | Soft layered shadow | Standard card elevation |
| `boxShadow.card-hover` | Indigo-tinted lift | Hover elevation |
| `boxShadow.glow` / `glow-dark` | Indigo glow ring | Light + dark glow |
| Keyframes | `toast-in`, `toast-out`, `typing-dot`, `pulse-live`, `modal-in` | Custom animations |
| Animations | `toast-in/out`, `typing-dot`, `pulse-live`, `modal-in` | Reusable Tailwind animations |

### Global Styles (`src/index.css`)

- **Base layer:** antialiased fonts, `scroll-behavior: smooth`, body background with fixed radial gradients (indigo / sky / rose ambient tint).
- **Dark mode:** `dark body` swaps to slate-950 with stronger ambient gradients.
- **Components layer:**
  - `.skip-link` — accessible skip-to-content link.
  - `.glass` — frosted glass surface (`bg-white/80 backdrop-blur-xl`, dark `bg-slate-900/70`).
  - `.scrollbar-thin` — thin indigo scrollbar used on the sidebar nav + settings modal.
- Custom `::selection` (indigo).

### `index.html` — CSP & Fonts

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  img-src 'self' https://images.unsplash.com data:;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  script-src 'self' 'unsafe-inline';
  connect-src 'self' ws: wss:;
  base-uri 'self'" />
```

| Directive | Allowlist | Purpose |
|-----------|-----------|---------|
| `img-src` | Unsplash + `data:` | All 24 card images are real `images.unsplash.com` URLs |
| `style-src` | Google Fonts + inline | Tailwind inline styles + font stylesheet |
| `font-src` | fonts.gstatic.com | Inter / Outfit webfonts |
| `connect-src` | `ws:` / `wss:` | Vite HMR websocket |
| `script-src` | `self` + inline | Vite module scripts |

### Global Colors & Theme

| Token | Light | Dark |
|-------|-------|------|
| Page background | `slate-100` | `slate-950` |
| Card background | `white` | `slate-900` |
| Panel surface | `bg-white/70` + blur | `bg-slate-950/60` + blur |
| Primary gradient | `from-indigo-600 via-blue-600 to-violet-600` | same |
| Text | `slate-800` | `slate-100` |
| Muted text | `slate-400/500` | `slate-400/500` |

---

## SST — Services, Streams & Topics

### Application Views (Routing Model)

The app uses a lightweight **view router** driven by `state.ui.activeView` (no react-router). The sidebar and header dispatch `UI_SET_ACTIVE_VIEW`.

| View | Key | Content |
|------|-----|---------|
| **Dashboard** | `'dashboard'` | `DashboardHero` + `Dashboard` (Overview → tabs/search → gallery) |
| **AI Assistant** | `'assistant'` | `AssistantHero` + `AIAssistant` (full-width `max-w-4xl` page) |

Category scoping within the dashboard is driven by `state.ui.selectedCategory`:

| Category | `selectedCategory` | Shown sections |
|----------|--------------------|----------------|
| All | `'all'` | Overview (stats + charts) + Equipment + Cafe + Transit |
| Equipment | `'equipment'` | Equipment section only |
| Cafe | `'cafe'` | Cafe section only |
| Transit | `'transit'` | Transit section only |

### Service Layer — Components (services)

| Service (Component) | File | Responsibility |
|---------------------|------|----------------|
| **App shell** | `App.jsx` | Sidebar + header + main; ambient blobs; heroes; page transitions; mounts modal, toasts, chat widget |
| **Sidebar** | `components/Sidebar.jsx` | Fixed desktop nav (`lg:`), mobile slide-in drawer; brand, grouped nav, system status card |
| **Header** | `components/Header.jsx` | Sticky top bar: brand + live status, auto-refresh toggle, settings modal trigger, theme switch, mobile hamburger |
| **Dashboard** | `components/Dashboard.jsx` | Overview (conditional), category tabs, search, toolbar (filters/view/sort), gallery sections |
| **OverviewStats** | `components/OverviewStats.jsx` | 4 summary cards + 3 charts (equipment status bar, cafe donut, transit delay bars) |
| **AIAssistant** | `components/AIAssistant.jsx` | Chat panel: header (bell/trash), message feed, suggestions, typing indicator, input form |
| **ChatWidget** | `components/ChatWidget.jsx` | Floating FAB + panel (open/close, Escape to close) reusing `AIAssistant` |
| **ToastContainer** | `components/ToastContainer.jsx` | Fixed top-right toast stack with pause/resume + clear-all controls |
| **CardDetailModal** | `components/CardDetailModal.jsx` | Detail dialog for the active card (image header + detail rows + close) |
| **Icon** | `components/Icon.jsx` | Lucide registry wrapper (57 icons) |

### State Service — `AppContext` (React Context + useReducer)

**Store slices (`INITIAL_STATE`):**

| Slice | Shape | Purpose |
|-------|-------|---------|
| `data` | `{ equipment[], cafe[], transit[], faq[] }` | Static mock data (loaded on mount) |
| `ui` | category, activeView, searchQuery, activeCardId, modal, loading, viewMode, lastUpdated | View + selection state |
| `chat` | messages[], isTyping, inputValue, messageCount, suggestions[], unreadCount | Chat conversation |
| `toasts` | queue[], activeToasts[], maxActive=3, isPaused, totalDelivered, bootQueue | Notification system |
| `filters` | equipmentStatus, cafeCategory, transitType, priceRange, dietaryRestrictions, delayThreshold, capacityThreshold | Multi-filter state |
| `preferences` | theme, autoRefresh, refreshInterval, toastDuration, defaultCategory, compactMode, showAnimations, notificationSound, language | User preferences |

**Sub-reducers (`rootReducer` dispatch routing):**

| Prefix | Reducer | Handles |
|--------|---------|---------|
| `UI_` | `uiReducer` | Category, view, search, card modal, view mode, lastUpdated |
| `CHAT_` | `chatReducer` | Messages, typing, input, suggestions, unread |
| `TOAST_` | `toastReducer` | Add/dismiss/activate/pause/resume/clear-all |
| `FILTER_` | `filterReducer` | Toggle arrays + range/threshold setters + clear |
| `PREFERENCE_` | `preferenceReducer` | Theme, auto-refresh, interval, duration, compact, animations, reset |
| (default) | `dataReducer` | LOAD + simulated poll updates |
| composite | — | `COMPOSITE_UPDATE_DATA`, `COMPOSITE_REFRESH_ALL` |

**Action creators exposed by `useApp()` (~30):**
`setSelectedCategory`, `setActiveView`, `setSearchQuery`, `setActiveCard`, `toggleCardModal`, `setViewMode`, `setChatInput`, `setChatFocus`, `clearChatHistory`, `clearUnread`, `setChatSuggestions`, `addToast`, `dismissToast`, `clearAllToasts`, `pauseToasts`, `resumeToasts`, `simulateToast`, `toggleFilterEquipment`, `toggleFilterCafe`, `toggleFilterTransit`, `toggleFilterDietary`, `setPriceRange`, `setDelayThreshold`, `setCapacityThreshold`, `clearFilters`, `toggleTheme`, `toggleAutoRefresh`, `toggleCompact`, `toggleAnimations`, `setRefreshInterval`, `setToastDuration`, `resetPreferences`, `handleSendMessage`.

### Data Streams (simulated "live" behavior)

| Stream | Source | Interval | Effect |
|--------|--------|----------|--------|
| Static data load | `mockData.js` | On mount | Dispatches `EQUIPMENT_LOAD`, `CAFE_LOAD`, `TRANSIT_LOAD`, `FAQ_LOAD` |
| Equipment poll | `AppContext` interval | `preferences.refreshInterval` (default 30s) | Re-rolls equipment status randomly |
| Transit poll | `AppContext` interval | 45s | Re-rolls delay/capacity/alerts |
| Toast events | `AppContext` interval | 15s | `ToastLogic.generateMockEvents` → `TOAST_ADD` |
| Boot toasts | `toasts.bootQueue` | Staggered 1.4s each | Pre-defined queue fired on mount |
| Theme sync | `useEffect` | On theme change | Toggles `dark` class on `<html>` |
| Persistence | `useEffect` | On prefs/chat change | Writes `{preferences, chat}` to `localStorage` |
| Hydration | `loadPersistedState()` | On provider init | Merges saved prefs/chat over defaults (system dark pref fallback) |

### Event Topics (Redis — Phase 4 backend)

Phase 4 also verifies the backend event bus consumed by the content service:

| Channel | Publisher | Consumed by |
|---------|-----------|-------------|
| `content.events` | Content Service | `event_consumer.py` (log + handle) |
| `equipment.events` | Content Service | `event_consumer.py` (log + handle) |

Subscription is now driven through a synchronous Redis pub/sub wrapped with `asyncio.to_thread` so the async loop is not blocked. Startup logs show `Subscribed to channel: content.events / equipment.events` and `Event consumer started`.

### Navigation Topics (Sidebar)

| Group | Item | Action |
|-------|------|--------|
| Overview | Dashboard | `setSelectedCategory('all')` + `setActiveView('dashboard')` |
| Explore | Equipment / Cafe / Transit | `setSelectedCategory(...)` + `setActiveView('dashboard')` |
| Assist | AI Assistant | `setActiveView('assistant')` |
| Header | ☰ hamburger | Opens mobile drawer (mobile only) |

---

## LST — Libraries, Scripts & Tooling

### Logic Libraries (`src/logic/` — pure functions, no React)

| Module | Methods | Purpose |
|--------|---------|---------|
| **EquipmentLogic** | `categorizeByStatus`, `getByCategory`, `isAvailable`, `getStatusPriority`, `sortByStatusAndName`, `getStatusColor`, `getStatusIcon`, `formatLocation` | Equipment domain helpers |
| **CafeLogic** | `processMenu`, `filterByDietary`, `filterByPriceRange`, `filterByCategory`, `isAvailable`, `getDietaryBadges`, `formatPrice`, `calculatePriceWithTax`, `getCategoryIcon` | Cafe menu domain helpers |
| **TransitLogic** | `processTransit`, `getCapacityLevel`, `getCapacityColor`, `getCapacityEmoji`, `formatDelay`, `getDelayColor`, `calculateETA`, `formatETA`, `getTransitIcon` | Transit domain helpers |
| **StatusLogic** | `getEquipmentStatusInfo`, `getCapacityStatusInfo`, `getDelayStatusInfo`, `getAvailabilityStatusInfo` | Status → label/color/icon mapping |
| **FormattingLogic** | `formatDate`, `getRelativeTime`, `truncateText`, `capitalizeWords`, `formatLocation`, `formatEquipmentCategory`, `formatCafeCategory`, `formatTransitType`, `formatNumber`, `formatPercentage`, `getInitials` | Formatting utilities |
| **SearchLogic** | `searchAll`, `searchEquipment`, `searchCafe`, `searchTransit` | Search filtering (unused directly; selectors handle it) |
| **FilterLogic** | `applyFilters`, `hasActiveFilters`, `getActiveFilterCount` | Filter application + badge counts |
| **SortingLogic** | `sortEquipment`, `sortCafeItems`, `sortTransitLines`, `sortMessages`, `getDefaultSort` | Sort helpers |
| **ChatBotLogic** | `processQuery`, `normalizeText`, `findBestFAQMatch`, `checkContext`, `getFollowUpResponse`, `getSuggestedQuestions`, `getPopularQuestions`, `getFallbackResponse`, `simulateTypingDelay`, `truncateResponse`, `formatResponse` | FAQ chat brain |
| **ToastLogic** | `createToast`, `getToastColor`, `getToastIcon`, `generateMockEvents`, `calculateProgress`, `isNearExpiration` | Toast factory + mock events |
| **ValidationLogic** | `validateSearchQuery`, `validateChatInput` | Input validation (chat + search) |

### Data Library (`src/data/mockData.js`)

| Export | Count | Contents |
|--------|-------|----------|
| `EQUIPMENT_DATA` | 8 | `eq-001…eq-008` — laptops, projectors, cameras, audio; statuses: available/in-use/maintenance/reserved |
| `CAFE_DATA` | 10 | `cafe-001…cafe-010` — breakfast/lunch/beverage/snack/special with dietary tags + prices |
| `TRANSIT_DATA` | 6 | `transit-001…transit-006` — Blue/Green/Red/Metro/Night/Express lines with delay, capacity, route, alerts |
| `FAQ_DATA` | 15 | `faq-001…faq-015` — equipment/facilities/dining/transport categories |
| `TOAST_QUEUE` | 4 | `toast-001…toast-004` — boot notification sequence |

> **Data contract:** 24 catalog items (8+10+6) ↔ exactly 24 unique `imageUrl` keys (1 per card, all real Unsplash URLs).

### Selectors (`src/selectors.js`)

| Selector | Purpose |
|----------|---------|
| `getFilteredData(state)` | Category + search + filter pipeline returning `{equipment, cafe, transit}` |
| `getQuickStats(state)` | Counts: available/total equipment & cafe, transit delays, alerts, chat counters |
| `getSystemStatus(state)` | Health: `isHealthy`, `hasAlerts`, `dataFreshness`, `totalItems` |

### Icon Registry (`components/Icon.jsx`)

57 registered Lucide icons incl. `laptop`, `projector`, `camera`, `audio`, `coffee`, `popcorn`, `star`, `utensils`, `bus`, `train`, `shuttle`, `car`, `bot`, `graduation-cap`, `search`, `send`, `arrow-up/down`, `sliders-horizontal`, `settings`, `menu`, `list`, `layout-grid`, `sparkles`, `moon`, `sun`, `refresh`, `pause`, `x`, `bell`, `siren`, `check-circle`, `x-circle`, `alert-triangle`, `wrench`, `pin`, `clock`, `radio`, `home`, `route`, `trash`, `zap`, `leaf`, `ban`, `loader`, `info`, `help`, `dot`, `shield-check`, `sunrise`.

### Scripts & Tooling

| Script | Command | Purpose |
|--------|---------|---------|
| dev | `npm.cmd run dev` | Vite dev server (port 5173, HMR) |
| build | `npm.cmd run build` | Production bundle to `frontend/dist` |
| preview | `npm.cmd run preview` | Preview the production build locally |

### Testing Libraries / Approach

| Tool | Purpose |
|------|---------|
| `curl.exe` / `Invoke-WebRequest` | Dev-server + backend API smoke tests (use `curl.exe` for backend — PowerShell `Invoke-RestMethod` mangles auth headers) |
| Vite build | Compile-time verification (JSX correctness, imports, CSS) |
| Manual UI walkthrough | Visual verification at desktop + mobile widths |
| `docker compose` + `docker logs` | Backend container health + event consumer verification |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                CAMPUS HUB DASHBOARD — PHASE 4 FRONTEND                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                        <AppProvider>  (context + useReducer)            │
│                              │                                          │
│                   ┌──────────▼──────────┐                               │
│                   │        <App/>       │                               │
│                   └──────────┬──────────┘                               │
│                              │                                          │
│         ┌────────────────────┼────────────────────┐                     │
│         ▼                    ▼                    ▼                     │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐             │
│  │  <Sidebar/> │      │  <Header/>  │      │   <main>    │             │
│  │  fixed left │      │  sticky top │      │  scrollable │             │
│  │  (desktop)  │      │  + settings │      │  content    │             │
│  └─────────────┘      │  modal      │      │  max-w-7xl  │             │
│                       └─────────────┘      └─────┬───────┘             │
│                                                  │                     │
│                                    activeView === 'dashboard'?          │
│                                     ┌───────────────┴──────────┐        │
│                                     ▼                          ▼        │
│                          ┌────────────────────┐      ┌─────────────────┐│
│                          │ <DashboardHero/>   │      │ <AssistantHero/>││
│                          │ <Dashboard/>       │      │  <AIAssistant/> ││
│                          │  ├ <OverviewStats/>│      │  max-w-4xl page ││
│                          │  ├ tabs + search   │      └─────────────────┘│
│                          │  ├ filters panel   │                         │
│                          │  ├ toolbar (grid/  │                         │
│                          │  │   list, sort)   │                         │
│                          │  └ gallery sections│                         │
│                          └────────────────────┘                         │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Global overlays:                                                │   │
│  │  • <CardDetailModal/>  (z-40)   • <ToastContainer/>  (z-50)     │   │
│  │  • <ChatWidget/> FAB + panel     (z-40, bottom-right)            │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Data: mockData.js ─► dataReducer (LOAD) ─► selectors ─► components     │
│  Simulated live: AppContext timers ─► SIMULATE_POLL / TOAST_ADD         │
│  Persistence:   localStorage 'campus_hub_state' (prefs + chat)          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
mockData.js ──► AppProvider (useReducer) ──► state
                       │
                       ├── selectors.js ──► Dashboard / Header / Sidebar
                       ├── logic/* ──► cards, chat, toasts, filters, sort
                       ├── timers ──► simulated polling / toasts
                       └── localStorage ──► persistence + hydration
```

---

## Directory Structure

```
frontend/
├── index.html                    # Entry HTML + CSP + Google Fonts
├── package.json                  # Deps + scripts
├── vite.config.js                # Vite + React plugin + port 5173
├── tailwind.config.js            # darkMode class, fonts, shadows, keyframes
├── postcss.config.js             # Tailwind + autoprefixer
├── dist/                         # Production build output
└── src/
    ├── main.jsx                  # ReactDOM.createRoot + <AppProvider>
    ├── App.jsx                   # Shell: Sidebar + Header + main + overlays
    ├── index.css                 # Tailwind layers + global styles
    ├── selectors.js              # Derived state selectors
    ├── data/
    │   └── mockData.js           # Equipment, cafe, transit, FAQ, toast queue
    ├── context/
    │   ├── AppContext.jsx        # Provider, action creators, timers, persistence
    │   └── reducers.js           # INITIAL_STATE + 6 sub-reducers + rootReducer
    ├── logic/                    # 11 pure-logic modules (see LST)
    │   ├── index.js
    │   ├── equipmentLogic.js
    │   ├── cafeLogic.js
    │   ├── transitLogic.js
    │   ├── statusLogic.js
    │   ├── formattingLogic.js
    │   ├── searchLogic.js
    │   ├── filterLogic.js
    │   ├── sortingLogic.js
    │   ├── chatBotLogic.js
    │   ├── toastLogic.js
    │   └── validationLogic.js
    └── components/
        ├── Sidebar.jsx           # Desktop nav + mobile drawer
        ├── Header.jsx            # Sticky header + settings modal
        ├── Dashboard.jsx         # Overview, tabs, search, toolbar, gallery
        ├── OverviewStats.jsx     # Summary cards + charts
        ├── AIAssistant.jsx       # Chat panel (shared state)
        ├── ChatWidget.jsx        # Floating chat FAB
        ├── ToastContainer.jsx    # Toast stack + controls
        ├── CardDetailModal.jsx   # Detail dialog
        └── Icon.jsx              # Icon registry wrapper
```

---

## Environment Configuration

### Frontend (no env file required)

| Setting | Default | Notes |
|---------|---------|-------|
| Dev port | `5173` | `vite.config.js` |
| Vite HMR | enabled | WebSocket allowed by CSP |
| Tailwind dark mode | `class` | Toggled by theme preference |
| Storage key | `campus_hub_state` | LocalStorage persistence |

### Backend `.env` (verified by Phase 4 backend fixes)

```env
POSTGRES_USER=sentinel_admin
POSTGRES_PASSWORD=S3nt1n3l#2026
POSTGRES_DB=sentinel_sync
DATABASE_URL=postgresql://sentinel_admin:S3nt1n3l#2026@localhost:5432/sentinel_sync
SECRET_KEY=your_jwt_secret_key_here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7
REDIS_HOST=redis-event-bus
REDIS_PORT=6379
REDIS_DB=0
MAX_FAILED_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
CORS_ORIGINS=*
RATE_LIMIT_PER_MINUTE=5
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
MILVUS_HOST=milvus
MILVUS_PORT=19530
MILVUS_COLLECTION=campus_guidelines
EMBEDDING_MODEL=text-embedding-3-small
VECTOR_TOP_K=5
SIMILARITY_THRESHOLD=0.65
```

### Port Allocation

| Service | Host Port | Purpose |
|---------|-----------|---------|
| Vite dev server | 5173 | Frontend |
| Auth API | 8000 | REST auth |
| Content Service | 8001 | CRUD |
| AI Assistant | 8002 | AI |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Event bus |

---

## Data Model — Static Mock Data

### Equipment (`EQUIPMENT_DATA`, 8 items)

| Field | Type | Example |
|-------|------|---------|
| `id` | string | `eq-001` |
| `name` | string | "Dell XPS 15 Laptop" |
| `category` | enum | `laptop` / `projector` / `camera` / `audio` |
| `status` | enum | `available` / `in-use` / `maintenance` / `reserved` |
| `location` | string | "Tech Hub - Library" |
| `lastUpdated` | string | ISO date |
| `imageUrl` | string | Unsplash URL |

### Cafe (`CAFE_DATA`, 10 items)

| Field | Type | Example |
|-------|------|---------|
| `id` | string | `cafe-001` |
| `name` | string | "Veggie Burrito Bowl" |
| `category` | enum | `breakfast` / `lunch` / `beverage` / `snack` / `special` |
| `price` | number | `6.5` |
| `available` | boolean | `true` |
| `dietary` | array | `['vegetarian']` |
| `description` | string | text |
| `imageUrl` | string | Unsplash URL |

### Transit (`TRANSIT_DATA`, 6 items)

| Field | Type | Example |
|-------|------|---------|
| `id` | string | `transit-001` |
| `name` | string | "Blue Line - Campus Express" |
| `type` | enum | `bus` / `train` / `shuttle` |
| `direction` | enum | `inbound` / `outbound` |
| `delay` | number | minutes (0–12) |
| `capacity` | number | 0–100 (%) |
| `route` | array | stop names |
| `alerts` | array | alert strings |
| `imageUrl` | string | Unsplash URL |

### FAQ (`FAQ_DATA`, 15 items)

| Field | Type | Example |
|-------|------|---------|
| `id` | string | `faq-001` |
| `category` | enum | `equipment` / `facilities` / `dining` / `transport` |
| `question` | string | "How do I check out equipment?" |
| `answer` | string | Answer text |
| `keywords` | array | matching keywords |

### Toast Queue (`TOAST_QUEUE`, 4 items)

| Field | Type | Example |
|-------|------|---------|
| `id` | string | `toast-001` |
| `type` | enum | `success` / `info` / `warning` / `error` |
| `title` | string | toast title |
| `message` | string | toast body |
| `timestamp` | string | ISO |

---

## State Management

### Initial State

```js
{
  data:   { equipment: [], cafe: [], transit: [], faq: [] },
  ui:     { selectedCategory: 'all', activeView: 'dashboard', searchQuery: '',
            activeCardId: null, isCardModalOpen: false, isLoading: false,
            viewMode: 'grid', lastUpdated: <now> },
  chat:   { messages: [greeting, demo Q, demo A], isTyping: false, inputValue: '',
            messageCount: 3, lastMessageTimestamp: null, isInputFocused: false,
            suggestionIndex: 0, unreadCount: 0, suggestions: [] },
  toasts: { queue: [], activeToasts: [], maxActive: 3, isPaused: false,
            totalDelivered: 0, lastTriggered: null, bootQueue: TOAST_QUEUE },
  filters:{ equipmentStatus: null, cafeCategory: null, transitType: null,
            priceRange: null, dietaryRestrictions: null,
            delayThreshold: null, capacityThreshold: null },
  preferences: { theme: 'light', autoRefresh: true, refreshInterval: 30,
            toastDuration: 4000, defaultCategory: 'all', compactMode: false,
            showAnimations: true, notificationSound: true, language: 'en' }
}
```

### Persistence & Hydration

- **Write:** `localStorage['campus_hub_state'] = { preferences, chat }` on every prefs/chat change.
- **Read:** `loadPersistedState()` validates shape (must be an object; preferences must contain `theme`), otherwise returns `null`.
- **Merge:** saved preferences/chat are spread over defaults, so older saved chats without `suggestions` are safe.
- **Fallback:** if no saved state and the OS prefers dark → start in dark mode.

### Simulated Polling

| Reducer | Behavior |
|---------|----------|
| `EQUIPMENT_SIMULATE_POLL` | Re-rolls each item's status (`available` 55%, `in-use` 20%, `reserved` 15%, `maintenance` 10%) and stamps `lastUpdated` |
| `TRANSIT_SIMULATE_POLL` | Re-rolls `delay` (0–12), `capacity` (0–95), and `alerts` (delay ≥ 5 ⇒ traffic alert) |

---

## Component Inventory

### App.jsx — Shell

- Ambient background blobs (3 animated gradients).
- `skip-link` (a11y).
- `flex min-h-screen`: `<Sidebar/>` + content column (`lg:pl-64`).
- `<Header onMenuClick>` to open mobile drawer.
- `<main>`: `max-w-7xl`, page transitions via `AnimatePresence mode="wait"` keyed on `activeView`.
- Dashboard page: `<DashboardHero/>` (gradient banner) + `<Dashboard/>` panel.
- Assistant page: `<AssistantHero/>` + `<AIAssistant/>` in `max-w-4xl`.
- Footer with attribution.
- Global overlays: `<CardDetailModal/>`, `<ToastContainer/>`, `<ChatWidget/>`.

### Sidebar.jsx

- Desktop: `fixed inset-y-0 left-0 w-64 lg:block`.
- Mobile: slide-in drawer (`w-72`) + backdrop; header hamburger opens it.
- **NAV_GROUPS**: Overview (Dashboard) · Explore (Equipment, Cafe, Transit) · Assist (AI Assistant).
- Nav item → `setSelectedCategory` + `setActiveView` + close drawer (mobile).
- Active detection: assistant view for AI item; `activeView==='dashboard' && selectedCategory===item.category` otherwise.
- Brand block (`px-4` gutter) + system status card (live/degraded + refresh interval).

### Header.jsx

- Sticky top bar (`backdrop-blur`), `max-w-7xl` aligned with main.
- Left: hamburger (mobile), logo, brand title (gradient text), live pulse + "Updated X ago".
- Right controls (uniform `h-9`): Auto-refresh toggle · Settings (gear, amber dot when non-default) · Theme switch (`role="switch"`).
- Settings modal (z-50): Behavior (compact, animations) · Refresh & notifications (interval 15/30/45/60s, toast duration) · Reset defaults.

### Dashboard.jsx

- Conditional `<OverviewStats/>` on `selected === 'all'`.
- **Category tabs** (`role="tablist"`): All / Equipment / Cafe / Transit with sliding `layoutId="active-tab"` pill.
- **Search** input with icon + conditional "Clear".
- **Toolbar**: Filters button (active count badge), Grid/List segmented toggle, per-category sort select + direction button (shown when a specific category is selected).
- **Filter panel** (`filtersOpen`): equipment status chips, cafe categories, transit types, dietary chips, price range slider, delay threshold, capacity threshold, active count, Reset.
- **Gallery**: three sections (Equipment Availability / Cafe Menu / Transit Lines), each `GallerySection` with count badge; grid (`md:grid-cols-2 lg:grid-cols-3`) or list (`grid-cols-1`); cards wrapped in `motion.div` `layout` inside `AnimatePresence mode="popLayout"`.
- **Empty states** for no-match / no-filters.

### OverviewStats.jsx

- **Summary cards (4):** Equipment `available/total`, Cafe `in stock/total`, Transit `on-time/total`, Campus services `total` + FAQ count. Clickable → jumps to the matching tab (`onSelect`).
- **Charts (3):**
  - Equipment by status — animated stacked horizontal bar + legend chips.
  - Cafe menu mix — conic-gradient donut (center total) + legend.
  - Transit delays — animated per-line bars (height = delay) + `m` labels.
- All charts use pure Tailwind/framer-motion (no chart library). `min-w-0` + `overflow-hidden` prevent overflow.

### AIAssistant.jsx

- Panel: header (bot avatar, "AI Campus Assistant", "Online · FAQ knowledge base", bell with unread badge, trash to clear).
- Message feed: bubble variants (spring), user (indigo gradient) vs AI (white ring) vs system; timestamps.
- Suggestion chips: dynamic from `chat.suggestions` (set after each AI reply) + static defaults.
- Typing indicator (3 bouncing dots) via `chat.isTyping`.
- Input form: validation via `ValidationLogic.validateChatInput`; **error only after a failed submit** (`showError`), max 500 chars counter, "Press Enter to send" hint, char counter.

### ChatWidget.jsx

- FAB bottom-right (z-40): gradient bot icon, pulsing ring, green online dot; toggles to ✕ when open.
- Panel: `fixed bottom-24 right-4 w-[calc(100vw-2rem)] max-w-sm h-[min(72vh,34rem)]` with spring scale/fade (origin bottom-right).
- Reuses `<AIAssistant/>` → **shared chat state** (conversation persists across widget, page, split panel).
- `Escape` closes.

### ToastContainer.jsx

- Fixed top-right (z-50), `max-w-sm`, stack of up to **3** active toasts.
- Variants (4): success / info / warning / error with icons + colors.
- Controls: pause/resume (⏸/▶) + clear-all; paused badge shown while paused.
- Auto-dismiss per `preferences.toastDuration` (default 4000 ms); queued toasts promote into the active slot.

### CardDetailModal.jsx

- z-40 overlay with backdrop blur; opens when `activeCardId` is set.
- Image header (`object-cover`, fallback block) + category badge + close button.
- Detail rows (`DetailRow`) per type: equipment (category/status/location/updated), cafe (category/price/description/availability/dietary), transit (type/direction/delay/capacity/route/alerts).
- Close button (indigo gradient) + click-outside + spring animation.

---

## Dashboard Features

### 1. Overview (Totals + Graphs)

| Feature | Behavior |
|---------|----------|
| Total cards | 4 clickable summary cards (Equipment, Cafe, Transit, Campus services) |
| Equipment chart | Stacked bar by status with legend + counts |
| Cafe chart | Donut by category with center total |
| Transit chart | Bar chart of delay per line |

### 2. Search

| Input | Applies to |
|-------|-----------|
| `state.ui.searchQuery` | Equipment (name/location), Cafe (name/description/category), Transit (name/route) |

### 3. Multi-Filter Panel

| Filter | Options |
|--------|---------|
| Equipment status | available / in-use / maintenance / reserved |
| Cafe category | breakfast / lunch / beverage / snack / special |
| Transit type | bus / train / shuttle |
| Dietary | vegetarian / vegan / gluten-free |
| Price range | min–max slider over cafe prices |
| Delay threshold | transit delay ≤ N minutes |
| Capacity threshold | capacity ≤ N % |
| Extras | Active count badge · Reset |

### 4. View Mode

| Mode | Layout |
|------|--------|
| Grid | `md:grid-cols-2 lg:grid-cols-3` |
| List | single column rows (image left, content right) |

### 5. Sorting

| Category | Fields |
|----------|--------|
| Equipment | status, name, category |
| Cafe | price, name, category |
| Transit | name, delay, capacity |

Direction toggle asc/desc; sort UI appears only when a specific category tab is selected.

### 6. Category-Scoped Content

- `selected === 'equipment'` → equipment section only (plus filters/search on equipment).
- `selected === 'cafe'` → cafe section only.
- `selected === 'transit'` → transit section only.
- `selected === 'all'` → Overview + all three sections.
- Sidebar Explore items and dashboard pills drive the same `selectedCategory`.

### 7. Scrollbar Behavior

- Card gallery uses the **main page scrollbar** (no nested `overflow-y-auto` on the card area).
- The thin custom scrollbar is reserved for the sidebar nav and the settings modal.

---

## AI Assistant & Chat Widget

### Chat Engine (`ChatBotLogic.processQuery`)

| Step | Behavior |
|------|----------|
| 1 | Normalize the user's input (lowercase, trimmed) |
| 2 | Match against `FAQ_DATA` (keyword scoring) |
| 3 | Context check against recent history (`checkContext`) |
| 4 | If no match → follow-up / fallback response |
| 5 | Generate dynamic `suggestedQuestions` for the next turn |
| 6 | Simulate typing delay based on response length |

### Message Flow

```
User submits ──► CHAT_SUBMIT_INPUT (optimistic user bubble, isTyping=true)
       ──► ChatBotLogic.processQuery(trimmed, faq, history)
       ──► setTimeout(typing delay) ──► CHAT_ADD_MESSAGE (AI bubble)
       ──► CHAT_SET_SUGGESTIONS (dynamic next-turn suggestions)
```

### Suggestion Chips

- Initial: static `SUGGESTIONS` (4 popular questions).
- After each reply: replaced with `response.suggestedQuestions` from the bot.
- Clicking a chip sends it directly (`submitSuggestion`).

### Floating Launcher

| Property | Value |
|----------|-------|
| Position | bottom-right (`bottom-4 right-4 sm:bottom-6 sm:right-6`) |
| z-index | 40 |
| Icon | bot (closed) → x (open) |
| Extra | pulsing ring + green online dot |
| Keyboard | `Escape` closes the panel |
| State | Local `open` state; chat state shared via context |

---

## Toast Notification System

### Lifecycle

```
TOAST_ADD ──► active? (max 3) ──yes──► activeToasts
              │                          │
              no (paused/full)           │ auto-dismiss after toastDuration
              ▼                          ▼
            queue ──(TOAST_ACTIVATE_NEXT)──► activeToasts
```

### Variants

| Type | Icon | Color |
|------|------|-------|
| success | `check-circle` | green |
| info | `info` | sky/blue |
| warning | `alert-triangle` | amber |
| error | `x-circle` | red |

### Controls

| Control | Behavior |
|---------|----------|
| Pause / Resume | `TOAST_PAUSE` / `TOAST_RESUME` — while paused, new toasts queue instead of showing |
| Clear all | `TOAST_CLEAR_ALL` — empties active + queue |
| Paused badge | Shown while `isPaused` |

### Sources

| Source | Interval |
|--------|----------|
| Boot queue | staggered 1.4 s on mount |
| Random events | every 15 s |
| Manual | `simulateToast()` (bell icon in chat) |

---

## Settings & Preferences

| Preference | Control | Options / Effect |
|------------|---------|------------------|
| Theme | Theme switch (header) | light / dark (toggles `dark` class) |
| Compact mode | Toggle | "Tighter spacing across cards" |
| Animations | Toggle | Framer Motion entrance effects |
| Refresh interval | Select | 15 / 30 / 45 / 60 s (simulated polling) |
| Toast duration | Select | auto-dismiss ms (default 4000) |
| Reset defaults | Button | Restores `INITIAL_PREFERENCES` |

The settings gear shows an **amber dot** when any non-default setting is active (`compactMode`, animations off).

---

## Responsive Layout & Accessibility

### Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| `< lg` | Sidebar hidden → hamburger + mobile drawer (`w-72`); content full width |
| `lg+` | Fixed sidebar `w-64`; content `lg:pl-64`; `max-w-7xl` centered |
| Summary cards | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` |
| Charts | `grid-cols-1 lg:grid-cols-3` |
| Card grid | `md:grid-cols-2 lg:grid-cols-3`; list = single column |
| Chat bubbles | `max-w-[85%]` → `78%` (sm) → `70%` (lg) |

### Alignment

- Header + main share the same `max-w-7xl` gutter.
- Header controls uniform `h-9`.
- Sidebar brand uses `px-4` gutter consistent with nav.
- Heroes span full width above panels.

### Accessibility

| Feature | Implementation |
|---------|----------------|
| Skip link | `.skip-link` focuses `#main-content` |
| Roles | `tablist`/`tab`, `dialog`/`aria-modal`, `switch`, `log`, `status` |
| Labels | `aria-label` on icon-only buttons, `aria-pressed`/`aria-selected`, `aria-expanded` |
| Focus | Visible `focus:ring-2 focus:ring-indigo-500` on interactive controls |
| Keyboard | `Escape` closes chat widget / modal / settings |
| Reduced animation | `preferences.showAnimations` toggle |
| Contrast | Dark + light palettes with slate/indigo scales |

---

## Phase 4 Backend Verification

Phase 4 also includes two verified backend fixes on the content service:

### 1. Health Check Fix (`services/content_service/main.py`)

- Problem: `/health` reported `degraded` / `disconnected` because the DB probe used an invalid ORM expression.
- Fix: execute raw SQL via `db.execute(text("SELECT 1"))` inside `try/finally` so the connection is always returned.
- Result: `/health` returns:

```json
{ "status": "healthy", "database": "connected", "redis": "connected" }
```

### 2. Event Consumer Pub/Sub Fix (`event_consumer.py` + `redis_client.py`)

- Problem: synchronous Redis pub/sub calls blocked the async loop.
- Fix: drive the subscriber via `asyncio.to_thread(pubsub.subscribe / get_message)`; add a `pubsub()` passthrough on `redis_client.py`.
- Result: startup logs show `Subscribed to channel: content.events / equipment.events` and `Event consumer started`.

### Rebuild Command

```bash
docker compose -f docker-compose.infra.yml -p pro build
docker compose -f docker-compose.infra.yml -p pro up -d content-service
```

---

## Testing

### Frontend Verification

| # | Test | Expected |
|---|------|----------|
| 1 | `npm.cmd run dev` | Dev server on :5173, HTTP 200 |
| 2 | `npm.cmd run build` | Build succeeds (~407 kB JS, ~44 kB CSS) |
| 3 | Dashboard load | Hero + Overview (4 cards, 3 charts) render |
| 4 | Category tabs | Equipment / Cafe / Transit show only their items |
| 5 | Sidebar Explore | Clicking Equipment/Cafe/Transit filters the dashboard + highlights tab |
| 6 | Search | Typing filters all three domains |
| 7 | Filters | Status/category/dietary/price/delay/capacity applied; count badge + reset |
| 8 | View mode | Grid ↔ List toggles card layout |
| 9 | Sort | Field + direction reorder items |
| 10 | Card modal | Click card → detail modal → close |
| 11 | Chat widget | FAB opens/closes; Escape closes; conversation persists |
| 12 | Chat send | Valid message → typing → AI reply + dynamic suggestions |
| 13 | Chat empty submit | "Message cannot be empty" appears **only after** submit attempt |
| 14 | Toasts | Max 3 active; pause/resume; clear-all; auto-dismiss |
| 15 | Theme | Light ↔ dark toggles `dark` class |
| 16 | Settings | Compact, animations, refresh interval, toast duration, reset defaults |
| 17 | Persistence | Reload preserves chat + preferences |
| 18 | Responsive | Mobile drawer via hamburger; desktop sidebar fixed |
| 19 | Scrollbar | Card list scrolls with the main page scrollbar (no nested bar) |
| 20 | Overflow | Charts stay inside cards (`min-w-0`, `overflow-hidden`) |

### Backend Smoke Tests (use `curl.exe`)

```bash
curl http://localhost:8000/health
curl http://localhost:8001/health
curl http://localhost:8002/health
docker logs content-service -f     # expect: event consumer subscribed
```

### Container Health

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

| Container | Expected |
|-----------|----------|
| `auth-api` | Up (healthy) |
| `content-service` | Up (healthy) |
| `ai-assistant` | Up (healthy) |
| `sentinel_postgres`, `redis-event-bus`, `milvus*` | Up (healthy) |

> `sentinel_pgadmin` may be in a restart loop — pre-existing cosmetic issue, does not affect the app.

---

## Build & Verification

| Metric | Value (latest build) |
|--------|----------------------|
| JS bundle | ~407 kB (gzip ~122 kB) |
| CSS bundle | ~44.5 kB (gzip ~8 kB) |
| Build time | ~10–35 s |
| Dev server | `http://localhost:5173` (HTTP 200) |
| Components | 10 (+ `App.jsx` shell) |
| Logic modules | 11 |
| Sub-reducers | 6 |
| Action types | ~40 |
| Icon registry | 57 |
| Data items | 24 cards + 15 FAQ + 4 boot toasts |

---

## Operational Commands

| Action | Command |
|--------|---------|
| Install deps | `npm install` (in `frontend/`) |
| Dev server | `npm.cmd run dev` |
| Production build | `npm.cmd run build` |
| Preview build | `npm.cmd run preview` |
| Clear persisted state | DevTools → Application → Local Storage → remove `campus_hub_state` |
| Backend health | `curl.exe http://localhost:8001/health` |
| Rebuild content service | `docker compose -f docker-compose.infra.yml -p pro up -d --build content-service` |
| Service logs | `docker logs content-service -f` |
| All containers | `docker ps --format "table {{.Names}}\t{{.Status}}"` |

---

## Troubleshooting

| # | Issue | Cause | Fix |
|---|-------|-------|-----|
| 1 | `npm` not recognized / `.ps1` blocked | PowerShell blocks `npm.ps1` | Use `npm.cmd` |
| 2 | `dark:` styles missing after Tailwind change | Tailwind config not HMR'd | Restart dev server |
| 3 | "Function components cannot be given refs" | Plain component inside `AnimatePresence`/`motion` tree | Wrap cards in `motion.div` with `variants`/`layout` |
| 4 | Chart overflows card | Flex columns with `min-width:auto` | Add `min-w-0` + `overflow-hidden` |
| 5 | "Message cannot be empty" on load | Error computed on empty input | Gate error display behind a submit-attempt flag |
| 6 | Images broken / blocked | CSP `img-src` | CSP allows `https://images.unsplash.com` + `data:` |
| 7 | `401 Invalid token` in backend tests | PowerShell `Invoke-RestMethod` header encoding | Use `curl.exe` |
| 8 | `/health` shows `degraded` | DB probe used invalid ORM expression | `db.execute(text("SELECT 1"))` with `try/finally` |
| 9 | Event consumer not starting | Sync Redis pub/sub blocked async loop | Use `asyncio.to_thread(pubsub.subscribe/get_message)` |
| 10 | `sentinel_pgadmin` restart loop | Pre-existing cosmetic | Ignore (not part of app) |

---

## Compliance Summary

### OST Compliance — Onboarding & System Truth

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Real-world application shell | ✅ | Fixed sidebar + sticky header + scrollable `main` |
| Dashboard overview with totals + graphs | ✅ | `OverviewStats` (4 cards + 3 charts) |
| Category-scoped views | ✅ | Equipment / Cafe / Transit tabs + sidebar |
| Search across domains | ✅ | `getFilteredData` on `searchQuery` |
| Multi-filter panel | ✅ | Status, category, dietary, price, delay, capacity |
| Grid / List view modes | ✅ | `viewMode` toggle |
| Sort controls | ✅ | Per-category field + direction |
| Card detail modal | ✅ | `CardDetailModal` |
| AI FAQ chatbot | ✅ | `ChatBotLogic` keyword matching |
| Floating chat launcher | ✅ | `ChatWidget` FAB (open/close) |
| Toast system with controls | ✅ | 4 variants, max 3, pause/clear |
| Preferences + persistence | ✅ | Settings modal + `localStorage` |
| Simulated live updates | ✅ | Equipment/transit polling + periodic toasts |
| Navbar alignment | ✅ | Uniform header `h-9`, sidebar `px-4` gutters |
| Standard card scrollbar | ✅ | Main page scroll; no nested card scrollbar |

### FST Compliance — Framework, Stack & Tooling

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| React 18 SPA | ✅ | `createRoot` + function components |
| Vite build tool | ✅ | dev/build/preview scripts |
| Tailwind CSS 3 JIT | ✅ | `darkMode: 'class'`, custom shadows/keyframes |
| Framer Motion animations | ✅ | Bubbles, pills, modals, page transitions, FAB |
| Lucide icon set | ✅ | 57-icon registry (`Icon.jsx`) |
| Google Fonts (Inter + Outfit) | ✅ | Preconnect + stylesheet in `index.html` |
| CSP hardened | ✅ | Unsplash, Google Fonts, HMR ws allowlist |
| Production build verified | ✅ | ~407 kB JS / ~44.5 kB CSS |

### SST Compliance — Services, Streams & Topics

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| View routing (dashboard/assistant) | ✅ | `activeView` + `AnimatePresence` transitions |
| Sidebar navigation | ✅ | 3 groups, active indicators, mobile drawer |
| Shared chat state | ✅ | `chat` slice in context; widget + page + panel reuse |
| Simulated polling streams | ✅ | Equipment 30s, transit 45s, toasts 15s |
| Boot toast stream | ✅ | 4-event staggered queue |
| Persistence stream | ✅ | `campus_hub_state` read/write + hydration |
| Theme stream | ✅ | `dark` class sync on `<html>` |
| Redis event topics (backend) | ✅ | `content.events`, `equipment.events` subscribed |
| Filter/sort/view state | ✅ | Dedicated slices + reducers |

### LST Compliance — Libraries, Scripts & Tooling

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Pure logic libraries | ✅ | 11 modules in `src/logic` (pure functions) |
| Static data library | ✅ | `mockData.js` (24 cards + 15 FAQ + 4 toasts) |
| Selector library | ✅ | `selectors.js` (filtered data, stats, status) |
| Icon registry | ✅ | `Icon.jsx` (57 icons, fallback to help) |
| Dev/build scripts | ✅ | `dev`, `build`, `preview` |
| Validation logic | ✅ | `ValidationLogic` (chat + search) |
| Sorting/filtering logic | ✅ | `SortingLogic`, `FilterLogic`, `SearchLogic` |
| Chat bot logic | ✅ | `ChatBotLogic` (matching, context, suggestions, delay) |
| Toast logic | ✅ | `ToastLogic` (factory, events, colors, progress) |
| Status/format helpers | ✅ | `StatusLogic`, `FormattingLogic`, domain logic per entity |
| Backend pub/sub tooling | ✅ | `asyncio.to_thread` pubsub + `pubsub()` client method |

---

## References

- [React 18 Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS 3](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev/)
- [Google Fonts — Inter / Outfit](https://fonts.google.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Redis Pub/Sub](https://redis.io/docs/manual/pubsub/)
- [PostgreSQL 16](https://www.postgresql.org/docs/16/)
- [Milvus Vector Database](https://milvus.io/docs)

---

**Document Status:** Phase 4 Complete
**Last Updated:** 2026-08-02
**Author:** CIS Community Summer Activity Team
**Version:** v4.0
**Verified:** Vite production build passes; dev server on :5173; backend health + event consumer verified in Docker; all Phase 4 objectives complete
