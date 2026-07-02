# CyberSec Lab Trainer — API Documentation

## Authentication

All API endpoints (except public ones) require authentication via JWT token passed in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are obtained via `/api/auth/login` and stored in httpOnly cookies.

---

## Notes API

### GET `/api/notes`
Retrieve user notes with optional filtering.

**Query Parameters:**
- `moduleId` — Filter by module ID
- `itemId` — Filter by item ID  
- `search` — Search in note content

**Response:**
```json
[
  {
    "id": "note_id",
    "content": "Note text",
    "moduleId": "owasp",
    "itemId": "item_123",
    "moduleName": "OWASP Top 10",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

### POST `/api/notes`
Create a new note.

**Request Body:**
```json
{
  "moduleId": "owasp",
  "itemId": "item_123",
  "moduleName": "OWASP Top 10",
  "content": "Note text (max 2000 chars)"
}
```

### GET `/api/notes/[id]`
Get a specific note by ID.

### PUT `/api/notes/[id]`
Update a note.

**Request Body:**
```json
{
  "content": "Updated note text"
}
```

### DELETE `/api/notes/[id]`
Delete a note.

---

## Study Sessions API

### GET `/api/study-sessions`
Retrieve study session statistics.

**Query Parameters:**
- `action` — One of: `today`, `total`, `weekly`, `streak`, `heatmap`
- `weeks` — Number of weeks for `weekly` or `heatmap` action (default: 4)

**Examples:**
- `GET /api/study-sessions?action=today` — Sessions for today
- `GET /api/study-sessions?action=total` — Total study time
- `GET /api/study-sessions?action=weekly&weeks=8` — Weekly stats for 8 weeks
- `GET /api/study-sessions?action=streak` — Current and longest streak
- `GET /api/study-sessions?action=heatmap&weeks=26` — Heatmap data for 26 weeks

### POST `/api/study-sessions`
Create a new study session.

**Request Body:**
```json
{
  "date": "2024-01-15",
  "durationMs": 300000,
  "pageType": "quiz",
  "xpEarned": 10
}
```

**XP Calculation:** 1 XP per 5 minutes, max 10 XP per session.

---

## CTF Labs API

### GET `/api/ctf-labs`
List all CTF labs with optional filtering.

**Query Parameters:**
- `moduleId` — Filter by module ID
- `difficulty` — Filter by difficulty: `easy`, `medium`, `hard`, `expert`
- `type` — Filter by type: `web`, `crypto`, `reverse`, `forensics`, `pwn`, `misc`

**Response:**
```json
[
  {
    "id": "lab_id",
    "title": "SQL Injection Challenge",
    "description": "Bypass authentication",
    "moduleId": "sql-injection",
    "difficulty": "medium",
    "type": "web",
    "points": 100,
    "isActive": true,
    "tags": [
      { "id": "tag_id", "name": "injection" }
    ],
    "submissionsCount": 45,
    "completionRate": 67
  }
]
```

### GET `/api/ctf-labs/[id]`
Get a specific lab by ID.

### PUT `/api/ctf-labs/[id]`
Update a lab (Admin only).

### DELETE `/api/ctf-labs/[id]`
Delete a lab (Admin only).

### POST `/api/ctf-labs/[id]/submit`
Submit a flag for a lab.

**Request Body:**
```json
{
  "flag": "CTF{flag_text}"
}
```

**Response (correct):**
```json
{
  "correct": true,
  "message": "Correct! Flag accepted.",
  "points": 100,
  "attempt": 1
}
```

**Response (incorrect):**
```json
{
  "correct": false,
  "message": "Incorrect flag. Try again!",
  "attempt": 1
}
```

---

## Admin Actions API

### GET `/api/admin-actions`
List all admin actions (Admin only).

**Query Parameters:**
- `actionType` — Filter by action type
- `targetType` — Filter by target type
- `targetId` — Filter by target ID
- `adminId` — Filter by admin ID
- `page` — Page number (default: 1)
- `limit` — Items per page (default: 50, max: 100)
- `stats` — Set to `true` to get statistics instead of actions
- `recent` — Set to `true` to get recent actions only

**Examples:**
- `GET /api/admin-actions` — List all actions with pagination
- `GET /api/admin-actions?actionType=user_create&page=1&limit=20` — Filter by action type
- `GET /api/admin-actions?stats=true` — Get action statistics
- `GET /api/admin-actions?recent=true&limit=10` — Get 10 most recent actions

**Response (actions list):**
```json
{
  "actions": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 125,
    "totalPages": 3
  }
}
```

**Response (statistics):**
```json
{
  "total": 125,
  "byActionType": [
    { "actionType": "user_create", "count": 45 },
    { "actionType": "role_change", "count": 30 }
  ],
  "byTargetType": [
    { "targetType": "user", "count": 100 },
    { "targetType": "assignment", "count": 25 }
  ]
}
```

---

## Admin Action Types

Common `actionType` values:
- `user_create` — User created
- `user_delete` — User deleted
- `role_change` — User role changed
- `user_blocked` — User blocked/unblocked
- `bulk_import` — Bulk users import
- `bulk_export` — Bulk users export
- `bulk_delete` — Bulk users delete
- `assignment_create` — Assignment created
- `grade_override` — Grade manually changed

Common `targetType` values:
- `user` — User account
- `assignment` — Assignment
- `deadline` — Deadline
- `announcement` — Announcement
- `ctf_lab` — CTF challenge

---

## Error Responses

All endpoints return appropriate HTTP status codes:

- `200` — Success
- `201` — Created
- `400` — Bad request (validation error)
- `401` — Unauthorized (not authenticated)
- `403` — Forbidden (insufficient permissions)
- `404` — Not found
- `409` — Conflict (duplicate entry)
- `429` — Too many requests (rate limit)
- `500` — Internal server error

**Error Response Format:**
```json
{
  "error": "Error message",
  "details": [] // Optional validation errors
}
```

---

## Rate Limiting

- User creation: 10 per minute per admin
- Other endpoints: 100 requests per minute per user

Exceeding rate limits returns `429 Too Many Requests`.

---

## Security Features

- JWT authentication with httpOnly cookies
- Ownership verification for user data
- Role-based access control (RBAC)
- IP and user-agent logging for admin actions
- Audit trail for all admin operations
- Input validation with Zod schemas
- SQL injection protection via Prisma ORM
