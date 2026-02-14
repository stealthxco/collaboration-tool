-- Mission Control Database Initialization Script
-- This script sets up the initial database structure and permissions

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create additional schemas if needed
-- CREATE SCHEMA IF NOT EXISTS analytics;
-- CREATE SCHEMA IF NOT EXISTS logs;

-- Grant permissions to the application user
GRANT ALL PRIVILEGES ON DATABASE mission_control TO mission_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO mission_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO mission_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO mission_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO mission_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO mission_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO mission_user;

-- Log the initialization
DO $$
BEGIN
    RAISE NOTICE 'Mission Control database initialized successfully';
END $$;