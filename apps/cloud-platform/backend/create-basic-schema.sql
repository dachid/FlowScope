-- Simple SQL to create basic tables manually, bypassing Prisma's complex dependency resolution
-- This will help us understand if the issue is with the schema complexity or connection

-- Create basic Session table first
CREATE TABLE IF NOT EXISTS public.sessions (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create basic TraceData table 
CREATE TABLE IF NOT EXISTS public.trace_data (
    id VARCHAR PRIMARY KEY,
    session_id VARCHAR NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data JSONB NOT NULL,
    metadata JSONB,
    status VARCHAR DEFAULT 'pending'
);

-- Add foreign key
ALTER TABLE public.trace_data 
ADD CONSTRAINT fk_trace_data_session 
FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;

-- Test query
SELECT 'Tables created successfully' as result;
