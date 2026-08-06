# Sentinel-Sync: Phase 5 — Full System Integration & Live Data

---

## Table of Contents

- [Overview](#overview)
- [Phase 5 Objectives](#phase-5-objectives)
- [OST — Onboarding & System Truth](#ost--onboarding--system-truth)
- [FST — Framework, Stack & Tooling](#fst--framework-stack--tooling)
- [SST — Services, Streams & Topics](#sst--services-streams--topics)
- [LST — Libraries, Scripts & Tooling](#lst--libraries-scripts--tooling)
- [Architecture](#architecture)
- [Directory Structure](#directory-structure)
- [API Gateway](#api-gateway)
- [WebSocket Server](#websocket-server)
- [Event Bus Service](#event-bus-service)
- [Content Service Extensions](#content-service-extensions)
- [Frontend Integration](#frontend-integration)
- [Database Schema Extensions](#database-schema-extensions)
- [Data Seeding](#data-seeding)
- [Docker Compose — Master Orchestration](#docker-compose--master-orchestration)
- [Nginx Reverse Proxy](#nginx-reverse-proxy)
- [Local Development Setup](#local-development-setup)
- [Phase 5 Bug Fixes](#phase-5-bug-fixes)
- [Testing](#testing)
- [Operational Commands](#operational-commands)
- [Troubleshooting](#troubleshooting)
- [Compliance Summary](#compliance-summary)
- [References](#references)

---

## Overview

**Phase 5** delivers the **complete unified application** — connecting every microservice through an API Gateway, adding real-time push notifications via WebSocket, establishing a dedicated Redis Event Bus service, and replacing all frontend mock data with live API consumption. The system transitions from a static mock dashboard (Phase 4) to a fully integrated, data-driven campus intelligence hub.

### What Phase 5 Delivers

| Component | Description |
|-----------|-------------|
| **API Gateway** | Express.js unified entry point proxying to Auth, Content, AI, Cafe, Transit services (Port 3000) |
| **WebSocket Server** | Node.js ws server with Redis pub/sub for real-time push notifications (Port 8080) |
| **Event Bus Service** | Dedicated Redis pub/sub event distribution microservice |
| **Frontend API Layer** | `api.js` — fetch-based HTTP client with JWT auth, timeout, error handling |
| **WebSocket React Hook** | `useWebSocket.js` — React hook for subscribing to real-time events |
| **Live Data Loading** | AppContext fetches from `/api/v1/dashboard` on mount, falls back to mock data |
| **Cafe & Transit Endpoints** | Content Service `/api/cafe` and `/api/transit` with JSON string parsing |
| **Equipment Images** | `image_url` column on equipment table, seeded with Unsplash URLs |
| **Master Docker Compose** | 12-service orchestration with health checks and dependency ordering |
| **Nginx Reverse Proxy** | Frontend Docker image with API/WebSocket routing |
| **Local Development** | `start-local.bat` / `stop-local.bat` for running all services locally |
| **Python 3.13 Compat** | Relaxed pinned requirements for Python 3.13.14 compatibility |
| **Null-Safety Fixes** | formattingLogic, chatBotLogic, CardDetailModal null guard fixes |

---

## Phase 5 Objectives

| # | Objective | Status |
|---|-----------|--------|
| 1 | Build Express.js API Gateway with proxy routing to all microservices | ✅ |
| 2 | Add `/api/v1/dashboard` aggregated endpoint (equipment + notices + cafe + transit + metrics) | ✅ |
| 3 | Add proxy routes for cafe (`/api/v1/cafe`) and transit (`/api/v1/transit`) | ✅ |
| 4 | Build WebSocket server with Redis pub/sub for real-time push | ✅ |
| 5 | Build dedicated Event Bus service for inter-service communication | ✅ |
| 6 | Create frontend `ApiService` class with JWT auth, timeout, error handling | ✅ |
| 7 | Create `WebSocketService` class with auto-reconnect and exponential backoff | ✅ |
| 8 | Create `useWebSocket` React hook for component-level subscriptions | ✅ |
| 9 | Update AppContext to load live data from API on mount | ✅ |
| 10 | Add fallback to mock data when API unavailable | ✅ |
| 11 | Add cafe/transit endpoints to content service with JSON string parsing | ✅ |
| 12 | Add `image_url` column to equipment table and seed with images | ✅ |
| 13 | Add `cafe_items` and `transit_items` database tables | ✅ |
| 14 | Create `seed_cafe_transit.py` data seeder | ✅ |
| 15 | Build master `docker-compose.yml` with 12 services | ✅ |
| 16 | Add Nginx reverse proxy for frontend Docker image | ✅ |
| 17 | Create `start-local.bat` / `stop-local.bat` for local development | ✅ |
| 18 | Relax Python requirements for Python 3.13 compatibility | ✅ |
| 19 | Fix `formatDate` and `getRelativeTime` null-safety | ✅ |
| 20 | Fix `chatBotLogic` null guard for missing FAQ keywords | ✅ |
| 21 | Fix equipment `categoryLabel` fallback to `item.type` | ✅ |
| 22 | Fix `imageUrl` / `image_url` field mapping across frontend | ✅ |
| 23 | Fix WebSocket `_intentionalClose` flag for React 18 strict mode | ✅ |
| 24 | All 12 Docker containers healthy, all local services functional | ✅ |

---

## OST — Onboarding & System Truth

### System Context

| Attribute | Specification |
|-----------|---------------|
| System Name | Sentinel-Sync Campus Intelligence Hub — Full System Integration |
| Phase | Phase 5 — API Gateway, WebSocket, Live Data |
| Version | v5.0 |
| Date | 2026-08-06 |
| API Gateway | `http://localhost:3000` (unified entry point) |
| WebSocket | `ws://localhost:8080` (real-time push) |
| Frontend (Docker) | `http://localhost:80` (Nginx) |
| Frontend (Dev) | `http://localhost:5173` (Vite) |
| Backend APIs | Auth `:8000`, Content `:8001`, AI `:8002` |
| Infrastructure | PostgreSQL `:5432`, Redis `:6379`, Milvus `:19530` |
| Total Services | 12 containers (Docker) or 6 processes (local) |

### Scope Boundaries

| In Scope (Phase 5) | Out of Scope (Phase 5) |
|---------------------|------------------------|
| API Gateway with proxy routing | Service mesh (Istio/Linkerd) |
| WebSocket real-time push via Redis pub/sub | Server-Sent Events (SSE) on frontend |
| Frontend live API consumption | GraphQL API layer |
| Cafe & Transit database tables + endpoints | Cafe ordering / payment system |
| Equipment image URLs | Image upload / CDN pipeline |
| Master Docker Compose (12 services) | Kubernetes orchestration |
| Nginx reverse proxy for frontend | Multi-region deployment |
| Local development scripts (bat) | Linux/Mac shell scripts |
| Python 3.13 compatibility fixes | Python 3.14 support |
| Null-safety bug fixes across frontend | Comprehensive error boundary system |

### Functional Domains

```
┌──────────────────────────────────────────────────────────────────────────┐
│                PHASE 5 — FULL SYSTEM INTEGRATION                         │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │  API GATEWAY │  │   WEBSOCKET  │  │  EVENT BUS   │                   │
│  │  DOMAIN      │  │   DOMAIN     │  │  DOMAIN      │                   │
│  │              │  │              │  │              │                   │
│  │  • Proxy     │  │  • Real-time │  │  • Pub/Sub   │                   │
│  │  • Dashboard │  │  • Redis sub │  │  • Channels  │                   │
│  │  • Health    │  │  • Broadcast │  │  • Routing   │                   │
│  │  • Publish   │  │  • Heartbeat │  │  • Health    │                   │
│  └──────────────┘  └──────────────┘  └──────────────┘                   │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │  CONTENT     │  │  FRONTEND    │  │  DATABASE    │                   │
│  │  EXTENSIONS  │  │  INTEGRATION │  │  EXTENSIONS  │                   │
│  │              │  │              │  │              │                   │
│  │  • /cafe     │  │  • api.js    │  │  • cafe_items│                   │
│  │  • /transit  │  │  • useWS.js  │  │  • transit_  │                   │
│  │  • image_url │  │  • Live load │  │    items     │                   │
│  │  • JSON parse│  │  • Fallback  │  │  • image_url │                   │
│  └──────────────┘  └──────────────┘  └──────────────┘                   │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │  DOCKER      │  │  LOCAL DEV   │  │  BUG FIXES   │                   │
│  │  COMPOSE     │  │  SCRIPTS     │  │              │                   │
│  │              │  │              │  │              │                   │
│  │  • 12 svc    │  │  • .bat      │  │  • Null safe │                   │
│  │  • Health    │  │  • Venvs     │  │  • Type fallback                  │
│  │  • Deps      │  │  • Port map  │  │  • WS fix    │                   │
│  └──────────────┘  └──────────────┘  └──────────────┘                   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Onboarding Quick Start

```bash
# === OPTION A: Docker (all 12 services) ===
docker compose --env-file .env up -d
# Open http://localhost:80

# === OPTION B: Local Development ===
# 1. Start infrastructure (PostgreSQL + Redis + Milvus)
docker compose -f docker-compose.yml up -d sentinel_postgres redis-event-bus milvus milvus-etcd milvus-minio

# 2. Start all backend + frontend services
start-local.bat

# 3. Open
#    http://localhost:5173

# 4. Stop all
stop-local.bat
```

> **Windows PowerShell note:** Always use `cmd /c` for npm commands. PowerShell blocks `npm.ps1`. Use `npm.cmd` if running directly in PowerShell.

---

## FST — Framework, Stack & Tooling

### Technology Stack — New in Phase 5

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **API Gateway** | Express.js | 4.18.2 | HTTP proxy + REST endpoints |
| **HTTP Proxy** | http-proxy-middleware | 2.0.6 | Reverse proxy to microservices |
| **Redis Client (JS)** | ioredis | 5.3.2 | Redis connection + pub/sub |
| **WebSocket** | ws | 8.16.0 | WebSocket server |
| **Security Headers** | helmet | 7.1.0 | HTTP security headers |
| **Request Logging** | morgan | 1.10.0 | HTTP request logging |
| **Compression** | compression | 1.7.4 | Gzip response compression |
| **UUID** | uuid | 9.0.0 | Unique event IDs |
| **Web Server (Prod)** | Nginx | alpine | Static file serving + reverse proxy |
| **HTTP Client (Python)** | urllib (stdlib) | — | Health check probes |

### API Gateway Dependencies (`api-gateway/package.json`)

```json
{
  "name": "sentinel-api-gateway",
  "version": "1.0.0",
  "description": "API Gateway for Sentinel-Sync microservices",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "http-proxy-middleware": "^2.0.6",
    "cors": "^2.8.5",
    "ioredis": "^5.3.2",
    "uuid": "^9.0.0",
    "dotenv": "^16.3.1",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "compression": "^1.7.4"
  }
}
```

### WebSocket Dependencies (`services/websocket/package.json`)

```json
{
  "name": "sentinel-websocket",
  "version": "1.0.0",
  "description": "WebSocket server with Redis pub/sub for real-time notifications",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "ws": "^8.16.0",
    "ioredis": "^5.3.2",
    "uuid": "^9.0.0",
    "dotenv": "^16.3.1"
  }
}
```

### Event Bus Dependencies (`services/event_bus/package.json`)

```json
{
  "name": "sentinel-event-bus",
  "version": "1.0.0",
  "description": "Redis pub/sub event distribution service",
  "main": "bus.js",
  "scripts": {
    "start": "node bus.js"
  },
  "dependencies": {
    "ioredis": "^5.3.2",
    "uuid": "^9.0.0",
    "dotenv": "^16.3.1"
  }
}
```

### Python 3.13 Compatibility

Phase 5 relaxed pinned dependency versions in all Python `requirements.txt` files to support Python 3.13.14:

| Package | Before (Phase 3/4) | After (Phase 5) |
|---------|-------------------|-----------------|
| `psycopg2-binary` | `==2.9.9` | `>=2.9.12` |
| `pydantic` | `==2.4.2` | `>=2.4.2` |
| `pydantic-settings` | `==2.0.3` | `>=2.0.3` |
| `redis` | `==5.0.1` | `>=5.0.1` |
| `slowapi` | `==0.1.9` | `>=0.1.9` |
| `python-dotenv` | `==1.0.0` | `>=1.0.0` |
| `email-validator` | `==2.1.0` | `>=2.1.0` |

> All three services (auth, content_service, ai_assistant) use `>=` ranges.

### Vite Configuration Update (`frontend/vite.config.js`)

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
      },
    },
  },
});
```

---

## SST — Services, Streams & Topics

### Service Architecture — Complete

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    SENTINEL-SYNC — PHASE 5 COMPLETE                           │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐                                                            │
│  │   BROWSER    │                                                            │
│  │  (React SPA) │                                                            │
│  └──────┬───────┘                                                            │
│         │                                                                    │
│         │  :5173 (dev) or :80 (Docker)                                       │
│         ▼                                                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                      API GATEWAY (:3000)                             │    │
│  │  Express.js · proxy · dashboard aggregation · event publish          │    │
│  │                                                                      │    │
│  │  GET /api/v1/dashboard  ──► equipment + notices + cafe + transit     │    │
│  │  GET /api/v1/health     ──► aggregated service health                │    │
│  │  ALL /api/v1/auth/*     ──► proxy ──► auth-api (:8000)              │    │
│  │  ALL /api/v1/notices/*  ──► proxy ──► content-service (:8001)       │    │
│  │  ALL /api/v1/equipment/*──► proxy ──► content-service (:8001)       │    │
│  │  ALL /api/v1/cafe/*     ──► proxy ──► content-service (:8001)       │    │
│  │  ALL /api/v1/transit/*  ──► proxy ──► content-service (:8001)       │    │
│  │  ALL /api/v1/ai/*       ──► proxy ──► ai-assistant (:8002)          │    │
│  │  POST /api/v1/events/publish ──► Redis pub/sub                      │    │
│  └──────┬──────────┬──────────┬──────────────────────────────────────┘    │
│         │          │          │                                             │
│         ▼          ▼          ▼                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                                   │
│  │AUTH API  │ │CONTENT   │ │AI        │                                   │
│  │:8000     │ │SERVICE   │ │ASSISTANT │                                   │
│  │FastAPI   │ │:8001     │ │:8002     │                                   │
│  │JWT Auth  │ │FastAPI   │ │FastAPI   │                                   │
│  │Register  │ │CRUD      │ │Groq LLM  │                                   │
│  │Login     │ │Notices   │ │Milvus    │                                   │
│  │Health    │ │Equipment │ │Vector    │                                   │
│  └────┬─────┘ │Cafe      │ │SSE       │                                   │
│       │       │Transit   │ │Health    │                                   │
│       │       │Health    │ └────┬─────┘                                   │
│       │       └────┬─────┘      │                                          │
│       │            │             │                                          │
│       ▼            ▼             ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                       POSTGRESQL (:5432)                             │  │
│  │  Tables: notices, equipment, cafe_items, transit_items,              │  │
│  │          ai_queries, ai_feedback, notice_state_history,              │  │
│  │          equipment_state_history, auth_users                          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─────────────────────────────┐  ┌──────────────────────────────────┐     │
│  │    WEBSOCKET SERVER (:8080) │  │      REDIS (:6379)               │     │
│  │    ws + Redis pub/sub       │  │      Event Bus + Cache           │     │
│  │                             │  │                                  │     │
│  │  Browser ◄── push ── Redis  │  │  Channels:                       │     │
│  │  30s heartbeat              │  │  • cis_events                    │     │
│  │  Auto-reconnect             │  │  • content.events                │     │
│  │  Channel subscription       │  │  • equipment.events              │     │
│  │                             │  │  • notification.events           │     │
│  │                             │  │  • service.events                │     │
│  └─────────────────────────────┘  └──────────────────────────────────┘     │
│                                                                              │
│  ┌─────────────────────────────┐  ┌──────────────────────────────────┐     │
│  │   EVENT BUS SERVICE         │  │   MILVUS (:19530)                │     │
│  │   Redis pub/sub relay       │  │   Vector Database                │     │
│  │   Channel routing           │  │   campus_guidelines collection   │     │
│  └─────────────────────────────┘  └──────────────────────────────────┘     │
│                                                                              │
│  Network: sentinel_network (Docker bridge)                                   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### API Gateway Endpoints

#### `GET /api/v1/health` — Aggregated Health Check

| Property | Value |
|----------|-------|
| Status Code | `200 OK` |
| Auth Required | No |
| Caching | None (real-time) |

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-08-06T12:00:00.000Z",
  "services": {
    "auth-api": "healthy",
    "content-service": "healthy",
    "ai-assistant": "healthy"
  },
  "version": "1.0.0"
}
```

#### `GET /api/v1/dashboard` — Aggregated Dashboard Data

| Property | Value |
|----------|-------|
| Status Code | `200 OK` |
| Auth Required | No |
| Uses | `Promise.allSettled` for fault tolerance |

**Response:**
```json
{
  "services": [ /* equipment items with image_url */ ],
  "notices": [ /* notice items */ ],
  "cafe": [ /* cafe items with parsed dietary arrays */ ],
  "transit": [ /* transit items with parsed route/alerts arrays */ ],
  "metrics": {
    "totalServices": 9,
    "activeServices": 5,
    "inUseServices": 2,
    "maintenanceServices": 1,
    "totalNotices": 8,
    "publishedNotices": 6
  },
  "timestamp": "2026-08-06T12:00:00.000Z"
}
```

**Response Handling:**
```js
const items = equipment.equipment || equipment.items || [];
const noticeItems = notices.notices || notices.items || [];
const cafeItems = cafe.cafe || cafe.items || [];
const transitItems = transit.transit || transit.items || [];
```

> The gateway handles both `{ equipment: [...] }` and `{ items: [...] }` response shapes for backwards compatibility.

#### Proxy Routes

| Gateway Path | Target | Rewrite |
|-------------|--------|---------|
| `/api/v1/auth/*` | `http://auth-api:8000` | `/api/v1/auth` → `` |
| `/api/v1/notices/*` | `http://content-service:8001` | `/api/v1/notices` → `/api/notices` |
| `/api/v1/equipment/*` | `http://content-service:8001` | `/api/v1/equipment` → `/api/equipment` |
| `/api/v1/cafe/*` | `http://content-service:8001` | `/api/v1/cafe` → `/api/cafe` |
| `/api/v1/transit/*` | `http://content-service:8001` | `/api/v1/transit` → `/api/transit` |
| `/api/v1/ai/*` | `http://ai-assistant:8002` | `/api/v1/ai` → `/api/ai` |

#### `POST /api/v1/events/publish` — Manual Event Publishing

**Request:**
```json
{
  "type": "notification.created",
  "data": { "title": "System Update", "message": "Scheduled maintenance tonight" },
  "channel": "notification.events"
}
```

**Response:**
```json
{
  "success": true,
  "eventId": "uuid",
  "timestamp": "2026-08-06T12:00:00.000Z"
}
```

#### `GET /api/v1/events` — Event Stream Info

**Response:**
```json
{
  "message": "Event stream endpoint",
  "channels": ["cis_events", "content.events", "equipment.events", "notification.events"]
}
```

### WebSocket Server Protocol

#### Connection

```
ws://localhost:8080
```

#### Health Check (HTTP)

```
GET http://localhost:8080/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "websocket-server",
  "connections": 3,
  "uptime": 3600,
  "timestamp": "2026-08-06T12:00:00.000Z"
}
```

#### Message Protocol

| Direction | Type | Payload | Description |
|-----------|------|---------|-------------|
| Client → Server | `subscribe` | `{ type: "subscribe", channel: "cis_events" }` | Subscribe to Redis channel |
| Client → Server | `unsubscribe` | `{ type: "unsubscribe", channel: "cis_events" }` | Unsubscribe from channel |
| Server → Client | `connected` | `{ type: "connected", clientId: "uuid", ... }` | Connection established |
| Server → Client | `subscribed` | `{ type: "subscribed", channel: "..." }` | Subscription confirmed |
| Server → Client | `event` | `{ type: "event", channel: "...", data: {...} }` | Real-time event from Redis |
| Server → Client | `notification` | `{ type: "notification", data: {...} }` | Push notification |
| Bidirectional | `ping`/`pong` | `{ type: "ping" }` | 30-second heartbeat |

#### Client Connection Lifecycle

```
Browser ──(ws connect)──► WebSocket Server
                          │
                          ├── Redis Subscriber connected
                          ├── Redis Publisher connected
                          │
                          ├─(connected)──► Browser
                          │
Browser ──(subscribe)───► Server ──(subscribe)──► Redis
                          │
                          │  ... Redis receives event ...
                          │
Redis ──(message)──────► Server ──(broadcast)──► Browser(s)
                          │
Browser ──(ping)────────► Server ──(pong)──────► Browser
                          │
Browser ──(disconnect)──► Server
                          ├── Remove from clients map
                          └── Redis unsubscribed
```

### Content Service — New Endpoints (Phase 5)

#### `GET /api/cafe` — List Cafe Items

| Property | Value |
|----------|-------|
| Status Code | `200 OK` |
| Auth Required | No |
| Rate Limit | 100/minute |
| Query Params | `page`, `page_size`, `category` |

**Response:**
```json
{
  "cafe": [
    {
      "id": "cafe-001",
      "name": "Avocado Toast Supreme",
      "category": "breakfast",
      "price": 8.99,
      "available": true,
      "dietary": ["vegetarian"],
      "description": "Sourdough toast with mashed avocado...",
      "image_url": "https://images.unsplash.com/photo-...",
      "created_at": "2026-08-06T10:00:00Z",
      "updated_at": "2026-08-06T10:00:00Z",
      "version": 1
    }
  ],
  "total": 10
}
```

**JSON Parsing:** The `dietary` field is stored as a JSON string in PostgreSQL and parsed to an array before response:
```python
if isinstance(item.get('dietary'), str):
    item['dietary'] = json_module.loads(item['dietary'])
```

#### `GET /api/transit` — List Transit Items

| Property | Value |
|----------|-------|
| Status Code | `200 OK` |
| Auth Required | No |
| Rate Limit | 100/minute |

**Response:**
```json
{
  "transit": [
    {
      "id": "transit-001",
      "name": "Blue Line - Campus Express",
      "type": "bus",
      "direction": "inbound",
      "next_arrival": "2026-08-06T08:45:00",
      "delay": 0,
      "capacity": 45,
      "route": ["Main Campus", "Science Center", "Library", "Student Union"],
      "alerts": [],
      "image_url": "https://images.unsplash.com/photo-...",
      "created_at": "2026-08-06T10:00:00Z",
      "updated_at": "2026-08-06T10:00:00Z",
      "version": 1
    }
  ],
  "total": 6
}
```

**JSON Parsing:** Both `route` and `alerts` are stored as JSON strings and parsed to arrays:
```python
if isinstance(item.get('route'), str):
    item['route'] = json_module.loads(item['route'])
if isinstance(item.get('alerts'), str):
    item['alerts'] = json_module.loads(item['alerts'])
```

### Equipment Response Update (Phase 5)

The equipment list response now includes `image_url`:

```json
{
  "id": "uuid",
  "name": "Router Cisco",
  "type": "network",
  "location": "Server Room",
  "status": "available",
  "maintenance_schedule": null,
  "image_url": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=70",
  "created_at": "2026-08-06T10:51:27Z",
  "updated_at": "2026-08-06T10:51:27Z",
  "version": 1
}
```

### Event Topics — Phase 5 Channels

| Channel | Publisher | Subscriber | Purpose |
|---------|-----------|------------|---------|
| `cis_events` | API Gateway, Event Bus | WebSocket Server | General campus events |
| `content.events` | Content Service | Event Bus, WebSocket | Notice CRUD events |
| `equipment.events` | Content Service | Event Bus, WebSocket | Equipment status changes |
| `notification.events` | API Gateway | WebSocket Server | Push notifications to UI |
| `service.events` | All services | Event Bus | Service health/status |

---

## LST — Libraries, Scripts & Tooling

### Frontend API Layer (`frontend/src/services/api.js`)

| Class | Methods | Purpose |
|-------|---------|---------|
| **ApiService** | `get`, `post`, `put`, `patch`, `delete` | HTTP client with JWT auth + timeout |
| | `getDashboard()` | Fetch aggregated dashboard data |
| | `getEquipment()`, `getNotices()` | List endpoints |
| | `createEquipment()`, `updateEquipment()`, `deleteEquipment()` | CRUD |
| | `aiQuery()`, `aiFeedback()` | AI endpoints |
| | `login()`, `register()`, `logout()` | Auth endpoints |
| | `getHealth()` | Health check |
| **ApiError** | `message`, `status`, `data` | Structured error class |
| **WebSocketService** | `connect()`, `disconnect()` | Connection management |
| | `subscribe(channel)`, `unsubscribe(channel)` | Channel subscriptions |
| | `on(event, callback)` | Event listener registration |
| | `send(data)` | Send JSON message |
| | `reconnect()` | Exponential backoff reconnect |

**ApiService Configuration:**

| Setting | Default | Source |
|---------|---------|--------|
| `API_BASE` | `/api/v1` | `VITE_API_URL` env or fallback |
| `WS_BASE` | `ws://hostname:8080` | `VITE_WS_URL` env or fallback |
| Request timeout | 10,000 ms | `AbortSignal.timeout(10000)` |
| Token storage | `localStorage['sentinel_token']` | Persistent JWT |

**WebSocket Reconnect Strategy:**

| Attempt | Delay | Formula |
|---------|-------|---------|
| 1 | 1000 ms | `1000 * 2^0` |
| 2 | 2000 ms | `1000 * 2^1` |
| 3 | 4000 ms | `1000 * 2^2` |
| 4 | 8000 ms | `1000 * 2^3` |
| 5+ | capped at 30s | exponential backoff |
| Max | 10 attempts | then gives up |

**React 18 Strict Mode Handling:**

```js
this._intentionalClose = false;

// On intentional disconnect:
disconnect() {
  this._intentionalClose = true;
  this.ws.close();
}

// On natural close:
ws.onclose = () => {
  if (!this._intentionalClose) {
    this.reconnect();  // Only reconnect if not intentional
  }
  this._intentionalClose = false;
};
```

### React WebSocket Hook (`frontend/src/hooks/useWebSocket.js`)

```js
import { useWebSocket } from '../hooks/useWebSocket.js';

// Usage in component:
const { send, isConnected } = useWebSocket('cis_events', (event) => {
  console.log('Received:', event);
});
```

| Return | Type | Description |
|--------|------|-------------|
| `send` | `function` | Send data to WebSocket server |
| `isConnected` | `boolean` | Current connection status |

| Parameter | Type | Description |
|-----------|------|-------------|
| `channel` | `string` | Redis channel to subscribe to |
| `onEvent` | `function` | Callback for received events |

**Lifecycle:**
1. On mount: `ws.connect()` + `ws.subscribe(channel)`
2. On message: filter by channel, call `callbackRef.current(data)`
3. On notification: call `callbackRef.current(data)` (all notifications)
4. On unmount: unsubscribe + cleanup listeners

### Data Seeding (`backend/auth/seed_cafe_transit.py`)

| Table | Records | Data |
|-------|---------|------|
| `cafe_items` | 10 | Avocado Toast, Vegan Power Bowl, Caramel Macchiato, Turkey Club, Matcha Latte, Mediterranean Wrap, Berry Smoothie, Chef's Salad, Chocolate Cookie, Pasta Alfredo |
| `transit_items` | 6 | Blue Line Bus, Green Line Bus, Red Line Bus, Metro Rail, Night Shuttle, Express Shuttle |

**Cafe Data Fields:** `id`, `name`, `category`, `price`, `available`, `dietary` (JSON array), `description`, `image_url`

**Transit Data Fields:** `id`, `name`, `type`, `direction`, `next_arrival`, `delay`, `capacity`, `route` (JSON array), `alerts` (JSON array), `image_url`

**Equipment Images (8 types):**

| Equipment Type | Image Source |
|---------------|-------------|
| `projector` | Unsplash projector photo |
| `microphone` | Unsplash microphone photo |
| `speaker` | Unsplash speaker photo |
| `laptop` | Unsplash laptop photo |
| `whiteboard` | Unsplash whiteboard photo |
| `camera` | Unsplash camera photo |
| `tablet` | Unsplash tablet photo |
| `network` | Unsplash network/router photo |

### Local Development Scripts

#### `start-local.bat`

```batch
@echo off
echo Starting All Local Services...

:: Auth Service (port 8000)
start "Auth-8000" /min cmd /c "cd /d ...\backend\auth && set REDIS_HOST=localhost&& set DATABASE_URL=...&& venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000"

:: Content Service (port 8001)
start "Content-8001" /min cmd /c "cd /d ...\services\content_service && set REDIS_HOST=localhost&& set DATABASE_URL=...&& venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8001"

:: AI Assistant (port 8002)
start "AI-8002" /min cmd /c "cd /d ...\services\ai_assistant && set REDIS_HOST=localhost&& set DATABASE_URL=...&& set MILVUS_HOST=localhost&& venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8002"

:: WebSocket Server (port 8080)
start "WebSocket-8080" /min cmd /c "cd /d ...\services\websocket && set REDIS_HOST=localhost&& node server.js"

:: API Gateway (port 3000)
start "APIGateway-3000" /min cmd /c "cd /d ...\api-gateway && set REDIS_HOST=localhost&& set AUTH_SERVICE_URL=http://localhost:8000&& set CONTENT_SERVICE_URL=http://localhost:8001&& set AI_SERVICE_URL=http://localhost:8002&& node server.js"
```

**Services Started:**

| Service | Port | Window Title | Process |
|---------|------|-------------|---------|
| Auth API | 8000 | `Auth-8000` | Python uvicorn |
| Content Service | 8001 | `Content-8001` | Python uvicorn |
| AI Assistant | 8002 | `AI-8002` | Python uvicorn |
| WebSocket | 8080 | `WebSocket-8080` | Node.js |
| API Gateway | 3000 | `APIGateway-3000` | Node.js |

> All processes run in hidden cmd windows (`/min`). Use `stop-local.bat` to kill them by window title.

#### `stop-local.bat`

```batch
@echo off
taskkill /FI "WINDOWTITLE eq Auth-8000*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Content-8001*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq AI-8002*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq WebSocket-8080*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq APIGateway-3000*" /F >nul 2>&1
echo Done!
```

### Testing Tools

| Tool | Purpose |
|------|---------|
| `curl.exe` / `Invoke-RestMethod` | API smoke tests |
| Vite build | Compile-time verification |
| Browser DevTools | Frontend debugging |
| `docker ps` | Container health verification |
| `docker logs` | Service log inspection |

---

## Architecture

### Data Flow — Phase 5

```
┌──────────────────────────────────────────────────────────────────┐
│                    DATA FLOW — PHASE 5                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐                                                 │
│  │  PostgreSQL  │                                                │
│  │  (10 tables) │                                                │
│  └──────┬──────┘                                                 │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────┐               │
│  │          CONTENT SERVICE (:8001)              │               │
│  │  GET /api/equipment ──► Equipment + image_url │               │
│  │  GET /api/cafe ──► Cafe + parsed dietary      │               │
│  │  GET /api/transit ──► Transit + parsed route   │               │
│  │  GET /api/notices ──► Notices                  │               │
│  │                                                │               │
│  │  PUBLISH ──► Redis channels                    │               │
│  └──────────────┬───────────────────────────────┘               │
│                 │                                                │
│                 ▼                                                │
│  ┌──────────────────────────────────────────────┐               │
│  │          API GATEWAY (:3000)                  │               │
│  │                                                │               │
│  │  /api/v1/dashboard ──► fetch all 4 endpoints   │               │
│  │  ──► merge into { services, notices,           │               │
│  │       cafe, transit, metrics }                 │               │
│  │  ──► return to browser                         │               │
│  │                                                │               │
│  │  /api/v1/events/publish ──► Redis pub/sub      │               │
│  └──────────────┬───────────────────────────────┘               │
│                 │                                                │
│    ┌────────────┴────────────┐                                  │
│    ▼                         ▼                                   │
│  ┌──────────┐          ┌──────────┐                              │
│  │ BROWSER  │          │ WEBSOCKET│                              │
│  │ (fetch)  │          │ SERVER   │                              │
│  │          │          │ (:8080)  │                              │
│  │ api.js   │          │          │                              │
│  │ getDash()│          │ Redis ◄──┼── events                     │
│  │          │          │ sub      │                              │
│  │ AppCtx   │          │          │                              │
│  │ mount    │          │ broadcast│                              │
│  │ ──► load │          │ ──► push │                              │
│  │ live data│          │ to       │                              │
│  │          │          │ browser  │                              │
│  │ fallback │          │          │                              │
│  │ ──► mock │          └──────────┘                              │
│  │ if error │                                                     │
│  └──────────┘                                                     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Frontend Data Loading Flow

```
App mount
    │
    ├── api.getDashboard() ──► GET /api/v1/dashboard
    │       │
    │       ├── Success
    │       │   ├── EQUIPMENT_LOAD (dashboardData.services)
    │       │   ├── FAQ_LOAD (dashboardData.notices)
    │       │   ├── CAFE_LOAD (dashboardData.cafe)
    │       │   ├── TRANSIT_LOAD (dashboardData.transit)
    │       │   └── METRICS_LOAD (dashboardData.metrics)
    │       │
    │       └── Error (API unavailable)
    │           ├── EQUIPMENT_LOAD (mockData.EQUIPMENT_DATA)
    │           ├── FAQ_LOAD (mockData.FAQ_DATA)
    │           ├── CAFE_LOAD (mockData.CAFE_DATA)
    │           └── TRANSIT_LOAD (mockData.TRANSIT_DATA)
    │
    ├── ws.connect() ──► WebSocket :8080
    │   ├── subscribe('cis_events')
    │   ├── subscribe('notification.events')
    │   ├── on('notification') ──► TOAST_ADD
    │   └── on('event:equipment.events') ──► EQUIPMENT_UPDATE_STATUS
    │
    ├── Equipment Poll Timer (every refreshInterval seconds)
    │   ├── api.getEquipment() ──► EQUIPMENT_UPDATE_ALL
    │   └── fallback: EQUIPMENT_SIMULATE_POLL
    │
    └── Toast Timer (every 15s)
        └── generateMockEvents(1) ──► TOAST_ADD
```

---

## Directory Structure

```
Pro/
├── .env                                    # Environment variables
├── .gitignore
├── README.md
├── Phase1.md … Phase5.md                   # Phase documentation
├── docker-compose.yml                      # Master: 12 services
├── docker-compose.infra.yml                # Legacy: infra only
├── start-local.bat                         # Local dev launcher
├── stop-local.bat                          # Local dev stopper
│
├── api-gateway/                            # Phase 5: API Gateway
│   ├── server.js                           # Express.js proxy + dashboard
│   ├── package.json                        # Node.js deps
│   ├── Dockerfile                          # node:18-alpine
│   └── .dockerignore
│
├── backend/auth/
│   ├── main.py                             # FastAPI auth routes
│   ├── config.py, database.py, models.py, schemas.py
│   ├── auth_service.py, jwt_manager.py, password_hasher.py
│   ├── redis_client.py
│   ├── requirements.txt                    # Relaxed for Python 3.13
│   ├── seed_cafe_transit.py                # Phase 5: cafe + transit seed
│   ├── venv/                               # Python 3.13 virtualenv
│   ├── Dockerfile
│   └── .dockerignore
│
├── services/
│   ├── websocket/                          # Phase 5: WebSocket Server
│   │   ├── server.js                       # ws + Redis pub/sub
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── .dockerignore
│   ├── event_bus/                          # Phase 5: Event Bus
│   │   ├── bus.js                          # Redis pub/sub relay
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── .dockerignore
│   ├── content_service/                    # Extended: cafe/transit/image_url
│   │   ├── main.py                         # + /api/cafe, /api/transit
│   │   ├── models.py                       # + image_url column
│   │   ├── schemas.py                      # + EquipmentResponse.image_url
│   │   ├── equipment_service.py            # + image_url in serialization
│   │   ├── requirements.txt                # Relaxed for Python 3.13
│   │   ├── venv/
│   │   └── ...
│   └── ai_assistant/
│       ├── requirements.txt                # Relaxed for Python 3.13
│       └── ...
│
├── frontend/
│   ├── Dockerfile                          # Multi-stage: node build + nginx
│   ├── nginx.conf                          # Reverse proxy config
│   ├── vite.config.js                      # + API/WS proxy config
│   └── src/
│       ├── services/api.js                 # Phase 5: API + WebSocket classes
│       ├── hooks/useWebSocket.js           # Phase 5: React WS hook
│       ├── context/AppContext.jsx           # + live data loading + WS events
│       ├── context/reducers.js             # + EQUIPMENT_UPDATE_ALL, etc.
│       ├── logic/chatBotLogic.js           # + null guard for keywords
│       ├── logic/formattingLogic.js        # + null-safe formatDate
│       └── components/
│           ├── CardDetailModal.jsx          # + category || type, null dates
│           └── Dashboard.jsx               # + imageUrl || image_url
│
├── database/
│   ├── schema.sql                          # Phase 1
│   ├── phase3_schema.sql                   # Phase 3
│   └── (cafe_items, transit_items created via seed script)
│
└── data/                                   # Docker bind mounts (D: drive)
    ├── postgres/
    ├── redis/
    ├── milvus/
    ├── etcd/
    └── minio/
```

---

## Database Schema Extensions

### Table: `cafe_items` (Phase 5)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(50) | PRIMARY KEY | e.g. `cafe-001` |
| `name` | VARCHAR(200) | NOT NULL | Item name |
| `category` | VARCHAR(50) | NOT NULL | `breakfast` / `lunch` / `beverage` / `snack` / `special` |
| `price` | DECIMAL(10,2) | NOT NULL | Price in USD |
| `available` | BOOLEAN | DEFAULT TRUE | In-stock status |
| `dietary` | TEXT | | JSON array string: `["vegetarian","vegan"]` |
| `description` | TEXT | | Item description |
| `image_url` | VARCHAR(500) | | Unsplash image URL |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |
| `version` | INTEGER | DEFAULT 1 | Optimistic lock version |

### Table: `transit_items` (Phase 5)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(50) | PRIMARY KEY | e.g. `transit-001` |
| `name` | VARCHAR(200) | NOT NULL | Route name |
| `type` | VARCHAR(50) | NOT NULL | `bus` / `train` / `shuttle` |
| `direction` | VARCHAR(50) | NOT NULL | `inbound` / `outbound` |
| `next_arrival` | TIMESTAMPTZ | | Next arrival time |
| `delay` | INTEGER | DEFAULT 0 | Delay in minutes |
| `capacity` | INTEGER | DEFAULT 0 | Capacity percentage (0-100) |
| `route` | TEXT | | JSON array string of stop names |
| `alerts` | TEXT | | JSON array string of alert messages |
| `image_url` | VARCHAR(500) | | Unsplash image URL |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |
| `version` | INTEGER | DEFAULT 1 | Optimistic lock version |

### Column: `image_url` on `equipment` (Phase 5)

```sql
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS image_url TEXT;
```

**Model update (`services/content_service/models.py`):**
```python
image_url = Column(String(500), nullable=True)
```

**Schema update (`services/content_service/schemas.py`):**
```python
class EquipmentResponse(BaseModel):
    # ... existing fields ...
    image_url: Optional[str] = None
```

---

## Docker Compose — Master Orchestration

### Container Architecture (12 Services)

| Service | Container | Port | Image | Health Check | Phase |
|---------|-----------|------|-------|--------------|-------|
| PostgreSQL | `sentinel_postgres` | 5432 | postgres:16-alpine | `pg_isready` | 1 |
| Redis | `redis-event-bus` | 6379 | redis:7.2-alpine | `redis-cli ping` | 2 |
| Milvus etcd | `milvus-etcd` | 2379 | quay.io/coreos/etcd:v3.5.5 | `etcdctl health` | 3 |
| Milvus MinIO | `milvus-minio` | 9000-9001 | minio/minio | HTTP `/minio/health/live` | 3 |
| Milvus | `milvus` | 19530, 9091 | milvusdb/milvus:v2.3.4 | HTTP `/healthz` | 3 |
| Auth API | `auth-api` | 8000 | pro-auth-api | python urllib | 2 |
| Content Service | `content-service` | 8001 | pro-content-service | python urllib | 3+5 |
| AI Assistant | `ai-assistant` | 8002 | pro-ai-assistant | python urllib | 3 |
| Event Bus | `event-bus` | — | pro-event-bus | node ping | 5 |
| WebSocket | `websocket` | 8080 | pro-websocket | wget health | 5 |
| API Gateway | `api-gateway` | 3000 | pro-api-gateway | wget health | 5 |
| Frontend | `frontend` | 80 | pro-frontend | nginx | 4+5 |

### Dependency Graph

```
sentinel_postgres ──┬──► auth-api ──────────┬──► api-gateway ──► frontend
                    │                       │
redis-event-bus ────┼──► content-service ───┤
                    │                       │
                    ├──► event-bus ─────────┤
                    │                       │
                    └──► websocket ─────────┘

milvus-etcd ──► milvus ──► ai-assistant ──┘
milvus-minio ──┘
```

### Health Check Configuration

| Service | Command | Interval | Timeout | Retries | Start Period |
|---------|---------|----------|---------|---------|-------------|
| PostgreSQL | `pg_isready` | 10s | 5s | 5 | 10s |
| Redis | `redis-cli ping` | 10s | 5s | 5 | 10s |
| Milvus | `curl /healthz` | 30s | 20s | 3 | 90s |
| Auth API | `python urllib` | 30s | 10s | 3 | 15s |
| Content Service | `python urllib` | 30s | 10s | 3 | 15s |
| AI Assistant | `python urllib` | 30s | 10s | 3 | 15s |
| API Gateway | `wget /api/v1/health` | 30s | 10s | 3 | — |
| WebSocket | `wget /health` | 30s | 10s | 3 | — |
| Event Bus | `node ioredis ping` | 30s | 10s | 3 | — |

### Data Persistence

| Service | Storage Type | Host Path |
|---------|-------------|-----------|
| PostgreSQL | Bind mount | `./data/postgres` |
| Redis | Bind mount | `./data/redis` |
| Milvus | Bind mount | `./data/milvus` |
| etcd | Bind mount | `./data/etcd` |
| MinIO | Bind mount | `./data/minio` |

> All data stored on D: drive via bind mounts. No Docker volumes used.

---

## Nginx Reverse Proxy

### Configuration (`frontend/nginx.conf`)

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy → API Gateway
    location /api/ {
        proxy_pass http://api-gateway:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket proxy → WebSocket Server
    location /ws/ {
        proxy_pass http://websocket:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

### Multi-Stage Dockerfile (`frontend/Dockerfile`)

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Local Development Setup

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.13+ | Backend services |
| Node.js | 18+ | Frontend + API Gateway + WebSocket |
| Docker | 20.10+ | Infrastructure (PostgreSQL, Redis, Milvus) |
| Git | 2.30+ | Version control |

### Step-by-Step

```bash
# 1. Start Docker infrastructure only
docker compose up -d sentinel_postgres redis-event-bus milvus milvus-etcd milvus-minio

# 2. Create Python virtual environments
cd backend/auth && python -m venv venv && venv\Scripts\pip install -r requirements.txt
cd ../../services/content_service && python -m venv venv && venv\Scripts\pip install -r requirements.txt
cd ../ai_assistant && python -m venv venv && venv\Scripts\pip install -r requirements.txt

# 3. Install Node.js dependencies
cd ../../services/websocket && npm install
cd ../../api-gateway && npm install
cd ../../frontend && npm install

# 4. Seed cafe + transit data
cd ../backend/auth && ..\\..\\venv\Scripts\python.exe seed_cafe_transit.py

# 5. Start all services
cd ../.. && start-local.bat

# 6. Open browser
# http://localhost:5173
```

### Port Allocation (Local)

| Service | Port | Notes |
|---------|------|-------|
| Vite dev server | 5173 | Frontend with HMR |
| API Gateway | 3000 | Unified API entry |
| Auth API | 8000 | JWT authentication |
| Content Service | 8001 | CRUD + cafe/transit |
| AI Assistant | 8002 | Groq + Milvus |
| WebSocket | 8080 | Real-time push |
| PostgreSQL | 5432 | Docker |
| Redis | 6379 | Docker |
| Milvus | 19530 | Docker |

### Environment Variables (Local Override)

| Variable | Docker Default | Local Value |
|----------|---------------|-------------|
| `REDIS_HOST` | `redis-event-bus` | `localhost` |
| `DATABASE_URL` | `postgresql://...@sentinel_postgres:5432/...` | `postgresql://...@localhost:5432/...` |
| `MILVUS_HOST` | `milvus` | `localhost` |
| `AUTH_SERVICE_URL` | `http://auth-api:8000` | `http://localhost:8000` |
| `CONTENT_SERVICE_URL` | `http://content-service:8001` | `http://localhost:8001` |
| `AI_SERVICE_URL` | `http://ai-assistant:8002` | `http://localhost:8002` |

> The `start-local.bat` script sets all these env vars inline for each process.

---

## Phase 5 Bug Fixes

### 1. `formatDate` Null Safety (`formattingLogic.js`)

**Problem:** `formatDate(null)` crashed with `Cannot read properties of null (reading 'split')`.

**Fix:**
```js
formatDate(dateString) {
  if (!dateString) return 'Unknown date';
  // ...
}
getRelativeTime(dateString) {
  if (!dateString) return 'Unknown';
  // ...
}
```

### 2. `chatBotLogic` Null Guard (`chatBotLogic.js`)

**Problem:** `faq.keywords.filter(...)` crashed when FAQ items had no `keywords` field (notices loaded as FAQ data).

**Fix:**
```js
const keywords = faq.keywords || [];
const matchedKeywords = keywords.filter((keyword) => query.includes(keyword));
const keywordScore = keywords.length > 0 ? matchedKeywords.length / keywords.length : 0;
```

Also added early return for empty/null `faqData`:
```js
if (!faqData || !Array.isArray(faqData) || faqData.length === 0) {
  return { text: this.getFallbackResponse(), confidence: 0, suggestedQuestions: [] };
}
```

### 3. Equipment `categoryLabel` Fallback (`CardDetailModal.jsx`)

**Problem:** DB equipment has `type` field (e.g. "projector"), not `category`. `formatEquipmentCategory(undefined)` returned `undefined`, causing `.split()` crash.

**Fix:**
```js
categoryLabel = FormattingLogic.formatEquipmentCategory(item.category || item.type);
```

Same fix applied in `Dashboard.jsx`.

### 4. `imageUrl` vs `image_url` Field Mapping

**Problem:** DB uses `image_url` (snake_case) but frontend expected `imageUrl` (camelCase).

**Fix in Dashboard.jsx:**
```jsx
image={item.imageUrl || item.image_url}
```

**Fix in CardDetailModal.jsx:**
```jsx
{(item.imageUrl || item.image_url) && (
  <img src={item.imageUrl || item.image_url} ... />
)}
```

### 5. `lastUpdated` vs `updated_at` Field Mapping

**Problem:** Frontend code referenced `item.lastUpdated` but DB returns `updated_at`.

**Fix:**
```jsx
{FormattingLogic.formatDate(item.lastUpdated || item.updated_at)}
```

### 6. WebSocket `_intentionalClose` Flag (`api.js`)

**Problem:** React 18 strict mode causes WebSocket first-try disconnect then auto-reconnect. Console showed misleading disconnect/reconnect logs.

**Fix:**
```js
this._intentionalClose = false;

ws.onclose = () => {
  this.isConnected = false;
  this.emit('disconnected');
  if (!this._intentionalClose) {
    this.reconnect();
  }
  this._intentionalClose = false;
};

disconnect() {
  this._intentionalClose = true;
  if (this.ws) { this.ws.close(); this.ws = null; }
}
```

### 7. Content Service `image_url` in Serialization (`equipment_service.py`)

**Problem:** Equipment list endpoint didn't include `image_url` in response.

**Fix:**
```python
"image_url": e.image_url if hasattr(e, 'image_url') else None,
```

Also added `image_url` to Pydantic `EquipmentResponse` schema.

---

## Testing

### API Gateway Verification

```bash
# Health check
Invoke-RestMethod -Uri http://localhost:3000/api/v1/health

# Dashboard data
$dash = Invoke-RestMethod -Uri http://localhost:3000/api/v1/dashboard
Write-Host "Equipment: $($dash.services.Count)"
Write-Host "Notices: $($dash.notices.Count)"
Write-Host "Cafe: $($dash.cafe.Count)"
Write-Host "Transit: $($dash.transit.Count)"

# Equipment images
$dash.services | ForEach-Object { Write-Host "$($_.name): $($_.image_url)" }
```

### Content Service Verification

```bash
# Direct equipment (should include image_url)
Invoke-RestMethod -Uri http://localhost:8001/api/equipment

# Direct cafe (should include parsed dietary arrays)
Invoke-RestMethod -Uri http://localhost:8001/api/cafe

# Direct transit (should include parsed route/alerts arrays)
Invoke-RestMethod -Uri http://localhost:8001/api/transit
```

### WebSocket Verification

```bash
# Health check
Invoke-RestMethod -Uri http://localhost:8080/health
```

### Frontend Verification

| # | Test | Expected |
|---|------|----------|
| 1 | Dashboard load | Live data from API (9 equipment, 8 notices, 10 cafe, 6 transit) |
| 2 | Equipment cards | Images displayed from `image_url` |
| 3 | Cafe cards | Dietary badges shown (parsed from JSON) |
| 4 | Transit cards | Route stops and alerts displayed (parsed from JSON) |
| 5 | Card detail modal | Opens without errors for all card types |
| 6 | Chatbot | No crash on empty FAQ data |
| 7 | Dark mode toggle | Theme switches correctly |
| 8 | API fallback | When API down, mock data loads gracefully |
| 9 | WebSocket | Connects, receives notifications |
| 10 | Vite build | Production build succeeds |

### Container Health Verification

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

Expected output (all healthy):
```
NAMES               STATUS
frontend            Up 5 minutes (healthy)
api-gateway         Up 5 minutes (healthy)
websocket           Up 5 minutes (healthy)
event-bus           Up 5 minutes (healthy)
auth-api            Up 10 minutes (healthy)
content-service     Up 10 minutes (healthy)
ai-assistant        Up 10 minutes (healthy)
sentinel_postgres   Up 15 minutes (healthy)
redis-event-bus     Up 15 minutes (healthy)
milvus              Up 15 minutes (healthy)
milvus-etcd         Up 15 minutes (healthy)
milvus-minio        Up 15 minutes (healthy)
```

---

## Operational Commands

### Docker Operations

```bash
# Start all 12 services
docker compose --env-file .env up -d

# Start infrastructure only
docker compose up -d sentinel_postgres redis-event-bus milvus milvus-etcd milvus-minio

# Rebuild and start
docker compose --env-file .env up -d --build

# Stop all
docker compose --env-file .env down

# Stop and remove volumes (fresh start)
docker compose --env-file .env down -v

# View logs
docker compose logs -f

# Specific service logs
docker logs api-gateway -f
docker logs websocket -f
docker logs content-service -f
```

### Local Development Operations

```bash
# Start all local services
start-local.bat

# Stop all local services
stop-local.bat

# Start frontend dev server (separate terminal)
cd frontend && npm.cmd run dev
```

### Database Operations

```bash
# Connect to PostgreSQL
docker exec -it sentinel_postgres psql -U sentinel_admin -d sentinel_sync

# List all tables
docker exec -it sentinel_postgres psql -U sentinel_admin -d sentinel_sync -c "\dt"

# Check cafe items
docker exec -it sentinel_postgres psql -U sentinel_admin -d sentinel_sync -c "SELECT id, name, category FROM cafe_items;"

# Check transit items
docker exec -it sentinel_postgres psql -U sentinel_admin -d sentinel_sync -c "SELECT id, name, type FROM transit_items;"

# Check equipment images
docker exec -it sentinel_postgres psql -U sentinel_admin -d sentinel_sync -c "SELECT name, image_url IS NOT NULL FROM equipment;"

# Seed cafe + transit data
cd backend/auth && venv\Scripts\python.exe seed_cafe_transit.py
```

### Redis Operations

```bash
# Connect to Redis
docker exec -it redis-event-bus redis-cli

# Monitor events in real-time
docker exec -it redis-event-bus redis-cli MONITOR

# Check pub/sub channels
docker exec -it redis-event-bus redis-cli PSUBSCRIBE '*'
```

---

## Troubleshooting

### 1. API Gateway: `ECONNREFUSED` to Backend Services

**Error:** Dashboard returns 500, gateway logs show `ECONNREFUSED`.

**Solution:** Backend services not running. For local dev:
```bash
start-local.bat
# Wait 5 seconds for startup
```

For Docker:
```bash
docker compose up -d auth-api content-service ai-assistant
```

### 2. Content Service: `image_url` Not in Response

**Error:** Equipment response doesn't include `image_url` field.

**Solution:** Pydantic `EquipmentResponse` schema must include `image_url`:
```python
class EquipmentResponse(BaseModel):
    # ... existing fields ...
    image_url: Optional[str] = None
```

Restart content service after model/schema changes.

### 3. Frontend: `Cannot read properties of undefined (reading 'filter')`

**Error:** `chatBotLogic.js:62` — FAQ data items missing `keywords` field.

**Solution:** Added null guard: `const keywords = faq.keywords || [];`

### 4. Frontend: `Cannot read properties of undefined (reading 'split')`

**Error:** `CardDetailModal.jsx` — `formatEquipmentCategory(undefined)`.

**Solution:** Equipment DB has `type` not `category`. Fixed with: `item.category || item.type`.

### 5. WebSocket: First-Try Disconnect in Console

**Error:** `WebSocket connection closed before connection is established`.

**Solution:** React 18 strict mode double-mounts components. Normal behavior — WebSocket auto-reconnects. The `_intentionalClose` flag prevents false reconnection attempts.

### 6. Python Services: `psycopg2-binary` Build Error on Python 3.13

**Error:** `error: Microsoft Visual C++ 14.0 or greater is required` or incompatible wheel.

**Solution:** Use relaxed version: `psycopg2-binary>=2.9.12` in requirements.txt.

### 7. Local Services: `REDIS_HOST` Wrong

**Error:** Content/Auth services can't connect to Redis.

**Solution:** Set `REDIS_HOST=localhost` environment variable. The `start-local.bat` script does this automatically.

---

## Compliance Summary

### OST Compliance — Onboarding & System Truth

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| API Gateway defined | ✅ | Express.js, Port 3000, 15 endpoints |
| WebSocket server defined | ✅ | ws library, Port 8080, Redis pub/sub |
| Event Bus defined | ✅ | ioredis, 5 channels |
| Frontend integration defined | ✅ | api.js + useWebSocket.js |
| Database extensions defined | ✅ | cafe_items, transit_items, image_url |
| Local dev setup documented | ✅ | start-local.bat / stop-local.bat |
| 12-service Docker Compose | ✅ | docker-compose.yml |
| All ports documented | ✅ | 9 service ports mapped |

### FST Compliance — Framework, Stack & Tooling

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Express.js for gateway | ✅ | api-gateway/server.js |
| http-proxy-middleware | ✅ | 6 proxy routes |
| ioredis for Redis | ✅ | Gateway + WebSocket + Event Bus |
| ws for WebSocket | ✅ | services/websocket/server.js |
| helmet for security | ✅ | API Gateway |
| Nginx for frontend | ✅ | frontend/nginx.conf |
| Python 3.13 compat | ✅ | Relaxed requirements.txt |
| Node.js 18+ for all JS services | ✅ | Dockerfiles use node:18-alpine |

### SST Compliance — Services, Streams & Topics

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| API Gateway routes | ✅ | auth, notices, equipment, cafe, transit, ai |
| Dashboard aggregation | ✅ | Promise.allSettled for fault tolerance |
| WebSocket channels | ✅ | cis_events, content.events, equipment.events, notification.events |
| Event Bus channels | ✅ | 5 Redis channels routed |
| Cafe endpoint | ✅ | GET /api/cafe with JSON parsing |
| Transit endpoint | ✅ | GET /api/transit with JSON parsing |
| Equipment image_url | ✅ | DB column + model + schema + serialization |
| Live data loading | ✅ | AppContext useEffect + api.getDashboard() |
| Mock data fallback | ✅ | Try/catch with dynamic import |

### LST Compliance — Libraries, Scripts & Tooling

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| ApiService class | ✅ | frontend/src/services/api.js |
| WebSocketService class | ✅ | frontend/src/services/api.js |
| useWebSocket hook | ✅ | frontend/src/hooks/useWebSocket.js |
| seed_cafe_transit.py | ✅ | 10 cafe + 6 transit items |
| start-local.bat | ✅ | 5 background processes |
| stop-local.bat | ✅ | taskkill by window title |
| Null-safety fixes | ✅ | formatDate, chatBotLogic, categoryLabel |
| WebSocket reconnect | ✅ | Exponential backoff, 10 max attempts |
| _intentionalClose flag | ✅ | React 18 strict mode compat |
| Vite proxy config | ✅ | /api → gateway, /ws → websocket |
| Docker multi-stage build | ✅ | Frontend: node build + nginx serve |
| Production build verified | ✅ | ~407 kB JS, ~44 kB CSS |

---

## References

- [Express.js Documentation](https://expressjs.com/)
- [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware)
- [ws (WebSocket) Documentation](https://github.com/websockets/ws)
- [ioredis Documentation](https://redis.github.io/ioredis/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Vite Proxy Configuration](https://vitejs.dev/config/server-options.html)
- [React 18 Strict Mode](https://react.dev/reference/react/StrictMode)
- [Docker Compose](https://docs.docker.com/compose/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [PostgreSQL 16](https://www.postgresql.org/docs/16/)
- [Redis Pub/Sub](https://redis.io/docs/manual/pubsub/)

---

**Document Status:** Phase 5 Complete
**Last Updated:** 2026-08-06
**Author:** CIS Community Summer Activity Team
**Version:** v5.0
**Verified:** All 12 Docker containers healthy, all 6 local services functional, live data loading from API, null-safety fixes applied
