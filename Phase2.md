# Sentinel-Sync: Phase 2 — Auth API & Redis Event Bus

---

## Table of Contents

- [Overview](#overview)
- [Phase 2 Objectives](#phase-2-objectives)
- [OST — Onboarding & System Truth](#ost--onboarding--system-truth)
- [FST — Framework, Stack & Tooling](#fst--framework-stack--tooling)
- [SST — Services, Streams & Topics](#sst--services-streams--topics)
- [LST — Libraries, Scripts & Tooling](#lst--libraries-scripts--tooling)
- [Architecture](#architecture)
- [Directory Structure](#directory-structure)
- [Environment Configuration](#environment-configuration)
- [API Endpoints](#api-endpoints)
- [JWT Token Specification](#jwt-token-specification)
- [Redis Event Bus](#redis-event-bus)
- [Security](#security)
- [Docker Setup](#docker-setup)
- [Testing](#testing)
- [Operational Commands](#operational-commands)
- [Troubleshooting](#troubleshooting)

---

## Overview

**Phase 2** introduces headless JWT authentication and an asynchronous Redis Event Bus infrastructure to the Sentinel-Sync Campus Intelligence Hub. This phase establishes the security foundation and inter-service communication layer that all subsequent microservices will depend on.

### What Phase 2 Delivers

| Component | Description |
|-----------|-------------|
| **Auth API** | FastAPI-based JWT authentication service (register, login, health) |
| **Redis Event Bus** | Publish/Subscribe messaging for async inter-service communication |
| **Postman Collection** | 11 automated test scenarios covering all endpoints and edge cases |
| **Docker Infrastructure** | Self-contained compose file with PostgreSQL, Redis, and Auth API |

---

## Phase 2 Objectives

| # | Objective | Status |
|---|-----------|--------|
| 1 | Implement JWT-based stateless authentication | ✅ |
| 2 | Create user registration with password validation | ✅ |
| 3 | Create user login with account lockout protection | ✅ |
| 4 | Implement Redis pub/sub event bus | ✅ |
| 5 | Publish domain events on user creation and login | ✅ |
| 6 | Add IP-based rate limiting on login endpoint | ✅ |
| 7 | Create comprehensive Postman test collection | ✅ |
| 8 | Dockerize auth-api with health checks | ✅ |
| 9 | Store all data on D: drive via bind mounts | ✅ |
| 10 | Run all containers on shared `sentinel_network` | ✅ |

---

## OST — Onboarding & System Truth

### System Context

| Attribute | Specification |
|-----------|---------------|
| Service Name | Auth API (Phase 2) |
| Version | v2.0 |
| Date | 2026-07-27 |
| Base URL | `http://localhost:8000` |
| Protocol | HTTP/1.1 (JSON) |
| Authentication | JWT Bearer Token |

### Scope Boundaries

| In Scope (Phase 2) | Out of Scope (Phase 2) |
|---------------------|------------------------|
| User registration (`POST /register`) | Role management (admin panel) |
| User login (`POST /login`) | Token refresh endpoint |
| JWT token generation | Password reset flow |
| Health check endpoint | Email verification |
| Redis event publishing | Frontend UI |
| Account lockout on failed attempts | OAuth/SSO integration |
| IP-based rate limiting | Multi-factor authentication |

### User Model — `auth_users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid4() | Unique user identifier |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| `full_name` | VARCHAR(100) | NOT NULL | User's full name |
| `roles` | VARCHAR[] | DEFAULT ['user'] | User role array (PostgreSQL ARRAY) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |
| `is_active` | BOOLEAN | DEFAULT TRUE | Account active status |
| `is_verified` | BOOLEAN | DEFAULT FALSE | Email verified status |
| `failed_login_attempts` | INTEGER | DEFAULT 0 | Consecutive failed login count |
| `locked_until` | TIMESTAMP | NULL | Account lock expiration |
| `last_login` | TIMESTAMP | NULL | Last successful login timestamp |

### Indexes

| Index Name | Column | Purpose |
|------------|--------|---------|
| `auth_users_pkey` | `id` | Primary key lookup |
| `auth_users_email_key` | `email` | Unique email constraint + fast login lookup |
| `ix_auth_users_created_at` | `created_at` | Time-based queries |

### Status Transition Rules

```
┌─────────────────────────────────────────────────────────────────┐
│                    ACCOUNT STATE MACHINE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    Register     ┌──────────┐                     │
│  │  NEW     │ ──────────────► │  ACTIVE  │                     │
│  └──────────┘                 └────┬─────┘                     │
│                                    │                            │
│                         Failed Login (×5)                       │
│                                    │                            │
│                                    ▼                            │
│                             ┌──────────┐                       │
│                             │ LOCKED   │                       │
│                             └────┬─────┘                       │
│                                  │                              │
│                    Lock expires or Reset                        │
│                                  │                              │
│                                  ▼                              │
│                           ┌──────────┐                         │
│                           │  ACTIVE  │                         │
│                           └──────────┘                         │
│                                                                 │
│  Rules:                                                        │
│  • New → Active (successful registration)                     │
│  • Active → Locked (5 consecutive failed logins)              │
│  • Locked → Active (lock expires after 15 minutes)            │
│  • Login resets failed_attempts to 0                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## FST — Framework, Stack & Tooling

### Technology Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Web Framework** | FastAPI | 0.104.1 | Async REST API framework |
| **ASGI Server** | Uvicorn | 0.24.0 | Production ASGI server |
| **JWT Library** | python-jose | 3.3.0 | JWT encoding/decoding |
| **Password Hashing** | passlib + bcrypt | 1.7.4 / 4.0.1 | Secure password storage |
| **ORM** | SQLAlchemy | 2.0.23 | Database abstraction |
| **Database Driver** | psycopg2-binary | 2.9.9 | PostgreSQL adapter |
| **Validation** | Pydantic | 2.4.2 | Request/response validation |
| **Settings** | pydantic-settings | 2.0.3 | Environment variable management |
| **Redis Client** | redis-py | 5.0.1 | Redis connection & pub/sub |
| **Rate Limiting** | slowapi | 0.1.9 | IP-based rate limiting |
| **Email Validation** | email-validator | 2.1.0 | Pydantic EmailStr support |
| **Environment** | python-dotenv | 1.0.0 | .env file loading |
| **Database** | PostgreSQL | 16-alpine | Primary data store |
| **Cache/Pub-Sub** | Redis | 7.2-alpine | Event bus + caching |
| **Container Runtime** | Docker | 20.10.x+ | Containerization |
| **Orchestration** | Docker Compose | 2.15.x+ | Multi-container management |

### Requirements File

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
bcrypt==4.0.1
python-multipart==0.0.6
pydantic==2.4.2
pydantic-settings==2.0.3
redis==5.0.1
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
python-dotenv==1.0.0
email-validator==2.1.0
slowapi==0.1.9
```

### Dockerfile

```dockerfile
FROM python:3.11-slim

RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=15s \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### .dockerignore

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
POSTGRES_PASSWORD=S3nt1n3l#2026
POSTGRES_DB=sentinel_sync
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Connection String (for manual testing)
DATABASE_URL=postgresql://sentinel_admin:S3nt1n3l%232026@localhost:5432/sentinel_sync

# Optional pgAdmin
PGADMIN_DEFAULT_EMAIL=admin@sentinel.local
PGADMIN_DEFAULT_PASSWORD=admin123

# Phase 2: Auth API Configuration
SECRET_KEY=sentinel-sync-phase2-secret-key-32-chars-minimum!!
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# Phase 2: Redis Event Bus
REDIS_HOST=redis-event-bus
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

# Phase 2: Security & Rate Limiting
MAX_FAILED_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
CORS_ORIGINS=*
RATE_LIMIT_PER_MINUTE=5
```

---

## SST — Services, Streams & Topics

### Service Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SENTINEL-SYNC PHASE 2                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐           │
│  │   CLIENT     │     │  AUTH API    │     │   REDIS      │           │
│  │  (Postman/   │────►│  FastAPI     │────►│  EVENT BUS   │           │
│  │   Frontend)  │     │  Port: 8000  │     │  Port: 6379  │           │
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
│                              │                     │                    │
│                              ▼                     │                    │
│                     ┌──────────────┐               │                    │
│                     │  POSTGRESQL  │               │                    │
│                     │  Port: 5432  │               │                    │
│                     │  DB: sentinel_sync           │                    │
│                     └──────────────┘               │                    │
│                                                     │                    │
│  ┌──────────────────────────────────────────────────┘                   │
│  │  OTHER MICROSERVICES (Phase 3+)                                      │
│  │  Subscribe to events for:                                             │
│  │  • User creation → Provision user profiles                           │
│  │  • Login events → Analytics & audit trail                            │
│  │  • Lock events → Security monitoring                                 │
│  └──────────────────────────────────────────────────────────────────────│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### API Endpoints

#### `POST /register` — Create New User

| Property | Value |
|----------|-------|
| Status Code | `201 Created` |
| Content-Type | `application/json` |

**Request Body:**
```json
{
  "email": "user@campus.edu",
  "password": "SecurePass@123",
  "full_name": "John Doe"
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "user@campus.edu",
  "timestamp": "2026-07-27T10:30:00.000000"
}
```

**Error Responses:**

| Code | Condition | Detail |
|------|-----------|--------|
| `400` | Weak password | `"Weak password: Password must contain..."` |
| `400` | Invalid email | `"Invalid email format"` |
| `409` | Duplicate email | `"Email already registered"` |
| `429` | Rate limit exceeded | `"Rate limit exceeded. Try again later."` |

#### `POST /login` — Authenticate User

| Property | Value |
|----------|-------|
| Status Code | `200 OK` |
| Content-Type | `application/json` |
| Rate Limit | 5 requests/minute per IP |

**Request Body:**
```json
{
  "email": "user@campus.edu",
  "password": "SecurePass@123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "user@campus.edu",
    "full_name": "John Doe",
    "roles": ["user"]
  }
}
```

**Error Responses:**

| Code | Condition | Detail |
|------|-----------|--------|
| `401` | Wrong password | `"Invalid email or password"` |
| `401` | User not found | `"Invalid email or password"` |
| `403` | Account locked | `"Account locked due to multiple failed attempts"` |
| `429` | Rate limit exceeded | `"Rate limit exceeded. Try again later."` |

#### `GET /health` — Health Check

| Property | Value |
|----------|-------|
| Status Code | `200 OK` |
| Content-Type | `application/json` |

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2026-07-27T10:30:00.000000",
  "services": {
    "redis": "connected",
    "database": "connected"
  },
  "version": "1.0.0"
}
```

**Status Values:** `healthy` | `degraded` | `unhealthy`

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

### Refresh Token Payload

| Claim | Type | Value | Description |
|-------|------|-------|-------------|
| `sub` | string | UUID | User ID |
| `email` | string | email | User email |
| `roles` | array | ["user"] | User roles |
| `jti` | string | UUID | Unique token ID |
| `iat` | int | timestamp | Issued at |
| `exp` | int | timestamp | Expiration (default: 7 days) |
| `iss` | string | `"auth-api"` | Issuer |
| `aud` | string | `"microservices"` | Audience |
| `type` | string | `"refresh"` | Token type |

### Token Configuration

| Parameter | Default | Env Variable |
|-----------|---------|--------------|
| Algorithm | HS256 | `JWT_ALGORITHM` |
| Secret Key | (from .env) | `SECRET_KEY` |
| Access Token Expiry | 60 minutes | `ACCESS_TOKEN_EXPIRE_MINUTES` |
| Refresh Token Expiry | 7 days | `REFRESH_TOKEN_EXPIRE_DAYS` |

---

## Redis Event Bus

### Event Topics

| Topic | Trigger | Payload |
|-------|---------|---------|
| `event.user.created` | User registration | `{ user_id, email, timestamp }` |
| `event.auth.login` | Successful login | `{ user_id, timestamp, ip }` |
| `auth.login.locked` | Account locked | `{ user_id, timestamp }` |

### Event Envelope Format

```json
{
  "event_id": "uuid-v4",
  "timestamp": "2026-07-27T10:30:00.000000",
  "source": "auth-api",
  "data": {
    "user_id": "uuid",
    "email": "user@campus.edu",
    "timestamp": "2026-07-27T10:30:00.000000"
  }
}
```

### Redis Configuration

| Parameter | Value | Env Variable |
|-----------|-------|--------------|
| Host | `redis-event-bus` | `REDIS_HOST` |
| Port | 6379 | `REDIS_PORT` |
| DB | 0 | `REDIS_DB` |
| Password | (none) | `REDIS_PASSWORD` |
| Max Memory | 256mb | (docker-compose) |
| Eviction Policy | allkeys-lru | (docker-compose) |
| Persistence | AOF + RDB | (docker-compose) |

### Subscribing to Events (for future microservices)

```python
import redis
import json

r = redis.Redis(host='redis-event-bus', port=6379, decode_responses=True)
pubsub = r.pubsub()
pubsub.subscribe('event.user.created', 'event.auth.login', 'auth.login.locked')

for message in pubsub.listen():
    if message['type'] == 'message':
        event = json.loads(message['data'])
        print(f"Event: {message['channel']}")
        print(f"Data: {event['data']}")
```

---

## Security

### Password Validation Rules

| Rule | Regex/Logic |
|------|-------------|
| Minimum length | 8 characters |
| Maximum length | 128 characters |
| Uppercase letter | `[A-Z]` |
| Lowercase letter | `[a-z]` |
| Digit | `\d` |
| Special character | `[@$!%*?&]` |
| Common password check | Against 20 common passwords |

### Account Lockout

| Parameter | Value | Env Variable |
|-----------|-------|--------------|
| Max failed attempts | 5 | `MAX_FAILED_ATTEMPTS` |
| Lockout duration | 15 minutes | `LOCKOUT_DURATION_MINUTES` |
| Reset on successful login | Yes | — |

### Rate Limiting

| Parameter | Value | Env Variable |
|-----------|-------|--------------|
| Requests per minute | 5 | `RATE_LIMIT_PER_MINUTE` |
| Applied to | `/login` endpoint | — |
| Key function | IP address (get_remote_address) | — |

### CORS Configuration

| Parameter | Value | Env Variable |
|-----------|-------|--------------|
| Origins | `*` (configurable) | `CORS_ORIGINS` |
| Credentials | Allowed | — |
| Methods | All | — |
| Headers | All | — |

### Docker Security

| Measure | Implementation |
|---------|----------------|
| Non-root user | `appuser` (UID created in Dockerfile) |
| .dockerignore | Prevents `.env`, `.git`, `__pycache__` in image |
| No secrets in image | Environment variables passed at runtime |

---

## Docker Setup

### Container Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DOCKER CONTAINERS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐     ┌─────────────────────┐          │
│  │ sentinel_postgres   │     │ redis-event-bus     │          │
│  │ PostgreSQL 16       │     │ Redis 7.2-alpine    │          │
│  │ Port: 5432          │     │ Port: 6379          │          │
│  │ Bind: ./data/postgres│    │ Bind: ./data/redis   │          │
│  └──────────┬──────────┘     └──────────┬──────────┘          │
│             │                           │                      │
│             └───────────┬───────────────┘                      │
│                         │                                      │
│                         ▼                                      │
│              ┌─────────────────────┐                           │
│              │    auth-api         │                           │
│              │  FastAPI + Uvicorn  │                           │
│              │  Port: 8000         │                           │
│              │  User: appuser      │                           │
│              └─────────────────────┘                           │
│                                                                 │
│  Network: sentinel_network (bridge)                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Port Allocation

| Service | Container Port | Host Port | Purpose |
|---------|---------------|-----------|---------|
| PostgreSQL | 5432 | 5432 | Database connections |
| Redis | 6379 | 6379 | Event bus connections |
| Auth API | 8000 | 8000 | REST API endpoints |

### Data Storage (All on D: Drive)

| Service | Host Path | Container Path | Purpose |
|---------|-----------|----------------|---------|
| PostgreSQL | `./data/postgres` | `/var/lib/postgresql/data` | Database files |
| Redis | `./data/redis` | `/data` | AOF + RDB persistence |

### Quick Start

```bash
# Start all services
docker-compose --env-file .env -f docker-compose.infra.yml up -d

# Check status
docker ps

# Verify health
curl http://localhost:8000/health
```

---

## Directory Structure

```
Pro/
├── .env                              # All environment variables
├── .gitignore                        # Git ignore rules
├── README.md                         # Phase 1 documentation
├── Phase2.md                         # This file (Phase 2 documentation)
├── docker-compose.infra.yml          # Phase 2: Redis + Auth API + PostgreSQL
├── data/
│   ├── postgres/                     # PostgreSQL data (bind mount)
│   ├── redis/                        # Redis data (bind mount)
│   └── pgadmin/                      # pgAdmin data (bind mount)
├── database/
│   ├── schema.sql                    # Phase 1: Database schema
│   ├── test_seed.sql                 # Phase 1: Seed data
│   └── docker-compose.db.yml         # Phase 1: Database compose
├── docs/
│   └── api_contract.md               # API contract documentation
└── backend/
    ├── auth/
    │   ├── main.py                   # FastAPI app, routes, middleware
    │   ├── config.py                 # Pydantic-settings configuration
    │   ├── database.py               # SQLAlchemy engine & session
    │   ├── models.py                 # AuthUser ORM model
    │   ├── schemas.py                # Pydantic request/response schemas
    │   ├── auth_service.py           # Registration & login business logic
    │   ├── jwt_manager.py            # JWT generation & verification
    │   ├── password_hasher.py        # Bcrypt hashing & validation
    │   ├── redis_client.py           # Redis pub/sub client
    │   ├── requirements.txt          # Python dependencies
    │   ├── Dockerfile                # Container build instructions
    │   └── .dockerignore             # Docker build exclusions
    └── tests/
        └── auth_test.json            # Postman collection (11 tests)
```

---

## API Endpoints — Detailed

### Request/Response Schemas

#### RegisterRequest

```json
{
  "email": "string (required, valid email format)",
  "password": "string (required, 8-128 chars)",
  "full_name": "string (required, 1-100 chars)"
}
```

#### RegisterResponse (201)

```json
{
  "message": "User created successfully",
  "user_id": "uuid-string",
  "email": "string",
  "timestamp": "iso8601-string"
}
```

#### LoginRequest

```json
{
  "email": "string (required, valid email format)",
  "password": "string (required)"
}
```

#### LoginResponse (200)

```json
{
  "access_token": "jwt-string",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "jwt-string",
  "user": {
    "id": "uuid-string",
    "email": "string",
    "full_name": "string",
    "roles": ["user"]
  }
}
```

#### HealthResponse (200)

```json
{
  "status": "healthy",
  "timestamp": "iso8601-string",
  "services": {
    "redis": "connected",
    "database": "connected"
  },
  "version": "1.0.0"
}
```

---

## Testing

### Postman Collection — 11 Test Scenarios

| # | Test Name | Method | Endpoint | Expected Status |
|---|-----------|--------|----------|-----------------|
| 1 | Health Check | GET | `/health` | 200 |
| 2 | Register - Valid User | POST | `/register` | 201 |
| 3 | Register - Duplicate Email | POST | `/register` | 409 |
| 4 | Register - Weak Password | POST | `/register` | 400 |
| 5 | Register - Invalid Email | POST | `/register` | 400/422 |
| 6 | Login - Valid Credentials | POST | `/login` | 200 |
| 7 | Login - Invalid Password | POST | `/login` | 401 |
| 8 | Login - Non-existent User | POST | `/login` | 401 |
| 9 | JWT Token Structure Validation | POST | `/login` | 200 |
| 10 | Login - Account Lockout | POST | `/login` | 401/403 |
| 11 | Health Check - Redis Connected | GET | `/health` | 200 |

### Test Coverage Details

#### Health Check Tests
- Status code is 200
- Response has `status` field (healthy/degraded/unhealthy)
- Response has `services` field with `redis` and `database`
- Response has `version` field = "1.0.0"
- Redis is connected
- Database is connected

#### Register Tests
- Valid registration returns 201 with user_id
- Duplicate email returns 409 with "already registered"
- Weak password returns 400 with "Weak password"
- Invalid email returns 400/422

#### Login Tests
- Valid credentials return access_token, refresh_token, user object
- Token type is "bearer"
- expires_in is positive number
- User object has id, email, full_name, roles
- Invalid password returns 401
- Non-existent user returns 401 (generic message)
- 5+ failed attempts trigger account lockout (403)

#### JWT Claims Validation Tests
- Access token has 3 dot-separated parts
- Header has `alg: HS256` and `typ: JWT`
- Payload contains: sub, email, roles, iat, exp, jti, iss, aud, type
- `iss` = "auth-api"
- `aud` = "microservices"
- `type` = "access"
- Email matches registered email
- Roles is array containing "user"
- Refresh token contains: sub, email, roles, jti, type, iss, iat, exp, aud
- Refresh token `type` = "refresh"

### Manual Testing

```bash
# Health check
curl http://localhost:8000/health

# Register
curl -X POST http://localhost:8000/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@campus.edu","password":"Test@12345","full_name":"Test User"}'

# Login
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@campus.edu","password":"Test@12345"}'
```

### Importing Postman Collection

1. Open Postman
2. Click **Import** (top left)
3. Select `backend/tests/auth_test.json`
4. Set collection variable `base_url` to `http://localhost:8000`
5. Run collection with **Collection Runner**

---

## Operational Commands

### Start Services

```bash
# Start all Phase 2 services
docker-compose --env-file .env -f docker-compose.infra.yml up -d

# Start with rebuild
docker-compose --env-file .env -f docker-compose.infra.yml up -d --build

# Start specific service
docker-compose --env-file .env -f docker-compose.infra.yml up -d auth-api
```

### Stop Services

```bash
# Stop all services
docker-compose --env-file .env -f docker-compose.infra.yml down

# Stop and remove volumes
docker-compose --env-file .env -f docker-compose.infra.yml down -v
```

### View Logs

```bash
# All services
docker-compose --env-file .env -f docker-compose.infra.yml logs -f

# Specific service
docker logs auth-api -f
docker logs sentinel_postgres -f
docker logs redis-event-bus -f
```

### Database Operations

```bash
# Connect to PostgreSQL
docker exec -it sentinel_postgres psql -U sentinel_admin -d sentinel_sync

# List tables
docker exec -it sentinel_postgres psql -U sentinel_admin -d sentinel_sync -c "\dt"

# Check auth_users
docker exec -it sentinel_postgres psql -U sentinel_admin -d sentinel_sync -c "SELECT id, email, roles FROM auth_users;"
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

### Container Health

```bash
# Check all container status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Check specific container health
docker inspect auth-api --format='{{.State.Health.Status}}'
```

---

## Troubleshooting

### Common Issues & Solutions

#### 1. Auth API Won't Start

**Error:** `sqlalchemy.exc.OperationalError: connection refused`

**Solution:** Ensure PostgreSQL is running and healthy:
```bash
docker ps --filter "name=sentinel_postgres"
docker logs sentinel_postgres
```

#### 2. Password Too Long Error

**Error:** `password cannot be longer than 72 bytes`

**Solution:** bcrypt version incompatibility. Ensure `bcrypt==4.0.1` in requirements.txt:
```bash
docker-compose --env-file .env -f docker-compose.infra.yml up -d --build auth-api
```

#### 3. Table Already Exists Error

**Error:** `relation "ix_auth_users_email" already exists`

**Solution:** Duplicate index definition. Ensure `models.py` doesn't have both `index=True` and `__table_args__` for the same index.

#### 4. Rate Limit Not Working

**Error:** Requests not being limited

**Solution:** Ensure `slowapi` is installed and `@limiter.limit()` decorator is on the login endpoint.

#### 5. Container Name Conflict

**Error:** `The container name "/sentinel_postgres" is already in use`

**Solution:** Stop the conflicting container:
```bash
docker stop sentinel_postgres
docker rm sentinel_postgres
docker-compose --env-file .env -f docker-compose.infra.yml up -d
```

#### 6. Data Lost After Restart

**Error:** Users/data not persisting

**Solution:** Ensure bind mounts are configured (not Docker volumes):
```yaml
volumes:
  - ./data/postgres:/var/lib/postgresql/data  # Bind mount ✅
  # - postgres-data:/var/lib/postgresql/data  # Docker volume ❌
```

---

## Compliance Summary

### OST Compliance

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| POST /register | ✅ | `main.py:44` |
| POST /login | ✅ | `main.py:59` |
| JWT claims (sub, email, roles, iat, exp, jti, iss, aud, type) | ✅ | `jwt_manager.py:12-21` |
| Redis events (event.user.created, event.auth.login, auth.login.locked) | ✅ | `auth_service.py:55,85,112` |
| User model (12 fields) | ✅ | `models.py:8-26` |
| Rate limiting | ✅ | `main.py:60` (slowapi) |
| Input validation | ✅ | `password_hasher.py:30-54`, `auth_service.py:12-19` |

### FST Compliance

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| FastAPI | ✅ | `requirements.txt:1` |
| python-jose | ✅ | `requirements.txt:3` |
| passlib/bcrypt | ✅ | `requirements.txt:4-5` |
| SQLAlchemy | ✅ | `requirements.txt:10` |
| psycopg2-binary | ✅ | `requirements.txt:11` |
| Dockerfile | ✅ | `backend/auth/Dockerfile` |
| requirements.txt | ✅ | 14 dependencies |
| .env (all vars) | ✅ | 11 environment variables |

### SST Compliance

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Auth API endpoints | ✅ | `/register`, `/login`, `/health` |
| Redis pub/sub | ✅ | `redis_client.py:28-38` |
| Postman collection | ✅ | `backend/tests/auth_test.json` (11 tests) |

### LST Compliance

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Health check test | ✅ | Test #1, #11 |
| Register tests (4) | ✅ | Tests #2-5 |
| Login tests (4) | ✅ | Tests #6-8, #10 |
| JWT claims validation | ✅ | Test #9 |
| Lockout test | ✅ | Test #10 |

---

## References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [python-jose JWT Library](https://python-jose.readthedocs.io/)
- [passlib Password Hashing](https://passlib.readthedocs.io/)
- [SQLAlchemy 2.0](https://docs.sqlalchemy.org/)
- [Redis Pub/Sub](https://redis.io/docs/manual/pubsub/)
- [slowapi Rate Limiting](https://github.com/laurentS/slowapi)
- [Docker Compose](https://docs.docker.com/compose/)

---

**Document Status:** Phase 2 Complete
**Last Updated:** 2026-07-27
**Author:** CIS Community Summer Activity Team
**Version:** v2.0
**Verified:** All 11 Postman tests passing, all containers healthy
