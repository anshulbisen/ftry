-- Create commonly used PostgreSQL extensions
-- These extensions enhance database functionality

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Case-insensitive text type
CREATE EXTENSION IF NOT EXISTS "citext";

-- Additional date/time functions
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Full-text search improvements
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
