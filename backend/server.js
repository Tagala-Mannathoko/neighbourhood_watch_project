import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import pg from "pg";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Verify database connection and schema
async function verifyDatabaseConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log("Database connected successfully");
    console.log("Verifying TRAKM Neighbourhood Watch schema...");
    
    // Check users table schema
    const tableCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);

    if (tableCheck.rows.length === 0) {
      console.log("Users table does not exist - please create it using your TRAKM schema");
      throw new Error("Users table does not exist. Please run the TRAKM schema creation script.");
    }

    const columns = tableCheck.rows.map(row => row.column_name);
    const hasUserId = columns.includes('user_id');
    const hasId = columns.includes('id');
    
    if (hasId && !hasUserId) {
      console.error("ERROR: Users table has 'id' column but needs 'user_id' (UUID)");
      console.error("The table may have been created with wrong schema.");
      console.error("Please drop and recreate the users table with the correct TRAKM schema:");
      console.error(`
        CREATE TABLE users (
          user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          email VARCHAR(150) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role_id INT REFERENCES roles(role_id),
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      throw new Error("Users table has incorrect schema. Please recreate it with TRAKM schema.");
    }

    if (!hasUserId) {
      throw new Error("Users table missing required 'user_id' column");
    }

    console.log("Users table schema verified ✓");
    
    // Ensure at least one role exists (create default if none)
    const roleCheck = await pool.query("SELECT role_id FROM roles LIMIT 1");
    if (roleCheck.rows.length === 0) {
      console.log("Creating default role...");
      await pool.query(
        "INSERT INTO roles (role_name) VALUES ('User') ON CONFLICT DO NOTHING"
      );
      console.log("Default role created");
    }
  } catch (err) {
    console.error("Error verifying database:", err);
    throw err;
  }
}

// Initialize database connection
verifyDatabaseConnection().catch(err => {
  console.error("Failed to connect to database:", err);
  process.exit(1);
});

// Test route
app.get("/", (req, res) => {
  res.send("API is working!");
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = decoded; // decoded contains user_id and email from token
    next();
  });
};

// Sign up endpoint
app.post("/auth/signup", async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  if (!firstName || !lastName) {
    return res.status(400).json({ error: "First name and last name are required" });
  }

  try {
    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT user_id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Get default role (use first available role or null)
    const roleResult = await pool.query("SELECT role_id FROM roles ORDER BY role_id LIMIT 1");
    const roleId = roleResult.rows.length > 0 ? roleResult.rows[0].role_id : null;

    // Insert new user
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role_id) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING user_id, email, first_name, last_name, created_at`,
      [email, passwordHash, firstName, lastName, roleId]
    );

    const user = rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User created successfully",
      user: {
        user_id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        name: `${user.first_name} ${user.last_name}`
      },
      token
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Login endpoint
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Find user by email
    const { rows } = await pool.query(
      "SELECT user_id, email, password_hash, first_name, last_name FROM users WHERE email = $1",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      user: {
        user_id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        name: `${user.first_name} ${user.last_name}`
      },
      token
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get current user (protected route)
app.get("/auth/me", authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT user_id, email, first_name, last_name, created_at, role_id 
       FROM users WHERE user_id = $1`,
      [req.user.user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = rows[0];
    res.json({ 
      user: {
        ...user,
        name: `${user.first_name} ${user.last_name}`
      }
    });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get all users (for testing - remove or protect in production)
app.get("/users", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT user_id, email, first_name, last_name, created_at, role_id 
       FROM users`
    );
    res.json(rows.map(user => ({
      ...user,
      name: `${user.first_name} ${user.last_name}`
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== ALERT PRIORITIES & STATUSES ==========
// Get alert priorities
app.get("/alert-priorities", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM alert_priority ORDER BY priority_id");
    res.json(rows);
  } catch (err) {
    console.error("Get alert priorities error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get alert statuses
app.get("/alert-statuses", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM alert_status ORDER BY status_id");
    res.json(rows);
  } catch (err) {
    console.error("Get alert statuses error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ========== ALERTS ==========
// Get all alerts
app.get("/alerts", authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        a.*,
        ap.level as priority_level,
        ap.priority_id,
        ast.status_name,
        ast.status_id,
        u.first_name || ' ' || u.last_name as reported_by_name
      FROM alerts a
      LEFT JOIN alert_priority ap ON a.priority_id = ap.priority_id
      LEFT JOIN alert_status ast ON a.status_id = ast.status_id
      LEFT JOIN users u ON a.reported_by = u.user_id
      ORDER BY a.created_at DESC
    `);
    
    res.json(rows.map(alert => ({
      alert_id: alert.alert_id,
      title: alert.title,
      description: alert.description,
      location: alert.location,
      created_at: alert.created_at,
      priority: {
        priority_id: alert.priority_id,
        level: alert.priority_level
      },
      status: {
        status_id: alert.status_id,
        status_name: alert.status_name
      },
      reported_by: alert.reported_by,
      reported_by_name: alert.reported_by_name
    })));
  } catch (err) {
    console.error("Get alerts error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get single alert by ID
app.get("/alerts/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`
      SELECT 
        a.*,
        ap.level as priority_level,
        ap.priority_id,
        ast.status_name,
        ast.status_id,
        u.first_name || ' ' || u.last_name as reported_by_name
      FROM alerts a
      LEFT JOIN alert_priority ap ON a.priority_id = ap.priority_id
      LEFT JOIN alert_status ast ON a.status_id = ast.status_id
      LEFT JOIN users u ON a.reported_by = u.user_id
      WHERE a.alert_id = $1
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "Alert not found" });
    }
    
    const alert = rows[0];
    res.json({
      alert_id: alert.alert_id,
      title: alert.title,
      description: alert.description,
      location: alert.location,
      created_at: alert.created_at,
      priority: {
        priority_id: alert.priority_id,
        level: alert.priority_level
      },
      status: {
        status_id: alert.status_id,
        status_name: alert.status_name
      },
      reported_by: alert.reported_by,
      reported_by_name: alert.reported_by_name
    });
  } catch (err) {
    console.error("Get alert error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Create new alert
app.post("/alerts", authenticateToken, async (req, res) => {
  const { title, description, priority_id, location } = req.body;
  const reported_by = req.user.user_id; // From JWT token

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  if (!priority_id) {
    return res.status(400).json({ error: "Priority is required" });
  }

  try {
    // Get default status (Active) if status_id not provided
    let statusResult = await pool.query(
      "SELECT status_id FROM alert_status WHERE status_name = 'Active' LIMIT 1"
    );
    
    // If no Active status exists, get the first available status
    if (statusResult.rows.length === 0) {
      statusResult = await pool.query("SELECT status_id FROM alert_status ORDER BY status_id LIMIT 1");
    }
    
    const status_id = statusResult.rows.length > 0 ? statusResult.rows[0].status_id : null;
    
    if (!status_id) {
      return res.status(500).json({ error: "No alert status found. Please ensure alert_status table has data." });
    }

    // Insert new alert
    const { rows } = await pool.query(
      `INSERT INTO alerts (title, description, reported_by, priority_id, status_id, location)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, description || null, reported_by, priority_id, status_id, location || null]
    );

    // Get full alert data with joins
    const alertResult = await pool.query(`
      SELECT 
        a.*,
        ap.level as priority_level,
        ast.status_name
      FROM alerts a
      LEFT JOIN alert_priority ap ON a.priority_id = ap.priority_id
      LEFT JOIN alert_status ast ON a.status_id = ast.status_id
      WHERE a.alert_id = $1
    `, [rows[0].alert_id]);

    const alert = alertResult.rows[0];

    res.status(201).json({
      alert_id: alert.alert_id,
      title: alert.title,
      description: alert.description,
      location: alert.location,
      created_at: alert.created_at,
      priority: {
        priority_id: alert.priority_id,
        level: alert.priority_level
      },
      status: {
        status_id: alert.status_id,
        status_name: alert.status_name
      },
      reported_by: alert.reported_by
    });
  } catch (err) {
    console.error("Create alert error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update alert status
app.patch("/alerts/:id/status", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status_id } = req.body;

  if (!status_id) {
    return res.status(400).json({ error: "status_id is required" });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE alerts 
       SET status_id = $1 
       WHERE alert_id = $2
       RETURNING *`,
      [status_id, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Alert not found" });
    }

    res.json({ message: "Alert status updated", alert: rows[0] });
  } catch (err) {
    console.error("Update alert status error:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test at http://localhost:${PORT}`);
});

