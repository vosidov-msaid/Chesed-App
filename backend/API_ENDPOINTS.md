# Chesed API Endpoints

## Overview
26 RESTful endpoints covering users, requests, commitments, and reviews.

---

## Health & Info

### GET `/health`
Health check endpoint.
**Response:** `{ "status": "healthy", "message": "Chesed API is running" }`

### GET `/`
Root endpoint with API information.
**Response:** API metadata and links to documentation.

---

## Users

### POST `/users/register`
Register a new user.
**Body:**
```json
{
  "phone_number": "972-50-1234567",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "both"  // "rider", "driver", or "both"
}
```
**Response:** User object with UUID

### GET `/users/`
List all users with pagination.
**Query Params:**
- `skip`: 0 (offset)
- `limit`: 100 (max results)

### GET `/users/{user_id}`
Get specific user profile.

### PUT `/users/{user_id}`
Update user profile.
**Body:** (all fields optional)
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane@example.com",
  "bio": "I love helping neighbors",
  "latitude": 32.0853,
  "longitude": 34.7818,
  "operating_radius_km": 10
}
```

### DELETE `/users/{user_id}`
Deactivate user account (soft delete).

---

## Requests (Favor Requests)

### POST `/requests/`
Create a new favor request.
**Query Param:** `requester_id` (UUID)
**Body:**
```json
{
  "category": "mobility",  // See categories below
  "title": "Need a ride to hospital",
  "description": "Need to get to Hadassah hospital for appointment",
  "latitude": 32.0853,
  "longitude": 34.7818,
  "location_name": "Hadassah Ein Kerem",
  "timing": "now",  // or "scheduled"
  "scheduled_at": "2026-04-17T10:00:00Z",
  "urgency": "normal",  // or "high"
  "notes": "Please have experience with elderly patients"
}
```

**Categories:**
- `mobility`: Transportation needs
- `errands`: Tasks and logistics
- `food`: Food delivery and meals
- `borrow_lend`: Lending/borrowing items
- `care`: Childcare and elder care
- `muscle`: Physical help (moving, assembly, etc.)
- `presence`: Emotional support and visits
- `practical_skills`: Skills and expertise

### GET `/requests/`
List all public open requests.
**Query Params:**
- `status_filter`: "open", "in_progress", "completed", "cancelled"
- `skip`, `limit`: Pagination

### GET `/requests/{request_id}`
Get specific request details.

### GET `/requests/nearby/search`
Find nearby requests within radius.
**Query Params:**
- `latitude` (required): User latitude
- `longitude` (required): User longitude
- `radius_km`: 5.0 (search radius in kilometers)
- `category`: Optional filter by favor category

**Example:** `/requests/nearby/search?latitude=32.0853&longitude=34.7818&radius_km=10&category=mobility`

### PUT `/requests/{request_id}`
Update request (requester only).
**Query Param:** `requester_id`
**Body:** (all fields optional)
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "completed",
  "notes": "New notes"
}
```

### DELETE `/requests/{request_id}`
Cancel request (requester only).
**Query Param:** `requester_id`

---

## Commitments (Helper Acceptances)

### POST `/commitments/`
Helper accepts a request (creates commitment).
**Body:**
```json
{
  "request_id": "uuid-here",
  "helper_id": "uuid-here",
  "notes": "I can help tomorrow morning"
}
```

### GET `/commitments/`
List commitments with optional filters.
**Query Params:**
- `request_id`: Filter by request
- `helper_id`: Filter by helper
- `status_filter`: "pending", "accepted", "declined", "completed", "cancelled"
- `skip`, `limit`: Pagination

### GET `/commitments/{commitment_id}`
Get specific commitment details.

### PUT `/commitments/{commitment_id}`
Update commitment status (helper only).
**Query Param:** `helper_id`
**Body:**
```json
{
  "status": "accepted",  // or "declined", "completed", "cancelled"
  "notes": "Updated notes"
}
```

### DELETE `/commitments/{commitment_id}`
Cancel commitment (helper only).
**Query Param:** `helper_id`

---

## Reviews & Ratings

### POST `/reviews/`
Create a review for completed commitment.
**Body:**
```json
{
  "commitment_id": "uuid-here",
  "reviewer_id": "uuid-here",
  "reviewed_user_id": "uuid-here",
  "rating": 5,  // 1-5 stars
  "comment": "Amazing help! Very reliable and kind."
}
```

### GET `/reviews/`
List reviews with optional filters.
**Query Params:**
- `reviewed_user_id`: Filter by reviewed user
- `reviewer_id`: Filter by reviewer
- `skip`, `limit`: Pagination

### GET `/reviews/{review_id}`
Get specific review.

### GET `/reviews/user/{user_id}/received`
Get all reviews received by a user.

---

## Typical User Flows

### Flow 1: Request Help
1. `POST /requests/` - Create favor request
2. Helpers see request via `GET /requests/nearby/search`
3. Helper `POST /commitments/` - Accept request
4. Requester or Helper `PUT /requests/{id}` - Update status to completed
5. Either user `POST /reviews/` - Leave feedback

### Flow 2: Help Someone
1. Helper `GET /requests/nearby/search` - Find nearby requests
2. View request details with `GET /requests/{id}`
3. `POST /commitments/` - Commit to helping
4. System notifies requester
5. Complete task and mark as done
6. Receive review from requester

---

## Error Responses

All errors return appropriate HTTP status codes:
- `400` Bad Request - Invalid input or logic violation
- `403` Forbidden - Insufficient permissions
- `404` Not Found - Resource doesn't exist
- `500` Internal Server Error - Server issue

Example error response:
```json
{
  "detail": "User already committed to this request"
}
```

---

## Authentication Notes

Authentication via JWT tokens will be added in next phase.
Currently endpoints accept `requester_id`, `helper_id`, etc. as query params.

This will be replaced with Bearer token validation.

---

## Testing the API

Start the server:
```bash
cd backend
poetry run python run.py
```

Visit interactive docs:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

Try endpoints in the browser or with curl:
```bash
# Get health
curl http://localhost:8000/health

# List users
curl http://localhost:8000/users/

# Get API info
curl http://localhost:8000/
```
