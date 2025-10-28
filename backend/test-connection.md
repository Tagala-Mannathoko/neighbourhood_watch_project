# Testing Backend Connection

## Check if server is running:
1. Open browser and go to: `http://localhost:3000`
2. You should see: "API is working!"

## If testing on physical device:
1. Make sure your device is on the same Wi-Fi network
2. Check Windows Firewall allows port 3000
3. API URL should be: `http://10.220.15.112:3000` (your computer's IP)

## Check server logs:
- The server should show: "Database connected successfully"
- And: "Users table schema verified ✓"

## If schema error:
- Run the SQL in `fix_users_table.sql` in your Neon console
- Then restart the server

