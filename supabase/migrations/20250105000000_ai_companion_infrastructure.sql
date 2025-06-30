-- AI Companion Infrastructure Migration
-- This migration sets up the foundation for cross-table AI companion

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS http;

-- Helper function to get primary key of a table
CREATE OR REPLACE FUNCTION get_primary_key(table_schema text, table_name text)
RETURNS TABLE(column_name text) AS $$
BEGIN
  RETURN QUERY
  SELECT kcu.column_name::text
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = $1
    AND tc.table_name = $2
  ORDER BY kcu.ordinal_position
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get all tables with text columns
CREATE OR REPLACE FUNCTION get_text_tables()
RETURNS TABLE(
  schema_name text,
  table_name text,
  column_name text,
  data_type text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.table_schema::text,
    c.table_name::text,
    c.column_name::text,
    c.data_type::text
  FROM information_schema.columns c
  JOIN information_schema.tables t ON t.table_name = c.table_name 
    AND t.table_schema = c.table_schema
  WHERE t.table_type = 'BASE TABLE'
    AND c.table_schema IN ('public', 'app', 'content')
    AND c.data_type IN ('text', 'character varying', 'char', 'citext', 'json', 'jsonb')
  ORDER BY c.table_schema, c.table_name, c.column_name;
END;
$$ LANGUAGE plpgsql;

-- Queue table for embedding jobs (fallback if pgmq not available)
CREATE TABLE IF NOT EXISTS public.embedding_queue (
  id bigserial PRIMARY KEY,
  table_name text NOT NULL,
  record_id text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payload jsonb,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  error_message text
);

CREATE INDEX IF NOT EXISTS idx_embedding_queue_status ON public.embedding_queue(status, created_at);
CREATE INDEX IF NOT EXISTS idx_embedding_queue_table ON public.embedding_queue(table_name, record_id);

-- Log table for AI companion interactions
CREATE TABLE IF NOT EXISTS public.ai_companion_log (
  id bigserial PRIMARY KEY,
  user_id uuid,
  query text NOT NULL,
  response text,
  tables_queried text[],
  embedding_time_ms integer,
  generation_time_ms integer,
  total_time_ms integer,
  created_at timestamptz DEFAULT now(),
  metadata jsonb
);

CREATE INDEX IF NOT EXISTS idx_ai_companion_log_user ON public.ai_companion_log(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_companion_log_created ON public.ai_companion_log(created_at);

-- RLS policies
ALTER TABLE public.embedding_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_companion_log ENABLE ROW LEVEL SECURITY;

-- Service role can access embedding queue
CREATE POLICY "Service role can manage embedding queue" ON public.embedding_queue
  FOR ALL USING (auth.role() = 'service_role');

-- Users can only see their own logs
CREATE POLICY "Users can view own ai logs" ON public.ai_companion_log
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all logs
CREATE POLICY "Service role can manage ai logs" ON public.ai_companion_log
  FOR ALL USING (auth.role() = 'service_role');

-- Function to safely add embedding column to a table
CREATE OR REPLACE FUNCTION add_embedding_column(
  target_schema text,
  target_table text,
  dimension integer DEFAULT 3072
)
RETURNS boolean AS $$
DECLARE
  sql_stmt text;
  existing_dim integer;
BEGIN
  -- Check if embedding column already exists
  SELECT 
    CASE 
      WHEN data_type = 'USER-DEFINED' AND udt_name = 'vector' THEN
        -- Extract dimension from column definition
        (SELECT COALESCE(
          (regexp_match(column_default, '\((\d+)\)'))[1]::integer,
          dimension
        ))
      ELSE dimension
    END INTO existing_dim
  FROM information_schema.columns
  WHERE table_schema = target_schema 
    AND table_name = target_table 
    AND column_name = 'embedding';

  IF existing_dim IS NOT NULL THEN
    -- Column exists, check if dimension is adequate
    IF existing_dim >= dimension THEN
      RAISE NOTICE 'Embedding column already exists with dimension % for %.%', existing_dim, target_schema, target_table;
      RETURN true;
    ELSE
      RAISE NOTICE 'Embedding column exists but dimension % < required %, keeping existing for %.%', existing_dim, dimension, target_schema, target_table;
      RETURN true;
    END IF;
  END IF;

  -- Add embedding column
  sql_stmt := format('ALTER TABLE %I.%I ADD COLUMN embedding vector(%s)', 
    target_schema, target_table, dimension);
  
  EXECUTE sql_stmt;
  
  -- Add HNSW index for cosine similarity
  sql_stmt := format('CREATE INDEX IF NOT EXISTS %I_embedding_idx ON %I.%I USING hnsw (embedding vector_cosine_ops)', 
    target_table, target_schema, target_table);
  
  EXECUTE sql_stmt;
  
  RAISE NOTICE 'Added embedding column with dimension % to %.%', dimension, target_schema, target_table;
  RETURN true;

EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Failed to add embedding column to %.%: %', target_schema, target_table, SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Function to queue embedding job
CREATE OR REPLACE FUNCTION queue_embedding_job(
  target_table text,
  record_id text,
  text_content text
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.embedding_queue (table_name, record_id, payload)
  VALUES (target_table, record_id, jsonb_build_object(
    'text_content', text_content,
    'timestamp', extract(epoch from now())
  ))
  ON CONFLICT (table_name, record_id) DO UPDATE SET
    payload = EXCLUDED.payload,
    status = 'pending',
    created_at = now(),
    processed_at = null,
    error_message = null;
END;
$$ LANGUAGE plpgsql;

-- Add unique constraint for queue deduplication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'embedding_queue_table_record_unique'
  ) THEN
    ALTER TABLE public.embedding_queue 
    ADD CONSTRAINT embedding_queue_table_record_unique 
    UNIQUE (table_name, record_id);
  END IF;
END $$; 