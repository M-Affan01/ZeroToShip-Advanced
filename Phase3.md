# Sentinel-Sync: Phase 3 — CRUD Microservices & AI Retrieval API

---

## Table of Contents

- [Overview](#overview)
- [Phase 3 Objectives](#phase-3-objectives)
- [OST — Onboarding & System Truth](#ost--onboarding--system-truth)
- [FST — Framework, Stack & Tooling](#fst--framework-stack--tooling)
- [SST — Services, Streams & Topics](#sst--services-streams--topics)
- [LST — Libraries, Scripts & Tooling](#lst--libraries-scripts--tooling)
- [Architecture](#architecture)
- [Directory Structure](#directory-structure)
- [Environment Configuration](#environment-configuration)
- [Content Service — API Endpoints](#content-service--api-endpoints)
- [AI Assistant — API Endpoints](#ai-assistant--api-endpoints)
- [JWT Token Specification](#jwt-token-specification)
- [Redis Event Bus — Phase 3 Topics](#redis-event-bus--phase-3-topics)
- [Database Schema — Phase 3 Tables](#database-schema--phase-3-tables)
- [State Machines](#state-machines)
- [Security](#security)
- [Docker Setup](#docker-setup)
- [Testing](#testing)
- [Operational Commands](#operational-commands)
- [Troubleshooting](#troubleshooting)
- [Compliance Summary](#compliance-summary)

---

## Overview

**Phase 3** delivers two core microservices to the Sentinel-Sync Campus Intelligence Hub:
1. **Content Service** — Full CRUD operations for campus notices and equipment inventory with state machines, Redis event publishing, and auto-expiry scheduling
2. **AI Assistant** — Groq LLM-powered retrieval API with Milvus vector search, SSE streaming, and query feedback collection

### What Phase 3 Delivers

| Component | Description |
|-----------|-------------|
| **Content Service** | FastAPI CRUD for notices & equipment (Port 8001) |
| **AI Assistant** | Groq LLM + Milvus vector search + SSE streaming (Port 8002) |
| **Phase 3 Database Schema** | 6 new tables, 2 views, 1 cleanup function, triggers |
| **Docker Infrastructure** | 8 containers: PostgreSQL, Redis, Milvus stack, Auth, Content, AI |
| **State Machines** | Notice lifecycle (draft→published→archived→deleted) and Equipment lifecycle (available→in_use→maintenance→retired) |

---

## Phase 3 Objectives

| # | Objective | Status |
|---|-----------|--------|
| 1 | Implement Content Service with Notice CRUD endpoints | ✅ |
| 2 | Implement Content Service with Equipment CRUD endpoints | ✅ |
| 3 | Add formal state machines for notices and equipment | ✅ |
| 4 | Implement Redis event publishing on all CRUD operations | ✅ |
| 5 | Add Redis pub/sub event consumer for cross-service events | ✅ |
| 6 | Implement auto-expiry scheduler for notices | ✅ |
| 7 | Add maintenance check scheduler for equipment | ✅ |
| 8 | Implement AI Assistant with Groq LLM integration | ✅ |
| 9 | Implement Milvus vector store with fallback | ✅ |
| 10 | Add SSE streaming for AI queries | ✅ |
| 11 | Add query validation and sanitization | ✅ |
| 12 | Add AI query result caching | ✅ |
| 13 | Add user feedback collection on AI responses | ✅ |
| 14 | Add circuit breaker pattern for all external services | ✅ |
| 15 | Add rate limiting on all endpoints | ✅ |
| 16 | Apply Phase 3 database schema with triggers and views | ✅ |
| 17 | Docker compose with Milvus vector database stack | ✅ |

---

## OST — Onboarding & System Truth

### System Context

| Attribute | Specification |
|-----------|---------------|
| System Name | Sentinel-Sync Campus Intelligence Hub |
| Phase | Phase 3 — CRUD Microservices & AI Retrieval |
| Version | v3.0 |
| Date | 2026-07-29 |
| Content Service URL | `http://localhost:8001` |
| AI Assistant URL | `http://localhost:8002` |
| Auth API URL | `http://localhost:8000` |
| Protocol | HTTP/1.1 (JSON) |
| Authentication | JWT Bearer Token (shared across all services) |

### Scope Boundaries

| In Scope (Phase 3) | Out of Scope (Phase 3) |
|---------------------|------------------------|
| Notice CRUD (create, read, update, delete) | Frontend UI |
| Equipment CRUD (create, read, update, delete) | Role-based access control |
| Notice state machine (draft/published/archived/deleted) | File upload for notices |
| Equipment state machine (available/in_use/maintenance/retired) | Real-time WebSocket notifications |
| AI query with Groq Llama 3.3 | Image/PDF content analysis |
| Milvus vector search with fallback | Custom embedding model training |
| SSE streaming responses | Batch AI query processing |
| Query feedback (thumbs up/down) | Feedback analytics dashboard |
| Redis event publishing on CRUD events | Kafka/RabbitMQ event bus |
| Circuit breaker for external services | Service mesh (Istio/Linkerd) |
| Auto-expiry scheduler for notices | Cron job orchestration |

### Functional Domains

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SENTINEL-SYNC PHASE 3                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   NOTICE     │  │  EQUIPMENT   │  │    AI        │             │
│  │   DOMAIN     │  │  DOMAIN      │  │  DOMAIN      │             │
│  │              │  │              │  │              │             │
│  │  • CRUD      │  │  • CRUD      │  │  • Query     │             │
│  │  • States    │  │  • States    │  │  • Stream    │             │
│  │  • Expiry    │  │  • Maint.    │  │  • Vector    │             │
│  │  • Events    │  │  • Events    │  │  • Feedback  │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   REDIS      │  │  MILVUS      │  │  POSTGRESQL  │             │
│  │   EVENT BUS  │  │  VECTOR DB   │  │  DATABASE    │             │
│  │              │  │              │  │              │             │
│  │  • Pub/Sub   │  │  • Embeddings │  │  • Tables    │             │
│  │  • Cache     │  │  • Search     │  │  • Views     │             │
│  │  • DLQ       │  │  • Fallback   │  │  • Triggers  │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## FST — Framework, Stack & Tooling

### Technology Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Web Framework** | FastAPI | 0.104.1 → latest | Async REST API framework |
| **ASGI Server** | Uvicorn | 0.24.0 → latest | Production ASGI server |
| **JWT Library** | python-jose | 3.3.0 → 3.5.0 | JWT encoding/decoding |
| **ORM** | SQLAlchemy | 2.0.23 → 2.0.51 | Database abstraction |
| **Database Driver** | psycopg2-binary | 2.9.9 → 2.9.12 | PostgreSQL adapter |
| **Validation** | Pydantic | 2.4.2 → 2.13.4 | Request/response validation |
| **Settings** | pydantic-settings | 2.0.3 → 2.14.2 | Environment variable management |
| **Redis Client** | redis-py | 5.0.1 → 8.0.1 | Redis connection & pub/sub |
| **Rate Limiting** | slowapi | 0.1.9 → 0.1.10 | IP-based rate limiting |
| **Email Validation** | email-validator | 2.1.0 → 2.3.0 | Pydantic EmailStr support |
| **Environment** | python-dotenv | 1.0.0 → 1.2.2 | .env file loading |
| **Groq Client** | groq | 0.13.0 → 1.6.0 | Groq API for LLM inference |
| **Vector DB Client** | pymilvus | 2.4.0 → 2.6.17 | Milvus vector database client |
| **HTTP Client** | httpx | 0.26.0 → 0.28.1 | Async HTTP for embeddings |
| **Database** | PostgreSQL | 16-alpine | Primary data store |
| **Cache/Pub-Sub** | Redis | 7.2-alpine | Event bus + caching |
| **Vector Database** | Milvus | 2.4.x | Vector similarity search |
| **Vector Storage** | Milvus MinIO | latest | Milvus object storage |
| **Vector Metadata** | Milvus etcd | latest | Milvus metadata store |
| **Container Runtime** | Docker | 20.10.x+ | Containerization |
| **Orchestration** | Docker Compose | 2.15.x+ | Multi-container management |

### Content Service Requirements

```txt
fastapi>=0.104.1
uvicorn[standard]>=0.24.0
python-jose[cryptography]>=3.3.0
pydantic>=2.4.2
pydantic-settings>=2.0.3
redis>=5.0.1
sqlalchemy>=2.0.23
psycopg2-binary>=2.9.9
python-dotenv>=1.0.0
email-validator>=2.1.0
slowapi>=0.1.9
```

### AI Assistant Requirements

```txt
fastapi>=0.104.1
uvicorn[standard]>=0.24.0
python-jose[cryptography]>=3.3.0
pydantic>=2.7.4
pydantic-settings>=2.0.3
redis>=5.0.1
sqlalchemy>=2.0.23
psycopg2-binary>=2.9.9
python-dotenv>=1.0.0
email-validator>=2.1.0
slowapi>=0.1.9
groq>=0.13.0
pymilvus>=2.4.0,<3.0.0
httpx>=0.26.0
```

### Dockerfiles

**Content Service Dockerfile:**
```dockerfile
FROM python:3.11-slim
RUN groupadd -r appuser && useradd -r -g appuser appuser
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN chown -R appuser:appuser /app
USER appuser
EXPOSE 8001
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=15s \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8001/health')" || exit 1
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
```

**AI Assistant Dockerfile:**
```dockerfile
FROM python:3.11-slim
RUN groupadd -r appuser && useradd -r -g appuser appuser
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN chown -R appuser:appuser /app
USER appuser
EXPOSE 8002
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=15s \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8002/health')" || exit 1
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
```

### .dockerignore (Both Services)

```
__pycache__
*.pyc
*.pyo
.env
.git
.gitignore
.dockerignore
Dockerfile
*.md
.vscode
.idea
```

### Environment Variables (`.env`)

```env
# Database Configuration
POSTGRES_USER=sentinel_admin
POSTGRES_PASSWORD=S3nt1n3l%232026
POSTGRES_DB=sentinel_sync
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
DATABASE_URL=postgresql://sentinel_admin:S3nt1n3l%232026@localhost:5432/sentinel_sync

# Auth API Configuration
SECRET_KEY=your_jwt_secret_key_here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# Redis Configuration
REDIS_HOST=redis-event-bus
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

# Security & Rate Limiting
MAX_FAILED_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
CORS_ORIGINS=*
RATE_LIMIT_PER_MINUTE=5

# AI Assistant — Groq Configuration
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_BASE_URL=https://api.groq.com/openai/v1

# AI Assistant — Milvus Configuration
MILVUS_HOST=milvus
MILVUS_PORT=19530
MILVUS_COLLECTION=campus_guidelines
EMBEDDING_MODEL=text-embedding-3-small
VECTOR_TOP_K=5
SIMILARITY_THRESHOLD=0.65
```

---

## SST — Services, Streams & Topics

### Service Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SENTINEL-SYNC PHASE 3                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐               │
│  │   CLIENT     │────►│   AUTH API   │     │              │               │
│  │  (Postman/   │     │   Port 8000  │     │              │               │
│  │   Frontend)  │     └──────┬───────┘     │              │               │
│  └──────┬───────┘            │             │    REDIS     │               │
│         │                    │  JWT        │  EVENT BUS   │               │
│         │                    │  TOKEN      │  Port 6379   │               │
│         ├────────────────────┼────────────►│              │               │
│         │                    │             │  • content.  │               │
│         │                    │             │    events    │               │
│         │         ┌──────────┼────────────►│  • equipment.│               │
│         │         │          │             │    events    │               │
│         │         │          │             │  • ai.events │               │
│         │         │          │             │  • auth.*    │               │
│         │         │          │             │              │               │
│         ▼         ▼          │             └──────┬───────┘               │
│  ┌──────────────────────┐    │                    │                       │
│  │   CONTENT SERVICE    │    │                    │                       │
│  │   Port 8001          │    │                    │                       │
│  │                      │    │                    │                       │
│  │  • POST /api/notices │    │                    │                       │
│  │  • GET  /api/notices │    │                    │                       │
│  │  • PATCH /api/notices│    │                    │                       │
│  │  • DELETE /api/notices    │                    │                       │
│  │  • POST /api/equip.  │    │                    │                       │
│  │  • GET  /api/equip.  │    │                    │                       │
│  │  • PATCH /api/equip. │    │                    │                       │
│  │  • DELETE /api/equip.│    │                    │                       │
│  └──────────┬───────────┘    │                    │                       │
│             │                │                    │                       │
│             ▼                │                    │                       │
│  ┌──────────────────────┐    │             ┌──────▼───────┐               │
│  │      POSTGRESQL      │    │             │   MILVUS     │               │
│  │      Port 5432       │    │             │  Port 19530  │               │
│  │                      │    │             │              │               │
│  │  Tables:             │    │             │  Collections:│               │
│  │  • notices           │    │             │  • campus_   │               │
│  │  • equipment         │    │             │    guidelines│               │
│  │  • ai_queries        │    │             │              │               │
│  │  • ai_feedback       │    │             └──────▲───────┘               │
│  │  • notice_state_     │    │                    │                       │
│  │    history           │    │                    │                       │
│  │  • equipment_state_  │    │                    │                       │
│  │    history           │    │                    │                       │
│  └──────────────────────┘    │                    │                       │
│                              │                    │                       │
│  ┌──────────────────────┐    │                    │                       │
│  │   AI ASSISTANT       │────┘                    │                       │
│  │   Port 8002          │                         │                       │
│  │                      │                         │                       │
│  │  • POST /api/ai/query│─────────────────────────┘                       │
│  │  • POST /api/ai/     │     (Milvus vector search)                     │
│  │    feedback          │                                                 │
│  │  • GET /health       │                                                 │
│  │                      │  Groq API                                       │
│  │  SSE Streaming       │──────────► https://api.groq.com                │
│  └──────────────────────┘                                                 │
│                                                                             │
│  Network: sentinel_network (Docker bridge)                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Content Service Endpoints

#### `POST /api/notices` — Create Notice

| Property | Value |
|----------|-------|
| Status Code | `201 Created` |
| Content-Type | `application/json` |
| Auth Required | Yes (JWT Bearer) |
| Rate Limit | 60 requests/minute |

**Request Body:**
```json
{
  "title": "Campus Science Fair",
  "content": "Annual science fair next Monday at the main auditorium.",
  "category": "event",
  "priority": "high",
  "status": "published",
  "expires_at": "2026-08-15T23:59:59Z"
}
```

**Response (201):**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "title": "Campus Science Fair",
  "content": "Annual science fair next Monday at the main auditorium.",
  "category": "event",
  "priority": "high",
  "status": "draft",
  "expires_at": "2026-08-15T23:59:59Z",
  "created_at": "2026-07-29T10:30:00Z",
  "updated_at": "2026-07-29T10:30:00Z",
  "version": 1
}
```

**Validation Rules:**

| Field | Type | Constraints | Business Rule |
|-------|------|-------------|---------------|
| `title` | string | Required, max 200 chars | Non-empty, XSS-sanitized |
| `content` | string | Required, max 5000 chars | Non-empty, XSS-sanitized |
| `category` | enum | Required | One of: `academic`, `administrative`, `event`, `emergency`, `general` |
| `priority` | enum | Optional, default `medium` | One of: `low`, `medium`, `high`, `urgent` |
| `status` | enum | Optional, default `draft` | One of: `draft`, `published`, `archived`, `deleted` |
| `expires_at` | datetime | Optional | Must be in the future if provided |

**Duplicate Detection:** Returns `400` if a notice with the same title was created within the last 24 hours.

**Error Responses:**

| Code | Condition | Detail |
|------|-----------|--------|
| `400` | Duplicate notice | `"Similar notice was created within the last 24 hours"` |
| `400` | Invalid data | `"Validation error: ..."` |
| `401` | No token | `"Authentication required"` |
| `401` | Invalid token | `"Invalid token"` |
| `429` | Rate limit | `"Rate limit exceeded"` |

#### `GET /api/notices` — List Notices

| Property | Value |
|----------|-------|
| Status Code | `200 OK` |
| Auth Required | No |
| Query Params | `skip`, `limit`, `status`, `category` |

**Response (200):**
```json
[
  {
    "id": "uuid",
    "title": "Campus Science Fair",
    "content": "Annual science fair...",
    "category": "event",
    "priority": "high",
    "status": "published",
    "expires_at": "2026-08-15T23:59:59Z",
    "created_at": "2026-07-29T10:30:00Z",
    "updated_at": "2026-07-29T10:30:00Z",
    "version": 1
  }
]
```

#### `GET /api/notices/{id}` — Get Notice by ID

| Property | Value |
|----------|-------|
| Status Code | `200 OK` or `404 Not Found` |
| Auth Required | No |
| Response | Single notice object |

#### `PATCH /api/notices/{id}` — Update Notice

| Property | Value |
|----------|-------|
| Status Code | `200 OK` |
| Auth Required | Yes |
| Rate Limit | 60 requests/minute |

**Request Body (partial update):**
```json
{
  "title": "Updated Title",
  "priority": "urgent",
  "status": "published"
}
```

**Features:**
- Version increment on every update
- State machine validation (e.g., can't publish from archived)
- State history recorded
- Redis event `content.updated` published
- Cache invalidation for updated notice and list caches

#### `DELETE /api/notices/{id}` — Delete Notice (Soft Delete)

| Property | Value |
|----------|-------|
| Status Code | `200 OK` |
| Auth Required | Yes |
| Behavior | Sets `deleted_at` timestamp, transitions to `deleted` state |

---

### Content Service — Equipment Endpoints

#### `POST /api/equipment` — Create Equipment

**Request Body:**
```json
{
  "name": "Projector HD-500",
  "type": "projector",
  "location": "Main Auditorium",
  "status": "available",
  "maintenance_schedule": "2026-09-01T09:00:00Z"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "Projector HD-500",
  "type": "projector",
  "location": "Main Auditorium",
  "status": "available",
  "maintenance_schedule": "2026-09-01T09:00:00Z",
  "created_at": "2026-07-29T10:30:00Z",
  "updated_at": "2026-07-29T10:30:00Z",
  "version": 1
}
```

**Validation Rules:**

| Field | Type | Constraints | Business Rule |
|-------|------|-------------|---------------|
| `name` | string | Required, max 100 chars | Non-empty, XSS-sanitized |
| `type` | string | Required, max 50 chars | e.g., projector, laptop, lab_equipment |
| `location` | string | Optional, max 200 chars | Physical campus location |
| `status` | enum | Optional, default `available` | One of: `available`, `in_use`, `maintenance`, `retired` |
| `maintenance_schedule` | datetime | Optional | Next scheduled maintenance |

#### `GET /api/equipment` — List Equipment

**Query Params:** `skip`, `limit`, `status`, `type`

#### `GET /api/equipment/{id}` — Get Equipment by ID

#### `PATCH /api/equipment/{id}` — Update Equipment

**Features:**
- State machine validation
- `status_changed_at` updated on status change
- State history recorded
- Redis event `equipment.status_changed` published

#### `DELETE /api/equipment/{id}` — Delete Equipment (Soft Delete)

---

### AI Assistant Endpoints

#### `POST /api/ai/query` — Process AI Query

| Property | Value |
|----------|-------|
| Status Code | `200 OK` or `200 OK` (SSE stream) |
| Content-Type | `application/json` or `text/event-stream` |
| Auth Required | Yes (JWT Bearer) |
| Rate Limit | 30 requests/minute |

**Request Body:**
```json
{
  "query": "What are the library hours?",
  "stream": false,
  "session_id": "optional-uuid-for-context"
}
```

**Response (non-streaming, 200):**
```json
{
  "query_id": "uuid",
  "response": "Library hours are 7:00 AM to 11:00 PM Monday through Friday...",
  "context": [
    {
      "source": "Campus Guidelines - Library Services",
      "section": "Hours of Operation",
      "relevance": 0.85,
      "excerpt": "Library hours are 7:00 AM to 11:00 PM..."
    }
  ],
  "confidence": 0.85,
  "processing_time_ms": 643
}
```

**Response (streaming, SSE):**
```
data: {"type": "chunk", "data": {"content": "Library ", "query_id": "uuid"}}

data: {"type": "chunk", "data": {"content": "hours are 7:00 AM...", "query_id": "uuid"}}

data: {"type": "complete", "data": {"query_id": "uuid", "response": "...", "context": [...], "confidence": 0.85, "processing_time_ms": 643}}
```

**Query Validation Rules:**

| Rule | Check |
|------|-------|
| Empty check | `len(query.strip()) >= 1` |
| Max length | `len(query) <= 500` |
| XSS sanitization | Strip HTML tags |
| Malicious patterns | Block `<script`, `DROP TABLE`, `DELETE FROM`, `SELECT.*FROM`, `INSERT INTO`, `UNION SELECT` |
| Post-sanitization | Reject if empty after sanitization |

**AI Processing Pipeline:**
1. Validate and sanitize query
2. Check cache (MD5-hashed query key)
3. Record query in `ai_queries` table
4. Perform Milvus vector search (top-k=5, threshold=0.65)
5. If no results → fallback response
6. Build prompt with context from vector search results
7. Call Groq API (Llama 3.3 70B) for response generation
8. Record response and metadata in `ai_queries`
9. Cache result (TTL: 3600 seconds)
10. Publish `ai.response.generated` event to Redis

#### `POST /api/ai/feedback` — Submit Feedback

**Request Body:**
```json
{
  "query_id": "uuid",
  "rating": 5,
  "feedback": "Very helpful response"
}
```

**Response (201):**
```json
{
  "message": "Feedback recorded successfully",
  "feedback_id": "uuid"
}
```

#### `GET /health` — Health Check

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2026-07-29T10:30:00Z",
  "services": {
    "redis": "connected",
    "database": "connected",
    "milvus": "connected",
    "circuit_breakers": {},
    "cache": {"hits": 10, "misses": 5, "hit_rate": 0.67}
  },
  "version": "1.0.0"
}
```

---

## JWT Token Specification

### Access Token Payload

| Claim | Type | Value | Description |
|-------|------|-------|-------------|
| `sub` | string | UUID | User ID |
| `email` | string | email | User email |
| `roles` | array | ["user"] | User roles |
| `iat` | int | timestamp | Issued at |
| `exp` | int | timestamp | Expiration (default: 60 min) |
| `jti` | string | UUID | Unique token ID |
| `iss` | string | `"auth-api"` | Issuer |
| `aud` | string | `"microservices"` | Audience |
| `type` | string | `"access"` | Token type |

### Token Verification

All three services (Auth API, Content Service, AI Assistant) share the same `SECRET_KEY` and verify JWT tokens independently:

```python
payload = jwt.decode(
    token,
    settings.SECRET_KEY,
    algorithms=[settings.JWT_ALGORITHM],
    options={"verify_aud": False}  # Audience verification disabled for cross-service
)
```

---

## Redis Event Bus — Phase 3 Topics

### Event Topics

| Topic | Publisher | Trigger | Payload |
|-------|-----------|---------|---------|
| `content.events` | Content Service | Notice CRUD | `event_type`, `entity_type`, `entity_id`, `data`, `timestamp` |
| `equipment.events` | Content Service | Equipment CRUD | `event_type`, `entity_type`, `entity_id`, `changes`, `timestamp` |
| `ai.events` | AI Assistant | AI query completed | `event_type`, `query_id`, `confidence`, `processing_time_ms`, `timestamp` |
| `event.user.created` | Auth API | User registration | `user_id`, `email`, `timestamp` |
| `event.auth.login` | Auth API | Successful login | `user_id`, `timestamp`, `ip` |
| `auth.login.locked` | Auth API | Account locked | `user_id`, `timestamp` |

### Event Types Published

| Event Type | Source | When |
|------------|--------|------|
| `content.created` | Content Service | New notice created |
| `content.updated` | Content Service | Notice updated |
| `content.deleted` | Content Service | Notice deleted |
| `content.expired` | Content Service | Notice auto-expired by scheduler |
| `equipment.created` | Content Service | New equipment created |
| `equipment.status_changed` | Content Service | Equipment status transition |
| `equipment.deleted` | Content Service | Equipment deleted |
| `ai.response.generated` | AI Assistant | AI query processed |

### Event Envelope Format

```json
{
  "event_type": "content.created",
  "entity_type": "notice",
  "entity_id": "uuid",
  "data": {
    "title": "Campus Science Fair",
    "category": "event",
    "priority": "high",
    "status": "published"
  },
  "timestamp": "2026-07-29T10:30:00.000000"
}
```

### Dead Letter Queue (DLQ)

Failed event publishing is retried 3 times, then routed to a dead letter queue:

| DLQ Channel | Purpose |
|-------------|---------|
| `dlq:content.events` | Failed content events |
| `dlq:equipment.events` | Failed equipment events |
| `dlq:ai.events` | Failed AI events |

---

## Database Schema — Phase 3 Tables

### Entity Relationship Diagram

```
┌──────────────────┐         ┌──────────────────────────────┐
│     notices      │         │    notice_state_history       │
├──────────────────┤         ├──────────────────────────────┤
│ PK id (UUID)     │◄────────┤ FK notice_id                 │
│    title         │         │ PK id (UUID)                 │
│    content       │         │    from_state                │
│    category      │         │    to_state                  │
│    priority      │         │    trigger_name              │
│    status        │         │    user_id                   │
│    expires_at    │         │    extra_data (JSONB)        │
│    created_at    │         │    created_at                │
│    updated_at    │         └──────────────────────────────┘
│    deleted_at    │
│    version       │         ┌──────────────────────────────┐
│    created_by    │         │   equipment_state_history     │
│    updated_by    │         ├──────────────────────────────┤
└──────────────────┘         │ PK id (UUID)                 │
                             │ FK equipment_id              │
┌──────────────────┐         │    from_state                │
│    equipment     │         │    to_state                  │
├──────────────────┤         │    trigger_name              │
│ PK id (UUID)     │◄────────┤    user_id                   │
│    name          │         │    extra_data (JSONB)        │
│    type          │         │    created_at                │
│    location      │         └──────────────────────────────┘
│    status        │
│    maintenance_  │         ┌──────────────────────────────┐
│      schedule    │         │       ai_queries             │
│    created_at    │         ├──────────────────────────────┤
│    updated_at    │         │ PK id (UUID)                 │
│    deleted_at    │         │    query_text                │
│    version       │         │ FK session_id                │
│    created_by    │         │ FK user_id                   │
│    updated_by    │         │    response_text             │
│    status_       │         │    context_sources (JSONB)   │
│      changed_at  │         │    confidence                │
└──────────────────┘         │    processing_time_ms        │
                             │    created_at                │
┌──────────────────┐         └──────────────────────────────┘
│   ai_feedback    │
├──────────────────┤         ┌──────────────────────────────┐
│ PK id (UUID)     │         │    v_active_notices (VIEW)   │
│ FK query_id      │         ├──────────────────────────────┤
│    rating        │         │ All published notices        │
│    feedback      │         │ where expires_at > NOW()     │
│    created_at    │         └──────────────────────────────┘
└──────────────────┘
                             ┌──────────────────────────────┐
                             │ v_equipment_summary (VIEW)   │
                             ├──────────────────────────────┤
                             │ Equipment counts by          │
                             │ type and status              │
                             └──────────────────────────────┘
```

### Table: `notices`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid4() | Unique notice identifier |
| `title` | VARCHAR(200) | NOT NULL | Notice title |
| `content` | TEXT | NOT NULL | Notice body content |
| `category` | VARCHAR(50) | NOT NULL, CHECK IN ('academic','administrative','event','emergency','general') | Notice category |
| `priority` | VARCHAR(50) | NOT NULL, DEFAULT 'medium', CHECK IN ('low','medium','high','urgent') | Priority level |
| `status` | VARCHAR(50) | NOT NULL, DEFAULT 'draft', CHECK IN ('draft','published','archived','deleted') | Current lifecycle state |
| `expires_at` | TIMESTAMPTZ | NULLABLE | Auto-expiry timestamp |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |
| `deleted_at` | TIMESTAMPTZ | NULLABLE | Soft delete timestamp |
| `version` | INTEGER | DEFAULT 1 | Optimistic lock version |
| `created_by` | UUID | NULLABLE | Creator user ID |
| `updated_by` | UUID | NULLABLE | Last updater user ID |

**Indexes:**
- `idx_notices_status_created` ON `(status, created_at)` — Filter by status + time ordering
- `idx_notices_category` ON `(category)` — Category-based filtering
- `idx_notices_expires` ON `(expires_at)` WHERE `expires_at IS NOT NULL` — Auto-expiry queries

### Table: `equipment`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid4() | Unique equipment identifier |
| `name` | VARCHAR(100) | NOT NULL | Equipment name |
| `type` | VARCHAR(50) | NOT NULL | Equipment type |
| `location` | VARCHAR(200) | NULLABLE | Physical location |
| `status` | VARCHAR(50) | NOT NULL, DEFAULT 'available' | Current status |
| `maintenance_schedule` | TIMESTAMPTZ | NULLABLE | Next maintenance date |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |
| `deleted_at` | TIMESTAMPTZ | NULLABLE | Soft delete timestamp |
| `version` | INTEGER | DEFAULT 1 | Optimistic lock version |
| `created_by` | UUID | NULLABLE | Creator user ID |
| `updated_by` | UUID | NULLABLE | Last updater user ID |
| `status_changed_at` | TIMESTAMPTZ | DEFAULT NOW() | Last status change timestamp |

**Indexes:**
- `idx_equipment_status` ON `(status)` — Status filtering
- `idx_equipment_type_status` ON `(type, status)` — Type + status filtering

### Table: `ai_queries`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Query identifier |
| `query_text` | TEXT | NOT NULL | Sanitized query text |
| `session_id` | UUID | NULLABLE, FK → auth_users.id | Session grouping |
| `user_id` | UUID | NOT NULL, FK → auth_users.id | Querying user |
| `response_text` | TEXT | NULLABLE | AI-generated response |
| `context_sources` | JSONB | NULLABLE | Vector search results used |
| `confidence` | FLOAT | NULLABLE | Average relevance score |
| `processing_time_ms` | INTEGER | NULLABLE | End-to-end latency |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Query timestamp |

**Indexes:**
- `idx_ai_queries_user` ON `(user_id)` — User query history
- `idx_ai_queries_created` ON `(created_at)` — Time-based queries

### Table: `ai_feedback`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Feedback identifier |
| `query_id` | UUID | FK → ai_queries.id | Associated query |
| `rating` | INTEGER | NOT NULL, CHECK (1-5) | User rating |
| `feedback` | TEXT | NULLABLE | Free-text feedback |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Feedback timestamp |

**Indexes:**
- `idx_ai_feedback_query` ON `(query_id)` — Query feedback lookup

### Table: `notice_state_history`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | History entry ID |
| `notice_id` | UUID | FK → notices.id | Related notice |
| `from_state` | VARCHAR(50) | NOT NULL | Previous state |
| `to_state` | VARCHAR(50) | NOT NULL | New state |
| `trigger_name` | VARCHAR(50) | NULLABLE | Action that caused transition |
| `user_id` | UUID | NULLABLE | User who triggered |
| `extra_data` | JSONB | NULLABLE | Change details (column: `metadata`) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Transition timestamp |

### Table: `equipment_state_history`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | History entry ID |
| `equipment_id` | UUID | FK → equipment.id | Related equipment |
| `from_state` | VARCHAR(50) | NOT NULL | Previous state |
| `to_state` | VARCHAR(50) | NOT NULL | New state |
| `trigger_name` | VARCHAR(50) | NULLABLE | Action that caused transition |
| `user_id` | UUID | NULLABLE | User who triggered |
| `extra_data` | JSONB | NULLABLE | Change details (column: `metadata`) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Transition timestamp |

### Views

| View | Purpose |
|------|---------|
| `v_active_notices` | Published notices that haven't expired |
| `v_equipment_summary` | Equipment counts grouped by type and status |

### Trigger Functions

| Function | Purpose | Trigger |
|----------|---------|---------|
| `update_notices_timestamp()` | Auto-update `updated_at` on notice UPDATE | `trg_notices_updated` |
| `update_equipment_timestamp()` | Auto-update `updated_at` on equipment UPDATE | `trg_equipment_updated` |

### Cleanup Function

| Function | Purpose |
|----------|---------|
| `cleanup_old_records()` | Delete soft-deleted notices/equipment older than 90 days, purge ai_queries older than 180 days |

---

## State Machines

### Notice State Machine

```
┌─────────────────────────────────────────────────────────────────┐
│                    NOTICE STATE MACHINE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    publish     ┌──────────────┐                  │
│  │  DRAFT   │ ─────────────► │  PUBLISHED   │                  │
│  └────┬─────┘                └──┬───┬───┬───┘                  │
│       │                         │   │   │                       │
│       │ delete                  │   │   │ archive               │
│       │                         │   │   │                       │
│       ▼                         │   │   ▼                       │
│  ┌──────────┐                   │   │  ┌──────────┐            │
│  │ DELETED  │                   │   │  │ ARCHIVED │            │
│  └──────────┘                   │   │  └────┬─────┘            │
│                                 │   │       │                   │
│                      unpublish  │   │       │ renew             │
│                                 │   │       │                   │
│                                 │   │       ▼                   │
│                                 │   │  ┌──────────┐            │
│                                 │   └─►│ PUBLISHED│            │
│                                 │      └──────────┘            │
│                                                                 │
│  Rules:                                                        │
│  • draft → published (publish)                                 │
│  • draft → deleted (delete)                                    │
│  • published → draft (unpublish)                               │
│  • published → archived (expire/archive)                       │
│  • published → deleted (delete)                                │
│  • archived → published (renew)                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Equipment State Machine

```
┌─────────────────────────────────────────────────────────────────┐
│                   EQUIPMENT STATE MACHINE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────┐  checkout  ┌──────────┐                       │
│  │ AVAILABLE  │ ─────────► │ IN_USE   │                       │
│  └──┬──┬──┬───┘            └──┬──┬──┬─┘                       │
│     │  │  │                   │  │  │                          │
│     │  │  │ retire            │  │  │ report_issue             │
│     │  │  │                   │  │  │                          │
│     │  │  ▼                   │  │  ▼                          │
│     │  │ ┌──────────┐        │  │ ┌──────────────┐            │
│     │  │ │ RETIRED  │◄───────┘  │ │ MAINTENANCE  │            │
│     │  │ └──────────┘  retire   │ └──────┬───────┘            │
│     │  │                        │        │                     │
│     │  │ maintain               │        │ complete            │
│     │  │                        │        │                     │
│     │  ▼                        │        ▼                     │
│     │ ┌──────────────┐         │   ┌────────────┐             │
│     │ │ MAINTENANCE  │◄────────┘   │ AVAILABLE  │             │
│     │ └──────┬───────┘             └──────▲─────┘             │
│     │        │                            │                     │
│     │        │ retire            return   │                     │
│     │        │                            │                     │
│     │        ▼                            │                     │
│     │   ┌──────────┐                     │                     │
│     └──►│ RETIRED  │─────────────────────┘                     │
│         └──────────┘  restore                                   │
│                                                                 │
│  Rules:                                                        │
│  • available → in_use (checkout)                               │
│  • available → maintenance (maintain)                          │
│  • available → retired (retire)                                │
│  • in_use → available (return)                                 │
│  • in_use → maintenance (report_issue)                         │
│  • in_use → retired (retire)                                   │
│  • maintenance → available (complete)                          │
│  • maintenance → retired (retire)                              │
│  • retired → available (restore)                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security

### Authentication

All protected endpoints require a valid JWT Bearer token:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Input Validation

| Service | Validation | Implementation |
|---------|------------|----------------|
| Content Service | XSS sanitization (strip HTML tags) | `notice_service.py`, `equipment_service.py` |
| Content Service | SQL injection prevention (regex patterns) | `main.py` |
| Content Service | Duplicate notice detection (24h window) | `notice_service.py` |
| Content Service | Title length 1-200, content length 1-5000 | `schemas.py` |
| AI Assistant | Query length 1-500 characters | `query_service.py` |
| AI Assistant | Malicious pattern blocking (SQL injection, XSS) | `query_service.py` |
| AI Assistant | Post-sanitization empty check | `query_service.py` |

### Rate Limiting

| Service | Endpoint | Limit | Key |
|---------|----------|-------|-----|
| Content Service | All endpoints | 60/minute | IP address |
| AI Assistant | All endpoints | 30/minute | IP address |
| Auth API | `/login` | 5/minute | IP address |

### Circuit Breaker

| Service | External Dependency | Failure Threshold | Recovery |
|---------|--------------------|--------------------|----------|
| AI Assistant | Groq API | 5 failures | 30 seconds |
| AI Assistant | Milvus | 5 failures | 30 seconds |
| Content Service | Redis | 5 failures | 30 seconds |

**Circuit Breaker States:**
- **Closed** — Normal operation, requests pass through
- **Open** — Too many failures, requests blocked, fallback used
- **Half-Open** — Trial requests allowed to test recovery

### Docker Security

| Measure | Implementation |
|---------|----------------|
| Non-root user | `appuser` in both Dockerfiles |
| .dockerignore | Prevents `.env`, `.git`, `__pycache__` in images |
| No secrets in image | Environment variables passed at runtime only |
| Health checks | All services have Docker health checks |

---

## Docker Setup

### Container Architecture (8 Services)

| Service | Container | Port | Image | Health Check | Purpose |
|---------|-----------|------|-------|--------------|---------|
| PostgreSQL | `sentinel_postgres` | 5432 | postgres:16-alpine | `pg_isready` | Primary database |
| Redis | `redis-event-bus` | 6379 | redis:7.2-alpine | `redis-cli ping` | Event bus + cache |
| Milvus | `milvus` | 19530 | milvusdb/milvus | HTTP `/healthz` | Vector database |
| Milvus etcd | `milvus-etcd` | 2379 | quay.io/coreos/etcd | `etcdctl endpoint health` | Milvus metadata |
| Milvus MinIO | `milvus-minio` | 9000 | minio/minio | HTTP `/minio/health/live` | Milvus object storage |
| Auth API | `auth-api` | 8000 | pro-auth-api | python urllib | Authentication |
| Content Service | `content-service` | 8001 | pro-content-service | python urllib | CRUD operations |
| AI Assistant | `ai-assistant` | 8002 | pro-ai-assistant | python urllib | AI queries |

### Port Allocation

| Service | Host Port | Container Port | Purpose |
|---------|-----------|----------------|---------|
| PostgreSQL | 5432 | 5432 | Database connections |
| Redis | 6379 | 6379 | Event bus connections |
| Milvus | 19530 | 19530 | Vector DB connections |
| Milvus Web UI | 9091 | 9091 | Milvus management |
| MinIO | 9000-9001 | 9000-9001 | Object storage |
| Auth API | 8000 | 8000 | Auth REST API |
| Content Service | 8001 | 8001 | Content REST API |
| AI Assistant | 8002 | 8002 | AI REST API |

### Quick Start

```bash
# Start all services (with build)
docker compose -f docker-compose.infra.yml up --build -d

# Check status
docker ps --format "table {{.Names}}\t{{.Status}}"

# Apply Phase 3 schema (if not auto-applied)
Get-Content database/phase3_schema.sql -Raw | docker exec -i sentinel_postgres psql -U sentinel_admin -d sentinel_sync

# Verify all healthy
docker ps --filter "health=healthy" --format "{{.Names}}"
```

### Data Persistence

| Service | Storage Type | Location |
|---------|-------------|----------|
| PostgreSQL | Docker volume | `postgres_data` |
| Redis | Docker volume | `redis_data` |
| MinIO | Docker volume | `milvus_minio_data` |
| etcd | Docker volume | `milvus_etcd_data` |

---

## Directory Structure

```
Pro/
├── .env                                    # All environment variables
├── .gitignore                              # Git ignore rules
├── README.md                               # Main project documentation
├── Phase1.md                               # Phase 1 documentation
├── Phase2.md                               # Phase 2 documentation
├── Phase3.md                               # This file (Phase 3 documentation)
├── docker-compose.infra.yml                # All services compose (8 containers)
├── database/
│   ├── schema.sql                          # Phase 1: Original schema
│   ├── test_seed.sql                       # Phase 1: Seed data
│   ├── phase3_schema.sql                   # Phase 3: New tables, views, triggers
│   └── docker-compose.db.yml               # Phase 1: Database compose
├── backend/
│   ├── auth/
│   │   ├── main.py                         # FastAPI app + routes
│   │   ├── config.py                       # Pydantic settings
│   │   ├── database.py                     # SQLAlchemy engine
│   │   ├── models.py                       # AuthUser ORM model
│   │   ├── schemas.py                      # Request/response schemas
│   │   ├── auth_service.py                 # Registration & login logic
│   │   ├── jwt_manager.py                  # JWT generation/verification
│   │   ├── password_hasher.py              # Bcrypt + validation
│   │   ├── redis_client.py                 # Redis pub/sub
│   │   ├── requirements.txt                # Python dependencies
│   │   ├── Dockerfile                      # Container build
│   │   └── .dockerignore                   # Build exclusions
│   └── tests/
│       └── auth_test.json                  # Postman collection (11 tests)
├── services/
│   ├── content_service/
│   │   ├── main.py                         # FastAPI app + CRUD routes
│   │   ├── config.py                       # Pydantic settings
│   │   ├── database.py                     # SQLAlchemy engine
│   │   ├── models.py                       # Notice, Equipment, StateHistory models
│   │   ├── schemas.py                      # Request/response schemas
│   │   ├── notice_service.py               # Notice CRUD business logic
│   │   ├── equipment_service.py            # Equipment CRUD business logic
│   │   ├── state_machine.py                # Formal state machines
│   │   ├── redis_client.py                 # Redis pub/sub + DLQ
│   │   ├── cache_manager.py                # Redis caching with TTL
│   │   ├── circuit_breaker.py              # Circuit breaker pattern
│   │   ├── event_consumer.py               # Redis event subscriber
│   │   ├── scheduler.py                    # Auto-expiry & maintenance scheduler
│   │   ├── requirements.txt                # Python dependencies
│   │   ├── Dockerfile                      # Container build
│   │   └── .dockerignore                   # Build exclusions
│   └── ai_assistant/
│       ├── main.py                         # FastAPI app + AI routes
│       ├── config.py                       # Pydantic settings
│       ├── database.py                     # SQLAlchemy engine
│       ├── models.py                       # AIQuery, AIFeedback models
│       ├── schemas.py                      # Request/response schemas
│       ├── query_service.py                # Query processing pipeline
│       ├── langchain_service.py            # Groq LLM integration (via groq SDK)
│       ├── vector_store.py                 # Milvus vector search + fallback
│       ├── redis_client.py                 # Redis pub/sub + DLQ
│       ├── cache_manager.py                # AI query caching
│       ├── circuit_breaker.py              # Circuit breaker pattern
│       ├── requirements.txt                # Python dependencies
│       ├── Dockerfile                      # Container build
│       └── .dockerignore                   # Build exclusions
└── docs/
    └── api_contract.md                     # API contract documentation
```

---

## Testing

### End-to-End Test Flow

```bash
# 1. Register a user
curl -X POST http://localhost:8000/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin@123","full_name":"Admin User"}'

# 2. Login and get JWT
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin@123"}'
# → Save access_token from response

# 3. Create a notice
curl -X POST http://localhost:8001/api/notices \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Campus Science Fair","content":"Annual science fair next Monday","category":"event","priority":"high","status":"published"}'

# 4. Create equipment
curl -X POST http://localhost:8001/api/equipment \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Projector HD-500","type":"projector","location":"Main Auditorium","status":"available"}'

# 5. AI query (non-streaming)
curl -X POST http://localhost:8002/api/ai/query \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"query":"What are the library hours?","stream":false}'

# 6. AI query (streaming)
curl -X POST http://localhost:8002/api/ai/query \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"query":"What is the WiFi password?","stream":true}'

# 7. Submit feedback
curl -X POST http://localhost:8002/api/ai/feedback \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"query_id":"<QUERY_UUID>","rating":5,"feedback":"Very helpful"}'

# 8. Health checks
curl http://localhost:8000/health
curl http://localhost:8001/health
curl http://localhost:8002/health
```

### Verified Test Results

| # | Test | Method | Endpoint | Expected | Actual |
|---|------|--------|----------|----------|--------|
| 1 | Register user | POST | `/register` | 201 | ✅ 201 |
| 2 | Login | POST | `/login` | 200 | ✅ 200 |
| 3 | Create notice | POST | `/api/notices` | 201 | ✅ 201 |
| 4 | Create equipment | POST | `/api/equipment` | 201 | ✅ 201 |
| 5 | AI query (non-stream) | POST | `/api/ai/query` | 200 | ✅ 200 |
| 6 | AI query (stream) | POST | `/api/ai/query` | 200 (SSE) | ✅ 200 |
| 7 | Submit feedback | POST | `/api/ai/feedback` | 201 | ✅ 201 |
| 8 | Health checks | GET | `/health` | 200 | ✅ 200 |

### Container Health Verification

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

Expected output (all healthy):
```
NAMES               STATUS
ai-assistant        Up 5 minutes (healthy)
content-service     Up 5 minutes (healthy)
auth-api            Up 10 minutes (healthy)
milvus              Up 10 minutes (healthy)
sentinel_postgres   Up 10 minutes (healthy)
milvus-etcd         Up 10 minutes (healthy)
milvus-minio        Up 10 minutes (healthy)
redis-event-bus     Up 15 minutes (healthy)
```

---

## Operational Commands

### Start Services

```bash
# Start all Phase 3 services
docker compose -f docker-compose.infra.yml up -d

# Start with rebuild
docker compose -f docker-compose.infra.yml up -d --build

# Start specific service
docker compose -f docker-compose.infra.yml up -d content-service
docker compose -f docker-compose.infra.yml up -d ai-assistant
```

### Stop Services

```bash
# Stop all services
docker compose -f docker-compose.infra.yml down

# Stop and remove volumes
docker compose -f docker-compose.infra.yml down -v
```

### View Logs

```bash
# All services
docker compose -f docker-compose.infra.yml logs -f

# Specific service
docker logs content-service -f
docker logs ai-assistant -f
docker logs auth-api -f
```

### Database Operations

```bash
# Connect to PostgreSQL
docker exec -it sentinel_postgres psql -U sentinel_admin -d sentinel_sync

# List all tables
docker exec -it sentinel_postgres psql -U sentinel_admin -d sentinel_sync -c "\dt"

# Check notices
docker exec -it sentinel_postgres psql -U sentinel_admin -d sentinel_sync -c "SELECT id, title, status FROM notices;"

# Check AI queries
docker exec -it sentinel_postgres psql -U sentinel_admin -d sentinel_sync -c "SELECT id, query_text, confidence FROM ai_queries;"

# Apply Phase 3 schema
Get-Content database/phase3_schema.sql -Raw | docker exec -i sentinel_postgres psql -U sentinel_admin -d sentinel_sync
```

### Redis Operations

```bash
# Connect to Redis CLI
docker exec -it redis-event-bus redis-cli

# Monitor events in real-time
docker exec -it redis-event-bus redis-cli MONITOR

# Check connected clients
docker exec -it redis-event-bus redis-cli INFO clients
```

### Milvus Operations

```bash
# Check Milvus health
curl http://localhost:9091/healthz

# Milvus Web UI
# Open http://localhost:9091 in browser
```

---

## Troubleshooting

### Common Issues & Solutions

#### 1. Content Service: `metadata` Reserved Name Error

**Error:**
```
sqlalchemy.exc.InvalidRequestError: Attribute name 'metadata' is reserved when using the Declarative API.
```

**Solution:** The `metadata` column was renamed to `extra_data` with DB column name `metadata`:
```python
# models.py
extra_data = Column("metadata", JSONB, nullable=True)
```

#### 2. Content Service: `from_state` NOT NULL Violation

**Error:**
```
null value in column "from_state" violates not-null constraint
```

**Solution:** Initial state history uses `"none"` instead of `None`:
```python
state_history = NoticeStateHistory(
    from_state="none",  # Not None
    to_state=status,
    ...
)
```

#### 3. AI Assistant: Missing `RATE_LIMIT_PER_MINUTE`

**Error:**
```
AttributeError: 'Settings' object has no attribute 'RATE_LIMIT_PER_MINUTE'
```

**Solution:** Add to `config.py`:
```python
RATE_LIMIT_PER_MINUTE: int = 30
```

#### 4. AI Assistant: `cache_manager` Not Defined

**Error:**
```
NameError: name 'cache_manager' is not defined
```

**Solution:** Import `cache_manager` from the module:
```python
from cache_manager import init_cache_manager, cache_manager
```

#### 5. JWT: Invalid Audience Error

**Error:**
```
jose.exceptions.JWTError: Invalid audience
```

**Solution:** Auth API sets `aud=microservices` in tokens. All services verify with:
```python
options={"verify_aud": False}
```

#### 6. AI Dependencies: Version Conflicts

**Error:**
```
ERROR: Cannot install langchain and langchain-groq because these package versions have conflicting dependencies.
```

**Solution:** Removed langchain dependency, refactored to use `groq` SDK directly:
```python
from groq import AsyncGroq
client = AsyncGroq(api_key=self.api_key)
response = await client.chat.completions.create(model=self.model, ...)
```

#### 7. `cleanup_old_records()` Function Missing

**Error:**
```
psycopg2.errors.UndefinedFunction: function cleanup_old_records() does not exist
```

**Solution:** Apply Phase 3 schema:
```bash
Get-Content database/phase3_schema.sql -Raw | docker exec -i sentinel_postgres psql -U sentinel_admin -d sentinel_sync
```

---

## Compliance Summary

### OST Compliance — Onboarding & System Truth

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Content Service CRUD endpoints defined | ✅ | 10 endpoints (5 notices + 5 equipment) |
| AI Assistant endpoints defined | ✅ | 3 endpoints (query, feedback, health) |
| JWT authentication on all protected endpoints | ✅ | Shared `SECRET_KEY`, `verify_aud=False` |
| Redis event publishing on CRUD operations | ✅ | `content.events`, `equipment.events`, `ai.events` |
| Rate limiting on all endpoints | ✅ | Content: 60/min, AI: 30/min |
| Circuit breaker pattern | ✅ | For Groq API, Milvus, Redis |
| Structured JSON logging | ✅ | All services log as JSON |
| Graceful shutdown handlers | ✅ | Redis, scheduler, DB connections |
| Health check endpoints | ✅ | All 3 services: `/health` |
| Docker health checks | ✅ | All 8 containers |

### FST Compliance — Framework, Stack & Tooling

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| FastAPI web framework | ✅ | Both services |
| SQLAlchemy ORM | ✅ | Both services |
| Pydantic validation | ✅ | Request/response schemas |
| Redis client (redis-py) | ✅ | Event bus + caching |
| Groq client (groq SDK) | ✅ | AI Assistant LLM |
| PyMilvus client | ✅ | AI Assistant vector search |
| httpx async client | ✅ | Embedding fallback |
| Dockerfile per service | ✅ | Non-root user, health checks |
| requirements.txt per service | ✅ | Pinned dependencies |
| .dockerignore per service | ✅ | Build exclusions |
| .env with all variables | ✅ | 20+ environment variables |

### SST Compliance — Services, Streams & Topics

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Auth API service | ✅ | Port 8000, `/register`, `/login`, `/health` |
| Content Service | ✅ | Port 8001, Notice + Equipment CRUD |
| AI Assistant | ✅ | Port 8002, Groq + Milvus + SSE |
| Redis pub/sub event bus | ✅ | 6 event topics |
| Postman collection | ✅ | `backend/tests/auth_test.json` (11 tests) |
| Milvus vector database | ✅ | Port 19530, `campus_guidelines` collection |
| PostgreSQL database | ✅ | 10 tables (4 Phase 1 + 2 Phase 2 + 4 Phase 3) |
| SSE streaming | ✅ | AI query streaming via `text/event-stream` |

### LST Compliance — Libraries, Scripts & Tooling

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Notice CRUD tests | ✅ | Create, read, update, delete verified |
| Equipment CRUD tests | ✅ | Create, read, update, delete verified |
| AI query tests (stream + non-stream) | ✅ | Both modes verified |
| Feedback test | ✅ | Submit feedback verified |
| Health check tests | ✅ | All 3 services verified |
| State machine transitions | ✅ | Notice & Equipment FSMs validated |
| Duplicate detection | ✅ | 24-hour window for notices |
| Query validation & sanitization | ✅ | SQL injection, XSS blocking |
| Cache hit/miss verification | ✅ | AI query caching with TTL |
| Circuit breaker states | ✅ | Closed → Open → Half-Open |
| Auto-expiry scheduler | ✅ | Notices expire at `expires_at` |
| Maintenance scheduler | ✅ | Equipment maintenance checks |
| Phase 3 schema applied | ✅ | Tables, views, triggers, functions |
| End-to-end flow tested | ✅ | Register → Login → CRUD → AI → Feedback |

---

## References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Groq API Documentation](https://console.groq.com/docs)
- [PyMilvus Documentation](https://milvus.io/docs)
- [python-jose JWT Library](https://python-jose.readthedocs.io/)
- [SQLAlchemy 2.0](https://docs.sqlalchemy.org/)
- [Redis Pub/Sub](https://redis.io/docs/manual/pubsub/)
- [slowapi Rate Limiting](https://github.com/laurentS/slowapi)
- [Docker Compose](https://docs.docker.com/compose/)
- [PostgreSQL 16](https://www.postgresql.org/docs/16/)
- [Milvus Vector Database](https://milvus.io/docs)

---

**Document Status:** Phase 3 Complete
**Last Updated:** 2026-07-29
**Author:** CIS Community Summer Activity Team
**Version:** v3.0
**Verified:** All 8 containers healthy, all API endpoints functional, end-to-end flow tested
