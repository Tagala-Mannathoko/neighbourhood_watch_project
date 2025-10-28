# Setup Instructions

## Quick Start Guide

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start the server
npm start
```

The backend will:
- Connect to your Neon database automatically
- Create the `users` table on first run
- Run on `http://localhost:3000`

### 2. Frontend Setup

```bash
# In the root directory, install dependencies
npm install

# Start Expo
npx expo start
```

### 3. Testing on Physical Device

If you want to test on a physical device:

1. Find your computer's IP address:
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` or `ip addr`

2. Update `constants/config.ts`:
   ```typescript
   export const API_URL = 'http://YOUR_IP_ADDRESS:3000';
   ```

3. Make sure your device is on the same network as your computer

4. Ensure Windows Firewall allows connections on port 3000

### 4. Create Your First Account

1. Open the app
2. Tap "Sign Up"
3. Enter your email, password, and optionally your name
4. You'll be automatically logged in and redirected to the home screen

## Troubleshooting

### Backend Issues

- **Database connection error**: Verify your `DATABASE_URL` in `backend/.env` is correct
- **Port already in use**: Change `PORT` in `backend/.env` to a different port

### Frontend Issues

- **Cannot connect to backend**: 
  - Make sure backend is running
  - Check API_URL in `constants/config.ts`
  - For physical device, ensure correct IP address and same network

### Authentication Issues

- **Token expired**: Logout and login again
- **User not found**: Create a new account or check database connection

