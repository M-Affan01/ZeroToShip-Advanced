# Sentinel-Sync: The Adaptive Campus Intelligence Hub

## Phase 1: Database Schema & Infrastructure

---

## Table of Contents

- [Overview](#overview)
- [System Context & Scope](#system-context--scope)
- [External Dependencies](#external-dependencies)
- [Environmental Configuration](#environmental-configuration)
- [Directory Structure](#directory-structure)
- [Database Schema](#database-schema)
- [Functional Specifications](#functional-specifications)
- [State Management](#state-management)
- [Logic Specifications](#logic-specifications)
- [API Contract](#api-contract)
- [Testing Procedures](#testing-procedures)
- [Deployment](#deployment)
- [Operational Commands](#operational-commands)
- [Troubleshooting](#troubleshooting)
- [Git Submission](#git-submission)
- [Future Phases](#future-phases)
- [References](#references)

---

## Overview

**Sentinel-Sync** is a decentralized data dashboard for campus services (e.g., cafeteria menus, lab equipment availability, library transit tracking, and AI-powered academic FAQ bots). Instead of deploying one massive monolithic application, students build this system as a collection of specialized "mini-services" that communicate asynchronously via a central event bus.

### Phase 1 Objectives

- Establish foundational database layer
- Define static data specifications
- Configure isolated PostgreSQL containers
- Create API contract documentation
- Manual SQL validation testing

### Target Audience

| Track | Learning Outcomes |
|-------|-------------------|
| 1st/2nd Semester | Build isolated, functional APIs and structural UI components |
| 3rd/4th Semester | Microservices Architecture, containerized service discovery, Event-Driven development |

---

## System Context & Scope

| Attribute | Specification |
|-----------|---------------|
| System Name | Sentinel-Sync Campus Intelligence Hub |
| Version | v1.0 (Phase 1) |
| Date | 2026-07-24 |
| Target Environment | Development (Local Containers) → Staging → Production |
| External Dependency Profile | Fully self-contained in Phase 1 |

### Scope Boundaries

| In Scope (Phase 1) | Out of Scope (Phase 1) |
|---------------------|------------------------|
| Database schema definition | User authentication/authorization |
| Table relationships & constraints | API endpoints implementation |
| Static test data generation | Business logic processing |
| Docker container configuration | Event-driven messaging |
| Data integrity verification | Frontend UI components |
| Manual SQL validation | Real-time data updates |
| API contract documentation | Asynchronous operations |

### Functional Domains

```
┌─────────────────────────────────────────────────────────────┐
│                    SENTINEL-SYNC PHASE 1                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  USER DOMAIN │  │  SERVICE     │  │  AUDIT       │     │
│  │              │  │  DOMAIN      │  │  DOMAIN      │     │
│  │  • User      │  │  • Service   │  │  • Logs      │     │
│  │    Profiles  │  │    Catalog   │  │    Tracking  │     │
│  │  • Email     │  │  • Equipment │  │  • Status    │     │
│  │    Registry  │  │    Status    │  │    Changes   │     │
│  │  • Auth Data │  │  • Location  │  │  • History   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## External Dependencies

| Dependency Type | Component | Version/Image | Purpose |
|-----------------|-----------|---------------|---------|
| Database Engine | PostgreSQL | 15.2-alpine | Primary relational data store |
| Container Runtime | Docker Engine | 20.10.x+ | Container lifecycle management |
| Orchestration | Docker Compose | 2.15.x+ | Multi-container coordination |
| API Client Testing | psql / DBeaver / pgAdmin | Latest | Manual SQL verification |
| Version Control | Git | 2.30.x+ | Source code management |
| Remote Repository | GitHub/GitLab | N/A | Code hosting & submission |

---

## Environmental Configuration

### Port Allocation

| Service | Port | Purpose | Exposure |
|---------|------|---------|----------|
| PostgreSQL Primary | 5432 | Database engine listening port | Host mapped (5432:5432) |
| pgAdmin (Optional) | 5050 | pgAdmin web interface | Host mapped (5050:80) |

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
```

---

## Directory Structure

```
sentinel-sync/
├── .gitignore
├── .env
├── README.md
├── database/
│   ├── schema.sql              # Database schema with constraints, triggers, functions
│   ├── test_seed.sql           # Mock data for testing
│   └── docker-compose.db.yml   # Docker Compose configuration
└── docs/
    └── api_contract.md         # REST API contract documentation
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐         ┌─────────────────────────┐
│      USERS      │         │   CAMPUS_SERVICES       │
├─────────────────┤         ├─────────────────────────┤
│ PK user_id      │◄────────┤ FK last_updated_by      │
│    name         │         │ PK item_id              │
│    email (UNIQ) │         │    service_name         │
│    password_hash│         │    service_type         │
└─────────────────┘         │    status              │
                            │    quantity_available  │
                            │    location            │
                            │    last_updated_at     │
                            └───────────┬─────────────┘
                                        │
                                        │ 1
                                        │
                                        │ M
                            ┌───────────▼─────────────┐
                            │    SERVICE_LOGS         │
                            ├─────────────────────────┤
                            │ PK log_id              │
                            │ FK item_id             │
                            │ FK user_id             │
                            │    old_status          │
                            │    new_status          │
                            │    action_type         │
                            │    created_at          │
                            └─────────────────────────┘
```

### Table: `users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | SERIAL | PRIMARY KEY | Unique user identifier |
| `name` | VARCHAR(100) | NOT NULL | User's full name |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User's email address |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt/Argon2 hashed password |

**Indexes:**
- `idx_users_email` ON `email`

### Table: `campus_services`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `item_id` | SERIAL | PRIMARY KEY | Unique equipment/service identifier |
| `service_name` | VARCHAR(100) | NOT NULL | e.g., Central Lab, Campus Café |
| `service_type` | VARCHAR(50) | NOT NULL | e.g., Lab, Food, Library, Transport |
| `status` | VARCHAR(20) | NOT NULL | Available, Low Stock, Maintenance, Out of Service |
| `last_updated_by` | INTEGER | FOREIGN KEY → users(user_id) | Reference to user who last updated |
| `last_updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Auto-updated timestamp |
| `quantity_available` | INTEGER | DEFAULT 0 | Number of items available |
| `location` | VARCHAR(100) | NULL | Physical location on campus |

**Indexes:**
- `idx_campus_services_service_name` ON `service_name`
- `idx_campus_services_status` ON `status`
- `idx_campus_services_service_type` ON `service_type`
- `idx_campus_services_last_updated_by` ON `last_updated_by`

**Constraints:**
- `uk_campus_services_name_location` UNIQUE (service_name, location)
- `ck_campus_services_status` CHECK: IN ('Available', 'Low Stock', 'Maintenance', 'Out of Service')
- `ck_campus_services_service_type` CHECK: IN ('Lab', 'Food', 'Library', 'Transport', 'Other')
- `ck_campus_services_quantity` CHECK: >= 0

### Table: `service_logs`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `log_id` | SERIAL | PRIMARY KEY | Audit log identifier |
| `item_id` | INTEGER | FOREIGN KEY → campus_services(item_id) | Reference to service/equipment |
| `user_id` | INTEGER | FOREIGN KEY → users(user_id) | Who performed the action |
| `old_status` | VARCHAR(20) | NULL | Previous status value |
| `new_status` | VARCHAR(20) | NULL | New status value |
| `action_type` | VARCHAR(50) | NOT NULL | e.g., UPDATE, CREATE, DELETE |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Log entry timestamp |

**Indexes:**
- `idx_service_logs_item_id` ON `item_id`
- `idx_service_logs_user_id` ON `user_id`
- `idx_service_logs_created_at` ON `created_at`

### Table: `error_logs`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `error_id` | SERIAL | PRIMARY KEY | Error log identifier |
| `error_message` | TEXT | NOT NULL | Error message |
| `error_context` | TEXT | NULL | Error context |
| `error_timestamp` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When error occurred |
| `error_query` | TEXT | NULL | Query that caused error |

**Indexes:**
- `idx_error_logs_timestamp` ON `error_timestamp`

---

## Functional Specifications

### Static Domain: Users

| Field | Type | Static Constraints | Business Rule |
|-------|------|-------------------|---------------|
| `user_id` | SERIAL | NOT NULL, PRIMARY KEY | System-generated unique identifier |
| `name` | VARCHAR(100) | NOT NULL | Full name, minimum 2 characters |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Valid email format |
| `password_hash` | VARCHAR(255) | NOT NULL | Static placeholder in Phase 1 |

### Static Domain: Campus Services

| Field | Type | Static Constraints | Business Rule |
|-------|------|-------------------|---------------|
| `item_id` | SERIAL | NOT NULL, PRIMARY KEY | System-generated unique identifier |
| `service_name` | VARCHAR(100) | NOT NULL | Must be unique per location |
| `service_type` | VARCHAR(50) | NOT NULL | ENUM: 'Lab', 'Food', 'Library', 'Transport', 'Other' |
| `status` | VARCHAR(20) | NOT NULL | ENUM: 'Available', 'Low Stock', 'Maintenance', 'Out of Service' |
| `last_updated_by` | INTEGER | FOREIGN KEY → users.user_id | Must reference existing user |
| `last_updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Auto-updated on any change |
| `quantity_available` | INTEGER | DEFAULT 0, CHECK >= 0 | Non-negative integer |
| `location` | VARCHAR(100) | NULL | Optional physical location description |

### Status Transition Rules

```
┌─────────────────────────────────────────────────────────────┐
│                    STATUS TRANSITIONS                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  AVAILABLE ──────────► LOW STOCK                           │
│      │                     │                                │
│      ▼                     ▼                                │
│  MAINTENANCE ◄─────────► OUT OF SERVICE                    │
│      ▲                     ▲                                │
│      └─────────────────────┘                               │
│                                                             │
│  Rules:                                                    │
│  • Available → Low Stock (when quantity < 10)              │
│  • Available → Maintenance (scheduled downtime)            │
│  • Low Stock → Available (when restocked)                 │
│  • Low Stock → Out of Service (when completely depleted)  │
│  • Maintenance → Available (when repairs complete)        │
│  • Out of Service → Available (when restored)             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Static Test Data

**Users (5 records):**

| name | email | password_hash |
|------|-------|---------------|
| Dr. Sarah Ahmed | sarah.ahmed@campus.edu | STATIC_HASH_1 |
| Prof. James Wilson | james.wilson@campus.edu | STATIC_HASH_2 |
| Admin Maria Khan | maria.khan@campus.edu | STATIC_HASH_3 |
| Lab Technician Raj Patel | raj.patel@campus.edu | STATIC_HASH_4 |
| Librarian Emma Davis | emma.davis@campus.edu | STATIC_HASH_5 |

**Campus Services (10 records):**

| service_name | service_type | status | quantity | location |
|--------------|--------------|--------|----------|----------|
| Central Computer Lab | Lab | Available | 45 | Science Building, Rm 101 |
| Engineering Workshop | Lab | Available | 12 | Engineering Hall, Rm 205 |
| Campus Main Café | Food | Low Stock | 8 | Student Center, 1st Floor |
| Library Study Commons | Library | Available | 50 | Library Main Floor |
| Quiet Study Room A | Library | Low Stock | 1 | Library, 3rd Floor |
| Computer Lab 3 | Lab | Maintenance | 0 | Tech Building, Rm 302 |
| Mobile Learning Lab | Lab | Available | 20 | Education Building, Rm 110 |
| Campus Shuttle Service | Transport | Low Stock | 3 | Main Entrance |
| Late Night Cafe | Food | Out of Service | 0 | Dormitory Building |
| Medical Equipment Lab | Lab | Low Stock | 5 | Health Sciences Center |

**Service Logs (15 records):**

| item_id | user_id | old_status | new_status | action_type |
|---------|---------|------------|------------|-------------|
| 1 | 1 | NULL | Available | CREATE |
| 2 | 1 | NULL | Available | CREATE |
| 3 | 2 | NULL | Low Stock | CREATE |
| 4 | 3 | NULL | Available | CREATE |
| 5 | 3 | NULL | Available | CREATE |
| 6 | 4 | NULL | Maintenance | CREATE |
| 7 | 4 | NULL | Available | CREATE |
| 8 | 5 | NULL | Available | CREATE |
| 9 | 2 | NULL | Out of Service | CREATE |
| 10 | 1 | NULL | Low Stock | CREATE |
| 3 | 2 | Low Stock | Out of Service | STATUS_CHANGE |
| 3 | 2 | Out of Service | Low Stock | STATUS_CHANGE |
| 1 | 1 | Available | Low Stock | STATUS_CHANGE |
| 6 | 4 | Maintenance | Available | STATUS_CHANGE |
| 10 | 1 | Low Stock | Maintenance | STATUS_CHANGE |

---

## State Management

### Table Lifecycle States

| State | Description | Transitions |
|-------|-------------|-------------|
| UNDEFINED | Table does not exist | → CREATING |
| CREATING | Table being created | → EMPTY |
| EMPTY | Table exists, no data | → SEEDING, → DROPPING |
| SEEDING | Data being inserted | → POPULATED |
| POPULATED | Contains static test data | → OPERATIONAL, → EMPTY |
| OPERATIONAL | Ready for operations | → POPULATED, → DROPPING |
| DROPPING | Table being dropped | → UNDEFINED |

### Constraint States

| Constraint Type | State | Description |
|-----------------|-------|-------------|
| PRIMARY KEY | ACTIVE | Enforces uniqueness |
| FOREIGN KEY | ACTIVE | Enforces referential integrity |
| UNIQUE | ACTIVE | Enforces uniqueness (email) |
| CHECK | ACTIVE | Enforces business rules |
| NOT NULL | ACTIVE | Enforces non-null values |

### Transaction States

| State | Description | Transition |
|-------|-------------|------------|
| IDLE | Connection established, no transaction | → BEGIN |
| ACTIVE | Transaction in progress | → COMMIT/ROLLBACK |
| COMMITTING | Transaction being committed | → IDLE |
| ROLLING_BACK | Transaction being aborted | → IDLE |
| ABORTED | Transaction failed and rolled back | → IDLE |

---

## Logic Specifications

### Declarative Constraints

```sql
-- Primary Keys
CONSTRAINT pk_users PRIMARY KEY (user_id)
CONSTRAINT pk_campus_services PRIMARY KEY (item_id)
CONSTRAINT pk_service_logs PRIMARY KEY (log_id)
CONSTRAINT pk_error_logs PRIMARY KEY (error_id)

-- Foreign Keys
CONSTRAINT fk_campus_services_last_updated_by FOREIGN KEY (last_updated_by) REFERENCES users(user_id) ON DELETE SET NULL
CONSTRAINT fk_service_logs_item_id FOREIGN KEY (item_id) REFERENCES campus_services(item_id) ON DELETE CASCADE
CONSTRAINT fk_service_logs_user_id FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE

-- Unique Constraints
CONSTRAINT uk_users_email UNIQUE (email)
CONSTRAINT uk_campus_services_name_location UNIQUE (service_name, location)

-- Check Constraints
CONSTRAINT ck_users_email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
CONSTRAINT ck_users_name_length CHECK (LENGTH(name) >= 2)
CONSTRAINT ck_users_password_hash_length CHECK (LENGTH(password_hash) >= 8)
CONSTRAINT ck_campus_services_status CHECK (status IN ('Available', 'Low Stock', 'Maintenance', 'Out of Service'))
CONSTRAINT ck_campus_services_service_type CHECK (service_type IN ('Lab', 'Food', 'Library', 'Transport', 'Other'))
CONSTRAINT ck_campus_services_quantity CHECK (quantity_available >= 0)
CONSTRAINT ck_campus_services_service_name_length CHECK (LENGTH(service_name) >= 3)
CONSTRAINT ck_service_logs_action_type CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'RESTOCK'))
```

### Trigger Functions

| Function | Purpose | Status |
|----------|---------|--------|
| `update_last_updated_at_column()` | Auto-update timestamp on UPDATE | ACTIVE |
| `auto_update_status_by_quantity()` | Auto-update status based on quantity | DISABLED (Phase 2) |
| `log_service_change()` | Log status changes for audit trail | DISABLED (Phase 2) |

### Validation Functions

| Function | Purpose |
|----------|---------|
| `validate_service_status(current, new)` | Validate status transitions |
| `validate_referential_integrity()` | Check all foreign key relationships |
| `validate_status_consistency()` | Check status values match business rules |
| `validate_business_rules()` | Validate email format, duplicate services |

### Utility Functions

| Function | Purpose |
|----------|---------|
| `cleanup_orphaned_records()` | Remove orphaned records |
| `restock_service(item_id, qty, user_id)` | Update quantity and log action |
| `log_error(message, context)` | Log database errors |
| `handle_database_error(code, message)` | Standardized error handling |
| `generate_test_data(user_count, service_count)` | Generate test data |
| `run_all_tests()` | Run all validation tests |

#### Function Usage Examples

```sql
-- Validate status transition
SELECT validate_service_status('Available', 'Low Stock');   -- Returns: TRUE
SELECT validate_service_status('Available', 'Available');   -- Returns: FALSE

-- Restock a service (item_id=3, add 20 units, user_id=1)
SELECT * FROM restock_service(3, 20, 1);
-- Returns: new_quantity=28, new_status='Available'

-- Check referential integrity
SELECT * FROM validate_referential_integrity();
-- Returns: All is_valid = TRUE

-- Check status consistency
SELECT * FROM validate_status_consistency();
-- Returns: All is_valid = TRUE

-- Check business rules
SELECT * FROM validate_business_rules();
-- Returns: All is_compliant = TRUE

-- Run all tests
SELECT * FROM run_all_tests();
-- Returns: All passed = TRUE

-- Cleanup orphaned records
SELECT * FROM cleanup_orphaned_records();

-- Log an error
SELECT log_error('Test error message', 'Test context');

-- Handle database error
SELECT * FROM handle_database_error('23505', 'Duplicate email');
```

### Views

| View | Purpose |
|------|---------|
| `v_service_status_summary` | Aggregated service status by type |
| `v_service_details` | Service details with user info |
| `v_user_activity` | User activity summary |
| `v_all_services_with_status` | All services with current status |
| `v_low_stock_alert` | Services with low stock |
| `v_service_change_history` | Full audit trail |
| `v_services_by_type` | Services grouped by type |
| `v_user_activity_summary` | User activity summary |

#### View Query Examples

```sql
-- Get all services with current status
SELECT * FROM v_all_services_with_status;

-- Get low stock alerts (quantity < 10)
SELECT * FROM v_low_stock_alert;

-- Get service change history
SELECT * FROM v_service_change_history LIMIT 10;

-- Get services grouped by type
SELECT * FROM v_services_by_type;

-- Get user activity summary
SELECT * FROM v_user_activity_summary;

-- Get service status summary
SELECT * FROM v_service_status_summary;

-- Get service details with user info
SELECT * FROM v_service_details;

-- Get user activity log
SELECT * FROM v_user_activity;
```

### Predefined Static Queries (FST §6)

```sql
-- Query 1: All Services with Status
SELECT item_id, service_name, service_type, status, quantity_available, location, updated_by_name
FROM v_all_services_with_status;

-- Query 2: Low Stock Alert
SELECT service_name, service_type, quantity_available, status, location
FROM v_low_stock_alert;

-- Query 3: Service Change History (for specific item)
SELECT log_id, action_type, old_status, new_status, created_at, performed_by, service_name
FROM v_service_change_history
WHERE service_name = 'Central Computer Lab';

-- Query 4: Services by Type
SELECT service_type, total_services, available, low_stock, maintenance, out_of_service, total_items
FROM v_services_by_type;

-- Query 5: User Activity Summary
SELECT user_id, name, email, services_managed, total_actions, last_action
FROM v_user_activity_summary;
```

### Database Statistics

```sql
-- Check table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) -
                   pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'campus_services', 'service_logs', 'error_logs');

-- Check index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN ('users', 'campus_services', 'service_logs');

-- Check constraint status
SELECT
    conname as constraint_name,
    contype as constraint_type,
    CASE
        WHEN convalidated THEN 'VALIDATED'
        ELSE 'UNVALIDATED'
    END as validation_state
FROM pg_constraint
WHERE conrelid IN ('users'::regclass, 'campus_services'::regclass, 'service_logs'::regclass, 'error_logs'::regclass);

-- Check trigger status
SELECT tgname, tgenabled FROM pg_trigger WHERE tgrelid = 'campus_services'::regclass;
```

### Indexes

| Index Name | Table | Column | Purpose |
|------------|-------|--------|---------|
| `idx_users_email` | users | email | Fast email lookups |
| `idx_campus_services_service_name` | campus_services | service_name | Name-based search |
| `idx_campus_services_status` | campus_services | status | Status filtering |
| `idx_campus_services_service_type` | campus_services | service_type | Type-based grouping |
| `idx_campus_services_last_updated_by` | campus_services | last_updated_by | FK join optimization |
| `idx_service_logs_item_id` | service_logs | item_id | Service log lookup |
| `idx_service_logs_user_id` | service_logs | user_id | User log lookup |
| `idx_service_logs_created_at` | service_logs | created_at | Time-based queries |
| `idx_error_logs_timestamp` | error_logs | error_timestamp | Error log queries |

### Constraints Summary

| Constraint | Table | Type | Description |
|------------|-------|------|-------------|
| `pk_users` | users | PRIMARY KEY | user_id uniqueness |
| `uk_users_email` | users | UNIQUE | email uniqueness |
| `ck_users_email_format` | users | CHECK | Valid email format |
| `ck_users_name_length` | users | CHECK | Name >= 2 chars |
| `ck_users_password_hash_length` | users | CHECK | Password >= 8 chars |
| `pk_campus_services` | campus_services | PRIMARY KEY | item_id uniqueness |
| `uk_campus_services_name_location` | campus_services | UNIQUE | Name unique per location |
| `fk_campus_services_last_updated_by` | campus_services | FOREIGN KEY | References users(user_id) |
| `ck_campus_services_status` | campus_services | CHECK | Valid status enum |
| `ck_campus_services_service_type` | campus_services | CHECK | Valid service type enum |
| `ck_campus_services_quantity` | campus_services | CHECK | Quantity >= 0 |
| `ck_campus_services_service_name_length` | campus_services | CHECK | Name >= 3 chars |
| `pk_service_logs` | service_logs | PRIMARY KEY | log_id uniqueness |
| `fk_service_logs_item_id` | service_logs | FOREIGN KEY | References campus_services(item_id) |
| `fk_service_logs_user_id` | service_logs | FOREIGN KEY | References users(user_id) |
| `ck_service_logs_action_type` | service_logs | CHECK | Valid action type enum |
| `ck_service_logs_old_status` | service_logs | CHECK | Valid old status |
| `ck_service_logs_new_status` | service_logs | CHECK | Valid new status |
| `ck_service_logs_status_change` | service_logs | CHECK | Status change validation |
| `pk_error_logs` | error_logs | PRIMARY KEY | error_id uniqueness |

---

## API Contract

### Base Information

| Property | Value |
|----------|-------|
| Base URL | `http://localhost:8000/api/v1` |
| Content-Type | `application/json` |
| Authentication | JWT Bearer Token (Phase 2+) |
| CORS | Enabled for development |

### Users Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `POST` | `/users/register` | Register new user | `{ "name", "email", "password" }` | `201` → `{ "user_id", "name", "email" }` |
| `POST` | `/users/login` | Authenticate user | `{ "email", "password" }` | `200` → `{ "access_token", "token_type" }` |
| `GET` | `/users/{user_id}` | Get user profile | N/A | `200` → `{ "user_id", "name", "email" }` |

### Campus Services Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/services` | List all services | Query: `?status=`, `?type=` | `200` → `[ { "item_id", ... } ]` |
| `GET` | `/services/{item_id}` | Get service by ID | N/A | `200` → `{ "item_id", ... }` |
| `POST` | `/services` | Create new service | `{ "service_name", "service_type", "status", ... }` | `201` → `{ "item_id", ... }` |
| `PUT` | `/services/{item_id}` | Update service | `{ "status", "quantity_available" }` | `200` → `{ "item_id", ... }` |
| `DELETE` | `/services/{item_id}` | Delete service | N/A | `204` → No Content |

### Service Logs Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/services/{item_id}/logs` | Get service audit log | Query: `?limit=`, `?offset=` | `200` → `[ { "log_id", ... } ]` |

### Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET/PUT requests |
| 201 | Created | Successful POST requests |
| 204 | No Content | Successful DELETE requests |
| 400 | Bad Request | Validation errors |
| 401 | Unauthorized | Missing/invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Constraint violation (e.g., duplicate email) |
| 422 | Unprocessable Entity | Semantic errors in request |
| 500 | Internal Server Error | Server-side failure |

### Error Response Format

```json
{
  "error": {
    "code": "UNIQUE_VIOLATION",
    "message": "Email already exists",
    "details": {
      "field": "email",
      "value": "duplicate@campus.edu"
    },
    "timestamp": "2026-07-24T10:30:00Z",
    "path": "/users"
  }
}
```

---

## Testing Procedures

### Quick Verification (One-Liner)

```powershell
docker exec -it sentinel_postgres psql -U sentinel_admin -d sentinel_sync -c "SELECT * FROM run_all_tests();"
```

### Connection Verification

```bash
# Connect to PostgreSQL via Docker
docker exec -it sentinel_postgres psql -U sentinel_admin -d sentinel_sync

# Or via host (if psql installed locally)
psql -h localhost -p 5432 -U sentinel_admin -d sentinel_sync

# Verify connection
SELECT version();
-- Expected: PostgreSQL 15.2 on x86_64-pc-linux-musl, compiled by gcc ...
```

### Schema Verification Tests

```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE';
-- Expected: users, campus_services, service_logs, error_logs

-- Verify column structures for users table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
-- Expected: user_id(SERIAL), name(VARCHAR), email(VARCHAR), password_hash(VARCHAR)

-- Verify column structures for campus_services table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'campus_services'
ORDER BY ordinal_position;

-- Verify all indexes exist
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Verify all constraints exist
SELECT
    conname as constraint_name,
    CASE contype
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'u' THEN 'UNIQUE'
        WHEN 'c' THEN 'CHECK'
    END as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid IN (
    'users'::regclass,
    'campus_services'::regclass,
    'service_logs'::regclass,
    'error_logs'::regclass
)
ORDER BY conrelid, contype;

-- Verify all functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- Verify all views exist
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verify trigger exists
SELECT tgname, tgenabled, tgtype::bit(4) as trigger_type
FROM pg_trigger
WHERE tgrelid = 'campus_services'::regclass;
```

### Constraint Validation Tests

```sql
-- Test UNIQUE constraint on email (should succeed)
INSERT INTO users (name, email, password_hash)
VALUES ('Test User', 'test@example.com', 'hashed123');

-- Test UNIQUE constraint on email (should fail with unique_violation)
INSERT INTO users (name, email, password_hash)
VALUES ('Duplicate User', 'test@example.com', 'hashed456');
-- Expected ERROR: duplicate key value violates unique constraint "uk_users_email"

-- Cleanup test data
DELETE FROM users WHERE email = 'test@example.com';

-- Test FOREIGN KEY constraint (should fail with foreign_key_violation)
INSERT INTO campus_services (
    service_name, service_type, status, last_updated_by, quantity_available
) VALUES (
    'Test Lab', 'Lab', 'Available', 999, 10
);
-- Expected ERROR: insert or update on table "campus_services" violates foreign key constraint

-- Test CHECK constraint - invalid status (should fail)
INSERT INTO campus_services (
    service_name, service_type, status, last_updated_by, quantity_available
) VALUES (
    'Test Lab', 'Lab', 'InvalidStatus', 1, 10
);
-- Expected ERROR: new row for relation "campus_services" violates check constraint

-- Test CHECK constraint - negative quantity (should fail)
INSERT INTO campus_services (
    service_name, service_type, status, last_updated_by, quantity_available
) VALUES (
    'Test Lab', 'Lab', 'Available', 1, -5
);
-- Expected ERROR: new row for relation "campus_services" violates check constraint

-- Test CHECK constraint - short name (should fail)
INSERT INTO campus_services (
    service_name, service_type, status, last_updated_by, quantity_available
) VALUES (
    'AB', 'Lab', 'Available', 1, 10
);
-- Expected ERROR: new row violates check constraint for service_name length
```

### Trigger Tests

```sql
-- Test timestamp trigger (last_updated_at should auto-update)
SELECT last_updated_at FROM campus_services WHERE item_id = 1;
-- Note the timestamp

UPDATE campus_services SET quantity_available = 40 WHERE item_id = 1;

SELECT last_updated_at FROM campus_services WHERE item_id = 1;
-- Timestamp should be different from before
```

### Function Tests

```sql
-- Test validate_service_status function
SELECT validate_service_status('Available', 'Low Stock');    -- Expected: TRUE
SELECT validate_service_status('Available', 'Maintenance');  -- Expected: TRUE
SELECT validate_service_status('Available', 'Available');    -- Expected: FALSE
SELECT validate_service_status('Available', 'Out of Service'); -- Expected: FALSE
SELECT validate_service_status('Low Stock', 'Available');    -- Expected: TRUE
SELECT validate_service_status('Low Stock', 'Out of Service'); -- Expected: TRUE
SELECT validate_service_status('Maintenance', 'Available');  -- Expected: TRUE
SELECT validate_service_status('Out of Service', 'Available'); -- Expected: TRUE

-- Test restock_service function
SELECT * FROM restock_service(3, 20, 1);  -- Restock Campus Main Cafe
-- Expected: new_quantity=28, new_status='Available'

-- Test validate_referential_integrity function
SELECT * FROM validate_referential_integrity();
-- Expected: All is_valid = TRUE

-- Test validate_status_consistency function
SELECT * FROM validate_status_consistency();
-- Expected: All is_valid = TRUE

-- Test validate_business_rules function
SELECT * FROM validate_business_rules();
-- Expected: All is_compliant = TRUE

-- Test run_all_tests function
SELECT * FROM run_all_tests();
-- Expected: All passed = TRUE

-- Test handle_database_error function
SELECT * FROM handle_database_error('23505', 'Duplicate email test');
-- Expected: JSON error response

-- Test log_error function
SELECT log_error('Test error', 'Test context');
-- Expected: Error logged message
```

### Run All Tests

```sql
-- Execute all validation tests
SELECT * FROM run_all_tests();
-- Expected Output:
--       test_group       | passed |             details
-- -----------------------+--------+----------------------------------
--  Referential Integrity | t      | All foreign keys valid
--  Referential Integrity | t      | All foreign keys valid
--  Referential Integrity | t      | All foreign keys valid
--  Status Consistency    | t      | All statuses consistent
--  Status Consistency    | t      | All statuses consistent
--  Status Consistency    | t      | All statuses consistent
--  Status Consistency    | t      | All statuses consistent
--  Business Rules        | t      | All business rules satisfied
--  Business Rules        | t      | All business rules satisfied
--  Data Counts           | t      | Users: 5, Services: 10, Logs: 15
--  Timestamp Trigger     | t      | Trigger exists and is enabled

-- Check referential integrity
SELECT * FROM validate_referential_integrity();

-- Check status consistency
SELECT * FROM validate_status_consistency();

-- Check business rules
SELECT * FROM validate_business_rules();
```

---

## Deployment

### Prerequisites

- Docker Engine 20.10.x+
- Docker Compose 2.15.x+
- Git 2.30.x+
- Windows: WSL2 enabled or Hyper-V enabled in Docker Desktop

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd sentinel-sync
```

### Step 2: Verify Environment File

```powershell
# Check .env file exists
cat .env

# Expected contents:
# POSTGRES_USER=sentinel_admin
# POSTGRES_PASSWORD=S3nt1n3l#2026
# POSTGRES_DB=sentinel_sync
# POSTGRES_HOST=localhost
# POSTGRES_PORT=5432
# DATABASE_URL=postgresql://sentinel_admin:S3nt1n3l%232026@localhost:5432/sentinel_sync
# PGADMIN_DEFAULT_EMAIL=admin@sentinel.local
# PGADMIN_DEFAULT_PASSWORD=admin123
```

### Step 3: Start Database

```powershell
# Start PostgreSQL and pgAdmin
docker-compose --env-file .env -f database/docker-compose.db.yml up -d

# Check container status
docker ps --filter "name=sentinel_postgres"
# Expected: Container shows "Healthy" status

# View startup logs
docker logs sentinel_postgres
```

### Step 4: Verify Database Connection

```powershell
# Connect to PostgreSQL
docker exec -it sentinel_postgres psql -U sentinel_admin -d sentinel_sync

# Inside psql, verify tables
\dt
# Expected:
#                 List of relations
#  Schema |      Name       | Type  |     Owner
# --------+-----------------+-------+----------------
#  public | campus_services | table | sentinel_admin
#  public | error_logs      | table | sentinel_admin
#  public | service_logs    | table | sentinel_admin
#  public | users           | table | sentinel_admin

# Exit psql
\q
```

### Step 5: Verify Seed Data

```powershell
# Quick verification
docker exec -it sentinel_postgres psql -U sentinel_admin -d sentinel_sync -c "SELECT COUNT(*) as users FROM users; SELECT COUNT(*) as services FROM campus_services; SELECT COUNT(*) as logs FROM service_logs;"

# Expected:
#  users
# -------
#      5
#  services
# ---------
#     10
#  logs
# ------
#     15
```

### Step 6: Run All Tests

```powershell
# Run all validation tests
docker exec -it sentinel_postgres psql -U sentinel_admin -d sentinel_sync -c "SELECT * FROM run_all_tests();"

# Expected: All 11 rows show passed = t (true)
```

### Step 7: Optional - Access pgAdmin

```powershell
# Open browser and go to:
# http://localhost:5050

# Login credentials:
# Email: admin@sentinel.local
# Password: admin123

# Add server connection:
# Host: sentinel_postgres (or postgres)
# Port: 5432
# Database: sentinel_sync
# Username: sentinel_admin
# Password: S3nt1n3l#2026
```

### Step 8: Initialize Git

```powershell
git init
git add .gitignore database/ docs/ README.md
git commit -m "Phase 1 Complete: Establish database schemas, isolated Postgres containers, and API contract documentation"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

---

## Operational Commands

| Action | Command |
|--------|---------|
| Start database | `docker-compose --env-file .env -f database/docker-compose.db.yml up -d` |
| Stop database | `docker-compose --env-file .env -f database/docker-compose.db.yml down` |
| Stop & remove volumes | `docker-compose --env-file .env -f database/docker-compose.db.yml down -v` |
| View logs | `docker-compose --env-file .env -f database/docker-compose.db.yml logs -f postgres` |
| Connect to psql | `docker exec -it sentinel_postgres psql -U sentinel_admin -d sentinel_sync` |
| Check container health | `docker ps --filter "name=sentinel_postgres"` |
| Reset database | `docker-compose --env-file .env -f database/docker-compose.db.yml down -v && docker-compose --env-file .env -f database/docker-compose.db.yml up -d` |
| Quick test | `docker exec -it sentinel_postgres psql -U sentinel_admin -d sentinel_sync -c "SELECT * FROM run_all_tests();"` |

---

## Troubleshooting

### Common Issues & Solutions

#### 1. `.env` Variables Not Loaded

**Error:**
```
The "POSTGRES_USER" variable is not set. Defaulting to a blank string.
```

**Solution:**
```powershell
# Use --env-file flag
docker-compose --env-file .env -f database/docker-compose.db.yml up -d

# Or copy .env to database folder
Copy-Item .env database\.env
```

#### 2. Container Unhealthy

**Error:**
```
dependency failed to start: container sentinel_postgres is unhealthy
```

**Solution:**
```powershell
# Check logs for specific error
docker logs sentinel_postgres

# Reset everything and try fresh
docker-compose --env-file .env -f database/docker-compose.db.yml down -v
docker-compose --env-file .env -f database/docker-compose.db.yml up -d
```

#### 3. Foreign Key Violation During Seed

**Error:**
```
ERROR: insert or update on table "campus_services" violates foreign key constraint
DETAIL: Key (last_updated_by)=(1) is not present in table "users".
```

**Solution:**
```powershell
# sequences reset fix is already in test_seed.sql
# Just restart fresh:
docker-compose --env-file .env -f database/docker-compose.db.yml down -v
docker-compose --env-file .env -f database/docker-compose.db.yml up -d
```

#### 4. Port Already in Use

**Error:**
```
Bind for 0.0.0.0:5432 failed: port is already allocated
```

**Solution:**
```powershell
# Stop existing PostgreSQL on host
# Or change port in docker-compose.db.yml
# ports: "5433:5432"  (use 5433 on host)
```

#### 5. Volume Already Exists

**Error:**
```
Error response from daemon: volume database_postgres_data already exists
```

**Solution:**
```powershell
# Remove existing volumes
docker-compose --env-file .env -f database/docker-compose.db.yml down -v
docker volume prune -f
```

#### 6. Container Won't Stop

**Solution:**
```powershell
# Force remove containers
docker rm -f sentinel_postgres sentinel_pgadmin
docker-compose --env-file .env -f database/docker-compose.db.yml down -v
```

#### 7. Schema Changes Not Applying

**Solution:**
```powershell
# Must remove volume to re-run init scripts
docker-compose --env-file .env -f database/docker-compose.db.yml down -v
docker-compose --env-file .env -f database/docker-compose.db.yml up -d
```

### Useful Debug Commands

```powershell
# Check all Docker containers
docker ps -a

# Check Docker volumes
docker volume ls

# Check Docker networks
docker network ls

# Check container resource usage
docker stats sentinel_postgres

# Enter container shell
docker exec -it sentinel_postgres sh

# Check PostgreSQL logs in container
docker exec -it sentinel_postgres cat /var/log/postgresql/postgresql.log

# Check PostgreSQL status inside container
docker exec -it sentinel_postgres pg_isready -U sentinel_admin
```

### Container Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DOCKER CONTAINERS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐     ┌─────────────────────┐          │
│  │ sentinel_postgres   │     │ sentinel_pgadmin    │          │
│  │ PostgreSQL 15.2     │     │ pgAdmin 4 (latest)  │          │
│  │ Port: 5432          │     │ Port: 5050           │          │
│  │                     │     │                     │          │
│  │ ┌─────────────────┐ │     │ ┌─────────────────┐ │          │
│  │ │ sentinel_sync   │ │     │ │ Web Interface   │ │          │
│  │ │ Database        │ │◄────│ │ (Optional)      │ │          │
│  │ └─────────────────┘ │     │ └─────────────────┘ │          │
│  └─────────────────────┘     └─────────────────────┘          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    sentinel_network                      │   │
│  │                    (bridge network)                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Volumes:                                                │   │
│  │   - postgres_data (persistent database storage)         │   │
│  │   - pgadmin_data  (pgAdmin configuration)               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### File Mounting

```
Host Machine                          Container
─────────────────────────────────     ─────────────────────────────────
database/schema.sql          ──►      /docker-entrypoint-initdb.d/01-schema.sql
database/test_seed.sql       ──►      /docker-entrypoint-initdb.d/02-test_seed.sql
```

The init scripts run automatically in alphabetical order when the container starts for the first time.

---

## Git Submission

```powershell
# Initialize repository
git init

# Stage files
git add .gitignore database/ docs/ README.md

# Verify staged files
git status

# Commit
git commit -m "Phase 1 Complete: Establish database schemas, isolated Postgres containers, and API contract documentation"

# Add remote origin
git remote add origin <your-repo-url>

# Push to remote
git branch -M main
git push -u origin main
```

### Git Submission Checklist

| # | Task | Status |
|---|------|--------|
| 1 | Docker installed and running | [x] |
| 2 | `.env` file created with all variables | [x] |
| 3 | `schema.sql` created with proper DDL | [x] |
| 4 | `test_seed.sql` created with mock data | [x] |
| 5 | `docker-compose.db.yml` configured correctly | [x] |
| 6 | Git repository initialized | [ ] |
| 7 | `.gitignore` configured | [x] |
| 8 | Database container starts successfully | [x] |
| 9 | Schema loads without errors | [x] |
| 10 | Test data inserts successfully | [x] |
| 11 | All foreign key constraints validated | [x] |
| 12 | All unique constraints validated | [x] |
| 13 | `api_contract.md` complete | [x] |
| 14 | Phase 1 commit and push | [ ] |

---

## Future Phases

| Phase | Integration | Purpose |
|-------|-------------|---------|
| Phase 2 | Event Bus (RabbitMQ/Kafka) | Asynchronous service communication |
| Phase 3 | Vector Database (Pinecone/Chroma) | AI-powered FAQ retrieval |
| Phase 4 | Redis Cache | Session management & performance |
| Phase 5 | Service Discovery (Consul/Eureka) | Microservice orchestration |

---

## References

- [FastAPI + React Project Setup with UV & Vite (2026)](https://youtu.be/5R8MiQ8DKK4)
- [Full-Stack GenAI Project (FastAPI + React)](https://youtu.be/qF5il_9IwME)
- [Microservices Architecture Explained](https://youtu.be/L4aDJtPYI8M)
- [Docker & Microservices Orchestration](https://youtu.be/uRB_ldBcUVg)

---

**Document Status:** Phase 1 Complete  
**Last Updated:** 2026-07-24  
**Author:** CIS Community Summer Activity Team  
**Version:** v1.0  
**Verified:** All 11 tests passed
