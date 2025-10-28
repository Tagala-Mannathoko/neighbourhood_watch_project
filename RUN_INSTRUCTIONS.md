# TRAKM - Running Instructions

This guide will help you run both the backend server and the React Native app.

## Prerequisites

1. **Node.js** (v16 or higher) installed
2. **npm** or **yarn** package manager
3. **Expo CLI** (will be installed with the app dependencies)
4. **Neon PostgreSQL Database** connection string (should be in `.env` file)

---

## Step 1: Backend Setup & Run

### Navigate to Backend Directory
```bash
cd backend
```

### Install Dependencies
```bash
npm install
```

### Environment Setup
Make sure you have a `.env` file in the `backend/` directory with:
```
DATABASE_URL=your_neon_database_connection_string
PORT=3000
JWT_SECRET=your_jwt_secret_key_here
```

If you don't have a `.env` file, create one:
```bash
# In the backend directory
echo "DATABASE_URL=your_neon_connection_string" > .env
echo "PORT=3000" >> .env
echo "JWT_SECRET=your_secret_key" >> .env
```

### Run the Backend Server

**For Development (with auto-reload):**
```bash
npm run dev
```

**For Production:**
```bash
npm start
```

You should see:
```
Server running on port 3000
Test at http://localhost:3000
Database connected successfully
```

**Keep this terminal window open** - the backend server must be running for the app to work.

---

## Step 2: React Native App Setup & Run

### Navigate to Project Root
Open a **new terminal window** and navigate to the project root:
```bash
cd C:\Users\kevin\OneDrive\Desktop\SchoolStuff\Year_4\Semester_1\CSI_473\Project\react-native-test\neigbourhood_watch_project
```

### Install Dependencies
```bash
npm install
```

### Configure API URL

Update `constants/config.ts` based on how you're running the app:

**For Emulator/Simulator (iOS/Android):**
```typescript
export const API_URL = 'http://localhost:3000';
```

**For Physical Device (same Wi-Fi network):**
```typescript
// Find your computer's IP address first (run: ipconfig on Windows)
export const API_URL = 'http://YOUR_IP_ADDRESS:3000';
// Example: export const API_URL = 'http://10.220.15.112:3000';
```

**To find your IP address on Windows:**
```bash
ipconfig
# Look for "IPv4 Address" under your active network adapter
```

### Run the Expo App

**Start Expo:**
```bash
npm start
# or
expo start
```

This will open the Expo Dev Tools in your browser and show a QR code.

**Choose your platform:**

1. **iOS Simulator** (Mac only):
   - Press `i` in the terminal
   - Or scan QR code with Camera app

2. **Android Emulator**:
   - Press `a` in the terminal
   - Make sure Android emulator is running first

3. **Physical Device**:
   - Install **Expo Go** app from App Store/Play Store
   - Scan the QR code with:
     - **iOS**: Camera app
     - **Android**: Expo Go app

4. **Web Browser**:
   - Press `w` in the terminal
   - Opens in your default browser

---

## Quick Start (Summary)

### Terminal 1 - Backend:
```bash
cd backend
npm install
npm run dev
```

### Terminal 2 - App:
```bash
cd <project-root>
npm install
# Update constants/config.ts with correct API_URL
npm start
```

---

## Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Windows: Find process using port 3000
netstat -ano | findstr :3000
# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Database connection failed:**
- Check your `.env` file has the correct `DATABASE_URL`
- Verify your Neon database is accessible
- Test connection: `node backend/test-connection.js` (if exists)

### App Issues

**Can't connect to backend:**
- Ensure backend is running on port 3000
- Check `constants/config.ts` has the correct `API_URL`
- For physical device: Use your computer's IP address (not localhost)
- Make sure phone/emulator and computer are on the same Wi-Fi network

**App won't start:**
- Clear cache: `npm start -- --clear`
- Reinstall dependencies: Delete `node_modules` and run `npm install` again

**TypeScript errors:**
- These are usually type warnings and won't prevent the app from running
- The app will function correctly despite these warnings

---

## Testing the Setup

1. **Backend Health Check:**
   - Open browser: `http://localhost:3000`
   - Should see server response

2. **App Login:**
   - Open the app
   - Try to sign up or login
   - If successful, you're connected! ✅

---

## Development Workflow

1. Start backend server first (`npm run dev` in backend/)
2. Start Expo app (`npm start` in root)
3. Make changes to code - both will auto-reload
4. Backend changes require server restart (if not using `npm run dev`)
5. App changes are hot-reloaded automatically

---

## Important Notes

- **Backend must be running** before the app can make API calls
- The backend runs on port **3000** by default
- Use `localhost` for emulators, **IP address** for physical devices
- Keep both terminal windows open during development

