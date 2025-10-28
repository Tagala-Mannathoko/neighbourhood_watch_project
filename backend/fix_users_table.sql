-- Fix users table schema to match TRAKM Neighbourhood Watch schema
-- Run this script in your Neon database console if the table has wrong columns

-- Drop the incorrect users table (WARNING: This will delete all data!)
DROP TABLE IF EXISTS users CASCADE;

-- Recreate users table with correct TRAKM schema
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role_id INT REFERENCES roles(role_id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Verify the table was created correctly
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

