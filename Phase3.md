# Phase 3: CRUD Microservices & AI Retrieval API

## Overview

Phase 3 implements two core microservices:
1. **Content Service** - CRUD operations for notices and equipment
2. **AI Assistant** - LangChain + Milvus vector search for campus guidelines

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
       ┌───────────────┼───────────────┐
       │               │               │
       ▼               ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   Auth API  │ │   Content   │ │     AI      │
│   (8000)    │ │   Service   │ │  Assistant  │
│             │ │   (8001)    │ │   (8002)    │
└──────┬──────┘ └──────┬──────┘ └──────┬──────┘
       │               │               │
       ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────┐
│                      PostgreSQL                             │
└─────────────────────────────────────────────────────────────┘
       │               │               │
       ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Redis (Pub/Sub + Cache)                │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      Milvus Vector DB                       │
└─────────────────────────────────────────────────────────────┘
```

## Services

### Content Service (Port 8001)

#### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | /api/notices | Create notice | Yes |
| GET | /api/notices | List notices | No |
| GET | /api/notices/{id} | Get notice | No |
| PATCH | /api/notices/{id} | Update notice | Yes |
| DELETE | /api/notices/{id} | Delete notice | Yes |
| POST | /api/equipment | Create equipment | Yes |
| GET | /api/equipment | List equipment | No |
| GET | /api/equipment/{id} | Get equipment | No |
| PATCH | /api/equipment/{id} | Update equipment | Yes |
| DELETE | /api/equipment/{id} | Delete equipment | Yes |
| GET | /health | Health check | No |

#### Features

- Rate limiting (slowapi)
- Circuit breaker pattern
- Redis caching with TTL
- State machine for notices/equipment
- Event publishing to Redis
- Auto-expiry scheduler for notices
- Structured JSON logging

### AI Assistant (Port 8002)

#### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | /api/ai/query | Process AI query | Yes |
| POST | /api/ai/feedback | Submit feedback | Yes |
| GET | /health | Health check | No |

#### Features

- Groq API integration (Llama 3.3)
- Milvus vector search
- Streaming SSE responses
- Query result caching
- Circuit breaker for external services
- Structured JSON logging

## Infrastructure

### Docker Services

| Service | Container | Port | Description |
|---------|-----------|------|-------------|
| PostgreSQL | sentinel_postgres | 5432 | Primary database |
| Redis | redis-event-bus | 6379 | Event bus + cache |
| Milvus | milvus | 19530 | Vector database |
| Milvus etcd | milvus-etcd | 2379 | Milvus metadata |
| Milvus MinIO | milvus-minio | 9000 | Milvus storage |
| Auth API | auth-api | 8000 | Authentication |
| Content Service | content-service | 8001 | CRUD operations |
| AI Assistant | ai-assistant | 8002 | AI queries |

### Running

```bash
# Start all services
docker compose -f docker-compose.infra.yml up --build

# Start in background
docker compose -f docker-compose.infra.yml up -d

# Stop all services
docker compose -f docker-compose.infra.yml down
```

### Testing

```bash
# Create a notice
curl -X POST http://localhost:8001/api/notices \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Notice", "content": "This is a test notice content", "category": "general"}'

# AI Query
curl -X POST http://localhost:8002/api/ai/query \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the library hours?", "stream": false}'
```

## Database Schema

### Tables

- `notices` - Campus notices with lifecycle states
- `equipment` - Equipment inventory with status tracking
- `ai_queries` - AI query history
- `ai_feedback` - User feedback on AI responses
- `notice_state_history` - Notice state transition audit
- `equipment_state_history` - Equipment state transition audit

### Views

- `v_active_notices` - Active published notices
- `v_equipment_summary` - Equipment count by type/status

## Configuration

All configuration is in `.env` file. Key variables:

- `SECRET_KEY` - JWT signing key (shared across services)
- `GROQ_API_KEY` - Groq API key for AI
- `MILVUS_HOST` - Milvus vector database host
- `REDIS_HOST` - Redis event bus host
- `DATABASE_URL` - PostgreSQL connection string

## Compliance

### OST (Operational Specification)
- All REST endpoints defined
- Redis event publishing
- Circuit breaker pattern
- Rate limiting
- Structured logging

### FST (Functional Specification)
- Notice CRUD with validation
- Equipment CRUD with validation
- AI query with streaming
- Feedback collection

### SST (State Specification)
- Notice state machine (draft/published/archived/deleted)
- Equipment state machine (available/in_use/maintenance/retired)
- Circuit breaker states (closed/open/half_open)

### LST (Logic Specification)
- Business logic for CRUD operations
- AI query processing logic
- Event publishing logic
- Validation logic
