# Backend Server

Node.js + Express backend for Neighbourhood Watch app.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Make sure your `.env` file has the correct `DATABASE_URL` from Neon.

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Authentication

- `POST /auth/signup` - Create a new user account
  - Body: `{ email, password, name? }`
  - Returns: `{ user, token }`

- `POST /auth/login` - Login with email and password
  - Body: `{ email, password }`
  - Returns: `{ user, token }`

- `GET /auth/me` - Get current user (requires Authorization header)
  - Header: `Authorization: Bearer <token>`
  - Returns: `{ user }`

### Testing

- `GET /users` - Get all users (for testing)
- `GET /` - Health check endpoint

## Database

The server will automatically create the `users` table on first run with the following schema:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

