# Sentinel-Sync API Contract

**Version:** v1.0  
**Date:** 2026-07-24  
**Phase:** 1 - External Dynamic

---

## Base Information

| Property | Value |
|----------|-------|
| Base URL | `http://localhost:8000/api/v1` |
| Content-Type | `application/json` |
| Authentication | JWT Bearer Token (Phase 2+) |
| CORS | Enabled for development |

---

## Users Endpoints

### Register New User

**Endpoint:** `POST /users/register`

**Request Body:**
```json
{
  "name": "string (min: 2, max: 100)",
  "email": "string (valid email format)",
  "password": "string (min: 8, max: 128)"
}
```

**Response (201 Created):**
```json
{
  "user_id": 1,
  "name": "Dr. Sarah Ahmed",
  "email": "sarah.ahmed@campus.edu"
}
```

**Error Responses:**
- `409 Conflict` - Email already exists
- `422 Unprocessable Entity` - Validation error

---

### Authenticate User

**Endpoint:** `POST /users/login`

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200 OK):**
```json
{
  "access_token": "jwt_token_here",
  "token_type": "bearer"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials

---

### Get User Profile

**Endpoint:** `GET /users/{user_id}`

**Path Parameters:**
- `user_id` (integer) - User ID

**Response (200 OK):**
```json
{
  "user_id": 1,
  "name": "Dr. Sarah Ahmed",
  "email": "sarah.ahmed@campus.edu"
}
```

**Error Responses:**
- `404 Not Found` - User not found

---

## Campus Services Endpoints

### List All Services

**Endpoint:** `GET /services`

**Query Parameters:**
- `status` (string, optional) - Filter by status: Available, Low Stock, Maintenance, Out of Service
- `type` (string, optional) - Filter by type: Lab, Food, Library, Transport, Other

**Response (200 OK):**
```json
[
  {
    "item_id": 1,
    "service_name": "Central Computer Lab",
    "service_type": "Lab",
    "status": "Available",
    "quantity_available": 45,
    "location": "Science Building, Rm 101",
    "last_updated_at": "2026-07-24T10:30:00Z",
    "last_updated_by": {
      "user_id": 1,
      "name": "Dr. Sarah Ahmed"
    }
  }
]
```

---

### Get Service by ID

**Endpoint:** `GET /services/{item_id}`

**Path Parameters:**
- `item_id` (integer) - Service ID

**Response (200 OK):**
```json
{
  "item_id": 1,
  "service_name": "Central Computer Lab",
  "service_type": "Lab",
  "status": "Available",
  "quantity_available": 45,
  "location": "Science Building, Rm 101",
  "last_updated_at": "2026-07-24T10:30:00Z",
  "last_updated_by": {
    "user_id": 1,
    "name": "Dr. Sarah Ahmed"
  }
}
```

**Error Responses:**
- `404 Not Found` - Service not found

---

### Create New Service

**Endpoint:** `POST /services`

**Request Body:**
```json
{
  "service_name": "string (min: 3, max: 100)",
  "service_type": "string (enum: Lab, Food, Library, Transport, Other)",
  "status": "string (enum: Available, Low Stock, Maintenance, Out of Service)",
  "quantity_available": "integer (min: 0, default: 0)",
  "location": "string (max: 100, nullable)"
}
```

**Response (201 Created):**
```json
{
  "item_id": 11,
  "service_name": "New Lab",
  "service_type": "Lab",
  "status": "Available",
  "quantity_available": 10,
  "location": "Science Building, Rm 102",
  "last_updated_at": "2026-07-24T10:30:00Z"
}
```

**Error Responses:**
- `422 Unprocessable Entity` - Validation error

---

### Update Service

**Endpoint:** `PUT /services/{item_id}`

**Path Parameters:**
- `item_id` (integer) - Service ID

**Request Body:**
```json
{
  "status": "string (enum: Available, Low Stock, Maintenance, Out of Service)",
  "quantity_available": "integer (min: 0)",
  "location": "string (max: 100, nullable)"
}
```

**Response (200 OK):**
```json
{
  "item_id": 1,
  "status": "Low Stock",
  "quantity_available": 8,
  "last_updated_by": 1,
  "last_updated_at": "2026-07-24T10:35:00Z"
}
```

**Error Responses:**
- `404 Not Found` - Service not found
- `422 Unprocessable Entity` - Validation error

---

### Delete Service

**Endpoint:** `DELETE /services/{item_id}`

**Path Parameters:**
- `item_id` (integer) - Service ID

**Response (204 No Content)**

**Error Responses:**
- `404 Not Found` - Service not found

---

## Service Logs Endpoints

### Get Service Audit Log

**Endpoint:** `GET /services/{item_id}/logs`

**Path Parameters:**
- `item_id` (integer) - Service ID

**Query Parameters:**
- `limit` (integer, optional, default: 50) - Number of logs to return
- `offset` (integer, optional, default: 0) - Number of logs to skip

**Response (200 OK):**
```json
[
  {
    "log_id": 1,
    "old_status": null,
    "new_status": "Available",
    "action_type": "CREATE",
    "created_at": "2026-07-24T10:00:00Z",
    "performed_by": {
      "user_id": 1,
      "name": "Dr. Sarah Ahmed"
    }
  }
]
```

---

## Status Codes

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

---

## Error Response Format

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

## Request/Response Schemas

### UserRegistration
```json
{
  "type": "object",
  "required": ["name", "email", "password"],
  "properties": {
    "name": {
      "type": "string",
      "minLength": 2,
      "maxLength": 100
    },
    "email": {
      "type": "string",
      "format": "email",
      "maxLength": 255
    },
    "password": {
      "type": "string",
      "minLength": 8,
      "maxLength": 128,
      "pattern": "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d@$!%*#?&]{8,}$"
    }
  }
}
```

### ServiceCreate
```json
{
  "type": "object",
  "required": ["service_name", "service_type", "status"],
  "properties": {
    "service_name": {
      "type": "string",
      "minLength": 3,
      "maxLength": 100
    },
    "service_type": {
      "type": "string",
      "enum": ["Lab", "Food", "Library", "Transport", "Other"]
    },
    "status": {
      "type": "string",
      "enum": ["Available", "Low Stock", "Maintenance", "Out of Service"]
    },
    "quantity_available": {
      "type": "integer",
      "minimum": 0,
      "default": 0
    },
    "location": {
      "type": "string",
      "maxLength": 100,
      "nullable": true
    }
  }
}
```

### ServiceUpdate
```json
{
  "type": "object",
  "properties": {
    "status": {
      "type": "string",
      "enum": ["Available", "Low Stock", "Maintenance", "Out of Service"]
    },
    "quantity_available": {
      "type": "integer",
      "minimum": 0
    },
    "location": {
      "type": "string",
      "maxLength": 100,
      "nullable": true
    }
  },
  "minProperties": 1
}
```

---

**Document Status:** Phase 1 Complete
