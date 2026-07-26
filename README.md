# Sentinel-Sync: The Adaptive Campus Intelligence Hub

---

## Table of Contents

- [Overview](#overview)
- [Project Summary](#project-summary)
- [Phase Overview](#phase-overview)
- [Phase 1 — Database Schema & Infrastructure](#phase-1--database-schema--infrastructure)
- [Phase 2 — Auth API & Redis Event Bus](#phase-2--auth-api--redis-event-bus)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Directory Structure](#directory-structure)
- [API Endpoints](#api-endpoints)
- [Docker Services](#docker-services)
- [Testing](#testing)
- [Operational Commands](#operational-commands)
- [Future Phases](#future-phases)
- [References](#references)

---

## Overview

**Sentinel-Sync** is a decentralized data dashboard for campus services — cafeteria menus, lab equipment availability, library transit tracking, and AI-powered academic FAQ bots. Instead of one monolithic application, it is built as a collection of specialized **microservices** communicating asynchronously via a central **Redis Event Bus**.

The project is developed in phases, each building a foundational layer for the next:

| Phase | Focus | Status |
|-------|-------|--------|
| **Phase 1** | Database schema, PostgreSQL containers, seed data, API contract | ✅ Complete |
| **Phase 2** | JWT auth API, Redis event bus, Docker infrastructure | ✅ Complete |
| **Phase 3** | Service microservices (Cafeteria, Library, Lab) | 🔜 Upcoming |
| **Phase 4** | AI-powered FAQ bot with vector database | 🔜 Upcoming |
| **Phase 5** | Frontend dashboard & real-time UI | 🔜 Upcoming |

---

## Project Summary

### What We Built

| Component | Description | Files |
|-----------|-------------|-------|
| **PostgreSQL Schema** | 4 tables with constraints, triggers, functions, views | `database/schema.sql` |
| **Seed Data** | 5 users, 10 campus services, 15 service logs | `database/test_seed.sql` |
| **Auth API** | FastAPI JWT authentication (register, login, health) | `backend/auth/` (12 files) |
| **Redis Event Bus** | Pub/sub messaging for async inter-service communication | `docker-compose.infra.yml` |
| **Docker Infrastructure** | 3 containers on shared network, all data on D: drive | `docker-compose.infra.yml` |
| **API Contract** | REST API documentation with request/response schemas | `docs/api_contract.md` |
| **Postman Collection** | 11 automated test scenarios | `backend/tests/auth_test.json` |
| **Documentation** | Phase 1 & Phase 2 detailed specs (OST/FST/SST/LST) | `Phase1.md`, `Phase2.md` |

### Key Numbers

| Metric | Value |
|--------|-------|
| Total Files | 20+ |
| Database Tables | 4 (users, campus_services, service_logs, error_logs) |
| Auth API Endpoints | 3 (register, login, health) |
| JWT Claims | 9 (sub, email, roles, iat, exp, jti, iss, aud, type) |
| Redis Event Topics | 3 (event.user.created, event.auth.login, auth.login.locked) |
| Docker Containers | 3 (auth-api, sentinel_postgres, redis-event-bus) |
| Postman Tests | 11 |
| Python Dependencies | 14 |

---

## Phase Overview

### Phase 1: Database Schema & Infrastructure

Phase 1 established the **foundational database layer** for the entire Sentinel-Sync system.

**Deliverables:**
- PostgreSQL schema with 4 normalized tables
- Foreign key relationships and check constraints
- Trigger functions for auto-updating timestamps
- 8 database views for common queries
- 6 utility functions (restock, validation, error handling)
- Static seed data (5 users, 10 services, 15 logs)
- Docker container for PostgreSQL 15.2
- pgAdmin web interface for database management
- API contract documentation

**Tables:**

| Table | Records | Purpose |
|-------|---------|---------|
| `users` | 5 | User profiles and credentials |
| `campus_services` | 10 | Service catalog (labs, cafés, library, transport) |
| `service_logs` | 15 | Audit trail for status changes |
| `error_logs` | 0 | Database error logging |

> 📄 Full details: [`Phase1.md`](Phase1.md)

---

### Phase 2: Auth API & Redis Event Bus

Phase 2 built the **security foundation** and **inter-service communication layer**.

**Deliverables:**
- FastAPI JWT authentication API (register, login, health)
- Redis pub/sub event bus for async messaging
- IP-based rate limiting (5 requests/minute on login)
- Account lockout after 5 failed attempts (15 min)
- Bcrypt password hashing with strength validation
- Docker compose with PostgreSQL + Redis + Auth API
- 11-test Postman collection with JWT claims validation
- Non-root Docker user with health checks

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/register` | Create new user account |
| `POST` | `/login` | Authenticate and get JWT tokens |
| `GET` | `/health` | Service health check |

**Redis Events:**

| Topic | Trigger |
|-------|---------|
| `event.user.created` | New user registration |
| `event.auth.login` | Successful login |
| `auth.login.locked` | Account locked (5 failed attempts) |

> 📄 Full details: [`Phase2.md`](Phase2.md)

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Web Framework** | FastAPI | 0.104.1 |
| **ASGI Server** | Uvicorn | 0.24.0 |
| **JWT Library** | python-jose | 3.3.0 |
| **Password Hashing** | passlib + bcrypt | 1.7.4 / 4.0.1 |
| **ORM** | SQLAlchemy | 2.0.23 |
| **Database** | PostgreSQL | 16-alpine |
| **Cache/Pub-Sub** | Redis | 7.2-alpine |
| **Validation** | Pydantic | 2.4.2 |
| **Rate Limiting** | slowapi | 0.1.9 |
| **Containerization** | Docker + Compose | 20.10+ / 2.15+ |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      SENTINEL-SYNC ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐           │
│  │   CLIENT     │     │  AUTH API    │     │   REDIS      │           │
│  │  (Postman/   │────►│  FastAPI     │────►│  EVENT BUS   │           │
│  │   Frontend)  │     │  :8000       │     │  :6379       │           │
│  └──────────────┘     └──────┬───────┘     └──────┬───────┘           │
│                              │                     │                    │
│                              │                     │  PUBLISH           │
│                              │                     │  ┌───────────────┐│
│                              │                     ├─►│event.user.    ││
│                              │                     │  │created        ││
│                              │                     │  ├───────────────┤│
│                              │                     ├─►│event.auth.    ││
│                              │                     │  │login          ││
│                              │                     │  ├───────────────┤│
│                              │                     ├─►│auth.login.    ││
│                              │                     │  │locked         ││
│                              │                     │  └───────────────┘│
│                              ▼                     │                    │
│                     ┌──────────────┐               │                    │
│                     │  POSTGRESQL  │               │                    │
│                     │  :5432       │               │                    │
│                     │  sentinel_sync               │                    │
│                     └──────────────┘               │                    │
│                                                     │                    │
│  ┌──────────────────────────────────────────────────┘                   │
│  │  MICROSERVICES (Phase 3+)                                             │
│  │  • Cafeteria Service    • Library Service                             │
│  │  • Lab Equipment Svc    • Transport Service                           │
│  │  • FAQ Bot Service      • Notification Service                        │
│  └──────────────────────────────────────────────────────────────────────│
│                                                                         │
│  Network: sentinel_network (Docker bridge)                              │
│  Data: All on D: drive via bind mounts                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.15+
- Git 2.30+

### 1. Clone Repository

```bash
git clone https://github.com/M-Affan01/ZeroToShip-Advanced.git
cd ZeroToShip-Advanced
```

### 2. Start All Services

```bash
docker-compose --env-file .env -f docker-compose.infra.yml up -d
```

### 3. Verify Health

```bash
curl http://localhost:8000/health
```

Expected:
```json
{
  "status": "healthy",
  "services": { "redis": "connected", "database": "connected" },
  "version": "1.0.0"
}
```

### 4. Register a User

```bash
curl -X POST http://localhost:8000/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@campus.edu","password":"Test@12345","full_name":"Test User"}'
```

### 5. Login

```bash
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@campus.edu","password":"Test@12345"}'
```

---

## Environment Configuration

### `.env` File

```env
# Database
POSTGRES_USER=sentinel_admin
POSTGRES_PASSWORD=S3nt1n3l#2026
POSTGRES_DB=sentinel_sync

# Auth API
SECRET_KEY=sentinel-sync-phase2-secret-key-32-chars-minimum!!
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# Redis
REDIS_HOST=redis-event-bus
REDIS_PORT=6379
REDIS_DB=0

# Security
MAX_FAILED_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
RATE_LIMIT_PER_MINUTE=5
CORS_ORIGINS=*
```

### Port Allocation

| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Event Bus |
| Auth API | 8000 | REST API |
| pgAdmin | 5050 | DB Management (Phase 1) |

---

## Directory Structure

```
Pro/
├── .env                              # Environment variables
├── .gitignore                        # Git ignore rules
├── README.md                         # This file
├── Phase1.md                         # Phase 1 documentation
├── Phase2.md                         # Phase 2 documentation
├── docker-compose.infra.yml          # Phase 2: Redis + Auth API + PostgreSQL
├── data/
│   ├── postgres/                     # PostgreSQL data (D: drive)
│   ├── redis/                        # Redis data (D: drive)
│   └── pgadmin/                      # pgAdmin data (D: drive)
├── database/
│   ├── schema.sql                    # Database schema (4 tables, functions, views)
│   ├── test_seed.sql                 # Seed data (5 users, 10 services, 15 logs)
│   └── docker-compose.db.yml         # Phase 1: Database compose
├── docs/
│   └── api_contract.md               # REST API contract
└── backend/
    ├── auth/
    │   ├── main.py                   # FastAPI app + routes
    │   ├── config.py                 # Pydantic settings
    │   ├── database.py               # SQLAlchemy engine
    │   ├── models.py                 # AuthUser ORM model
    │   ├── schemas.py                # Request/response schemas
    │   ├── auth_service.py           # Business logic
    │   ├── jwt_manager.py            # JWT generation/verification
    │   ├── password_hasher.py        # Bcrypt + validation
    │   ├── redis_client.py           # Redis pub/sub
    │   ├── requirements.txt          # Python dependencies
    │   ├── Dockerfile                # Container build
    │   └── .dockerignore             # Build exclusions
    └── tests/
        └── auth_test.json            # Postman collection (11 tests)
```

---

## API Endpoints

### `POST /register` — Create User

```json
// Request
{ "email": "user@campus.edu", "password": "Secure@Pass1", "full_name": "John Doe" }

// Response (201)
{ "message": "User created successfully", "user_id": "uuid", "email": "user@campus.edu", "timestamp": "..." }
```

### `POST /login` — Authenticate

```json
// Request
{ "email": "user@campus.edu", "password": "Secure@Pass1" }

// Response (200)
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "eyJ...",
  "user": { "id": "uuid", "email": "...", "full_name": "...", "roles": ["user"] }
}
```

### `GET /health` — Health Check

```json
// Response (200)
{
  "status": "healthy",
  "timestamp": "...",
  "services": { "redis": "connected", "database": "connected" },
  "version": "1.0.0"
}
```

---

## Docker Services

| Container | Image | Port | Health Check | Data |
|-----------|-------|------|--------------|------|
| `auth-api` | pro-auth-api | 8000 | python urllib | — |
| `sentinel_postgres` | postgres:16-alpine | 5432 | pg_isready | `./data/postgres` |
| `redis-event-bus` | redis:7.2-alpine | 6379 | redis-cli ping | `./data/redis` |

**All data stored on D: drive via bind mounts.** No Docker volumes used.

---

## Testing

### Postman Collection (11 Tests)

| # | Test | Method | Status |
|---|------|--------|--------|
| 1 | Health Check | GET /health | 200 |
| 2 | Register - Valid | POST /register | 201 |
| 3 | Register - Duplicate | POST /register | 409 |
| 4 | Register - Weak Password | POST /register | 400 |
| 5 | Register - Invalid Email | POST /register | 400 |
| 6 | Login - Valid | POST /login | 200 |
| 7 | Login - Invalid Password | POST /login | 401 |
| 8 | Login - Non-existent User | POST /login | 401 |
| 9 | JWT Claims Validation | POST /login | 200 |
| 10 | Account Lockout | POST /login | 403 |
| 11 | Redis Connected | GET /health | 200 |

### Import into Postman

1. Open Postman → **Import**
2. Select `backend/tests/auth_test.json`
3. Set variable `base_url` = `http://localhost:8000`
4. Run with **Collection Runner**

---

## Operational Commands

| Action | Command |
|--------|---------|
| Start all services | `docker-compose --env-file .env -f docker-compose.infra.yml up -d` |
| Stop all services | `docker-compose --env-file .env -f docker-compose.infra.yml down` |
| Rebuild & start | `docker-compose --env-file .env -f docker-compose.infra.yml up -d --build` |
| View logs | `docker-compose --env-file .env -f docker-compose.infra.yml logs -f` |
| Auth API logs | `docker logs auth-api -f` |
| Connect to DB | `docker exec -it sentinel_postgres psql -U sentinel_admin -d sentinel_sync` |
| Connect to Redis | `docker exec -it redis-event-bus redis-cli` |
| Monitor Redis events | `docker exec -it redis-event-bus redis-cli MONITOR` |
| Check containers | `docker ps --format "table {{.Names}}\t{{.Status}}"` |

---

## Future Phases

| Phase | Focus | Key Technologies |
|-------|-------|------------------|
| **Phase 3** | Microservice implementation | FastAPI, Redis events, PostgreSQL |
| **Phase 4** | AI-powered FAQ bot | Vector DB (Pinecone/Chroma), LLM |
| **Phase 5** | Frontend dashboard | React, WebSocket, Real-time UI |

---

## References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [python-jose JWT Library](https://python-jose.readthedocs.io/)
- [SQLAlchemy 2.0](https://docs.sqlalchemy.org/)
- [Redis Pub/Sub](https://redis.io/docs/manual/pubsub/)
- [Docker Compose](https://docs.docker.com/compose/)
- [PostgreSQL 16](https://www.postgresql.org/docs/16/)

---

**Last Updated:** 2026-07-27
**Version:** v2.0
**Author:** CIS Community Summer Activity Team
**Repository:** [ZeroToShip-Advanced](https://github.com/M-Affan01/ZeroToShip-Advanced)
