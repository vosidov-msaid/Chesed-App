# Chesed Backend API

A FastAPI-based REST API for the Chesed mobile application. Handles user management, favor requests, commitments, and reputation tracking.

## Tech Stack

- **Framework**: FastAPI 0.100+
- **Database**: PostgreSQL with async SQLAlchemy 2.0
- **ORM**: SQLAlchemy 2.0 async
- **Migrations**: Alembic
- **Environment**: Poetry
- **Authentication**: JWT (to be implemented)

## Setup

### Prerequisites

- Python 3.10+
- PostgreSQL 12+
- Poetry

### Installation

1. Install dependencies:
```bash
poetry install
```

2. Create a PostgreSQL database:
```bash
createdb chesed_db
```

3. Create `.env` file with your configuration:
```env
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost/chesed_db
SECRET_KEY=your-secret-key-here
DEBUG=True
```

### Running Migrations

Create initial schema:
```bash
cd backend
poetry run alembic upgrade head
```

Generate new migrations after model changes:
```bash
poetry run alembic revision --autogenerate -m "Description of changes"
```

### Running the Server

```bash
cd backend
poetry run python run.py
```

Server will be available at `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

## Project Structure

```
backend/
├── app/
│   ├── api/              # API routers (endpoints)
│   ├── core/             # Configuration and constants
│   ├── db/               # Database session and base
│   ├── models/           # SQLAlchemy models
│   ├── schemas/          # Pydantic request/response models
│   ├── services/         # Business logic
│   └── main.py           # FastAPI app initialization
├── migrations/           # Alembic migrations
├── tests/                # Test suite
├── alembic.ini          # Alembic config
└── run.py               # Entry point
```

## API Features

- User management (registration, profiles, locations)
- Favor request creation and management
- Commitment tracking (when helpers accept requests)
- Rating and review system
- Location-based filtering
- Async request handling
- Automatic API documentation (OpenAPI/Swagger)

## Database Models

- **User**: Profile with location, role, reputation
- **Request**: Favor request with category, timing, location
- **Commitment**: Helper acceptance of a request
- **Review**: Rating and feedback system

## Development

Run tests:
```bash
poetry run pytest
```

Code quality:
```bash
poetry run black app/
poetry run flake8 app/
```
