# Task Manager API

A RESTful backend service for managing personal tasks, built with Node.js, Express, and PostgreSQL. Implements secure user authentication with JWT and bcrypt, with full data isolation so each user can only access their own tasks.

## Features

- **User authentication** — registration and login with bcrypt-hashed passwords and JWT-based sessions
- **Full CRUD** for tasks — create, read, update, and delete
- **Per-user data isolation** — tasks are scoped to the authenticated user via foreign key relationships; users cannot view, edit, or delete another user's data
- **Protected routes** — task mutation endpoints require a valid JWT, enforced via custom middleware
- **PostgreSQL persistence** — relational schema with parameterized queries to prevent SQL injection
- **RESTful design** — predictable resource-based endpoints following standard HTTP method conventions

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express |
| Database | PostgreSQL |
| Auth | JSON Web Tokens (jsonwebtoken) |
| Password hashing | bcrypt |
| Environment config | dotenv |

## Architecture

```
Client
  │
  ▼
Express Router
  │
  ├── /auth/register, /auth/login  →  Public
  │
  └── /tasks/*                      →  authenticateToken middleware
                                          │
                                          ▼
                                     PostgreSQL (tasks, users tables)
```

Tasks are linked to users via a `user_id` foreign key. Every query that reads, updates, or deletes a task filters by the authenticated user's ID, so ownership is enforced at the database level, not just in application logic.

## Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL (v14+)

### Installation

```bash
git clone https://github.com/lokendrasah449/task-manager-api.git
cd task-manager-api
npm install
```

### Database Setup

```bash
createdb taskmanager
psql taskmanager
```

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);

CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  done BOOLEAN DEFAULT false,
  user_id INTEGER REFERENCES users(id)
);
```

### Environment Variables

Create a `.env` file in the project root:

```
DB_USER=your_db_username
DB_HOST=localhost
DB_NAME=taskmanager
DB_PASSWORD=your_db_password
DB_PORT=5432
JWT_SECRET=your_long_random_secret_string
```

### Run the Server

```bash
node index.js
```

The API will be available at `http://localhost:3000`.

## API Reference

### Authentication

**Register a new user**
```http
POST /auth/register
Content-Type: application/json

{
  "username": "alice",
  "password": "securepassword"
}
```

**Log in**
```http
POST /auth/login
Content-Type: application/json

{
  "username": "alice",
  "password": "securepassword"
}
```
Returns a JWT to be used in the `Authorization` header for protected routes.

### Tasks

All task routes require a valid JWT, sent as:
```
Authorization: Bearer <token>
```

| Method | Endpoint | Description |
|---|---|---|
| GET | `/tasks` | Get all tasks belonging to the authenticated user |
| POST | `/tasks` | Create a new task |
| PUT | `/tasks/:id` | Update a task (only if owned by the authenticated user) |
| DELETE | `/tasks/:id` | Delete a task (only if owned by the authenticated user) |

**Example: create a task**
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{"title": "Finish project README"}'
```

## Security Notes

- Passwords are hashed with bcrypt before storage; plaintext passwords are never persisted.
- JWTs are signed (not encrypted) — payloads contain only non-sensitive identity data (user ID, username).
- All SQL queries use parameterized placeholders (`$1`, `$2`, ...) to prevent SQL injection.
- Secrets (database credentials, JWT signing key) are stored in environment variables and excluded from version control via `.gitignore`.

## Possible Future Improvements

- Input validation with a schema library (e.g. Zod or express-validator)
- Automated test suite (Jest + Supertest)
- Pagination and filtering on `GET /tasks`
- Deployment to a live environment (Render / Railway)

## License

MIT
