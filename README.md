# Neighbourhood Watch Project 👋

This is a React Native app built with Expo that includes user authentication and database integration using Neon PostgreSQL.

## Features

- User authentication (Login/Signup)
- JWT-based authentication
- Secure password storage with bcrypt
- PostgreSQL database integration via Neon
- Persistent authentication sessions

## Setup

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. The `.env` file is already configured with your Neon database connection string. If you need to update it:
   ```env
   PORT=3000
   DATABASE_URL=your_neon_connection_string
   JWT_SECRET=your-secret-key-change-this-in-production
   ```

4. Start the backend server:
   ```bash
   npm start
   ```

   The server will run on `http://localhost:3000` and automatically create the users table on first run.

### Frontend Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Update API URL (if needed):
   - For local development: Already set to `http://localhost:3000` in `constants/config.ts`
   - For physical device testing: Change to your computer's IP address (e.g., `http://192.168.1.100:3000`)

3. Start the app:
   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Project Structure

```
├── app/
│   ├── (tabs)/          # Main app screens (protected routes)
│   ├── login.tsx        # Login screen
│   ├── signup.tsx       # Signup screen
│   └── index.tsx        # Root redirect
├── backend/
│   ├── server.js        # Express server with auth routes
│   └── .env             # Environment variables
├── contexts/
│   └── AuthContext.tsx  # Authentication context provider
└── constants/
    └── config.ts        # API configuration
```

## API Endpoints

- `POST /auth/signup` - Create a new user account
- `POST /auth/login` - Login with email and password
- `GET /auth/me` - Get current user (protected)

## Database Schema

The users table is automatically created with:
- `id` (SERIAL PRIMARY KEY)
- `email` (VARCHAR, UNIQUE)
- `password` (VARCHAR, hashed with bcrypt)
- `name` (VARCHAR, optional)
- `created_at` (TIMESTAMP)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
