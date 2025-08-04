-- Complete FlowScope schema creation script
-- This bypasses Prisma db push issues by creating tables directly

-- Drop existing tables if they exist (for clean slate)
DROP TABLE IF EXISTS public.bookmarks CASCADE;
DROP TABLE IF EXISTS public.trace_data CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.shared_links CASCADE;
DROP TABLE IF EXISTS public.user_preferences CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.annotations CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;
DROP TABLE IF EXISTS public.team_members CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;

-- Create Users table
CREATE TABLE public.users (
    id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    username VARCHAR UNIQUE,
    name VARCHAR,
    company VARCHAR,
    password_hash VARCHAR NOT NULL,
    role VARCHAR DEFAULT 'developer',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Teams table
CREATE TABLE public.teams (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    owner_id VARCHAR NOT NULL,
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create Team Members table
CREATE TABLE public.team_members (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    team_id VARCHAR NOT NULL,
    role VARCHAR DEFAULT 'MEMBER',
    permissions VARCHAR,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invited_by VARCHAR,
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE,
    UNIQUE(user_id, team_id)
);

-- Create Projects table
CREATE TABLE public.projects (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    team_id VARCHAR,
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL
);

-- Create Sessions table (enhanced)
CREATE TABLE public.sessions (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    user_id VARCHAR,
    team_id VARCHAR,
    project_id VARCHAR,
    description TEXT,
    tags VARCHAR[],
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL,
    FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL
);

-- Create TraceData table (enhanced for multi-language support)
CREATE TABLE public.trace_data (
    id VARCHAR PRIMARY KEY,
    session_id VARCHAR NOT NULL,
    parent_id VARCHAR,
    
    -- Enhanced fields for multi-language support
    operation VARCHAR NOT NULL, -- e.g., "llm_call", "retrieval", "chain_execution"
    language VARCHAR DEFAULT 'javascript', -- "javascript", "python", "go", etc.
    framework VARCHAR DEFAULT 'unknown', -- "langchain", "llamaindex", "custom"
    
    -- Timing data
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- Duration in milliseconds
    
    -- Enhanced data storage (PostgreSQL JSON support)
    data JSONB NOT NULL, -- Input/output data and parameters
    metadata JSONB, -- Framework-specific metadata, performance metrics
    
    -- Status and error handling
    status VARCHAR DEFAULT 'pending', -- "pending", "success", "error"
    error TEXT, -- Error message and stack trace if failed
    
    -- Legacy fields (keeping for backward compatibility)
    chain_id VARCHAR DEFAULT 'unknown',
    type VARCHAR DEFAULT 'trace',
    
    -- Relations
    FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES public.trace_data(id) ON DELETE SET NULL
);

-- Create Bookmarks table
CREATE TABLE public.bookmarks (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    trace_id VARCHAR NOT NULL,
    title VARCHAR,
    notes TEXT,
    tags VARCHAR[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    FOREIGN KEY (trace_id) REFERENCES public.trace_data(id) ON DELETE CASCADE
);

-- Create Shared Links table
CREATE TABLE public.shared_links (
    id VARCHAR PRIMARY KEY,
    session_id VARCHAR NOT NULL,
    share_token VARCHAR UNIQUE NOT NULL,
    created_by VARCHAR NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    permissions JSONB,
    is_active BOOLEAN DEFAULT true,
    access_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create User Preferences table
CREATE TABLE public.user_preferences (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR UNIQUE NOT NULL,
    theme VARCHAR DEFAULT 'light',
    language VARCHAR DEFAULT 'en',
    timezone VARCHAR DEFAULT 'UTC',
    notifications JSONB,
    ui_preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create Comments table
CREATE TABLE public.comments (
    id VARCHAR PRIMARY KEY,
    trace_id VARCHAR NOT NULL,
    user_id VARCHAR NOT NULL,
    content TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT false,
    resolved_by VARCHAR,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (trace_id) REFERENCES public.trace_data(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by) REFERENCES public.users(id) ON DELETE SET NULL
);

-- Create Annotations table
CREATE TABLE public.annotations (
    id VARCHAR PRIMARY KEY,
    trace_id VARCHAR NOT NULL,
    user_id VARCHAR NOT NULL,
    type VARCHAR NOT NULL,
    content JSONB NOT NULL,
    position JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (trace_id) REFERENCES public.trace_data(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create optimized indexes for common query patterns
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_team_id ON public.sessions(team_id);
CREATE INDEX idx_sessions_created_at ON public.sessions(created_at DESC);

CREATE INDEX idx_trace_data_session_time ON public.trace_data(session_id, start_time DESC);
CREATE INDEX idx_trace_data_status ON public.trace_data(status);
CREATE INDEX idx_trace_data_operation ON public.trace_data(operation);
CREATE INDEX idx_trace_data_lang_framework ON public.trace_data(language, framework);
CREATE INDEX idx_trace_data_parent_child ON public.trace_data(parent_id);
CREATE INDEX idx_trace_data_timestamp ON public.trace_data(timestamp);

CREATE INDEX idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX idx_bookmarks_trace_id ON public.bookmarks(trace_id);

CREATE INDEX idx_shared_links_token ON public.shared_links(share_token);
CREATE INDEX idx_shared_links_session ON public.shared_links(session_id);

CREATE INDEX idx_comments_trace_id ON public.comments(trace_id);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);

-- Verify table creation
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
