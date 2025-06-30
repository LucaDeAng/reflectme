-- RAG Search Function for Cross-Table AI Companion
-- This function performs semantic search across all tables with embeddings

-- Function to generate embeddings using Gemini
CREATE OR REPLACE FUNCTION generate_embedding(input_text text)
RETURNS vector AS $$
DECLARE
  api_key text;
  api_url text;
  request_body text;
  response jsonb;
  embedding_vector vector;
BEGIN
  -- Get API key from environment
  api_key := current_setting('app.gemini_api_key', true);
  
  IF api_key IS NULL OR api_key = '' THEN
    RAISE EXCEPTION 'Gemini API key not configured. Set app.gemini_api_key.';
  END IF;

  -- Prepare API request
  api_url := 'https://generativelanguage.googleapis.com/v1/models/gemini-embedding-exp-03-07:embedContent?key=' || api_key;
  
  request_body := jsonb_build_object(
    'model', 'models/gemini-embedding-exp-03-07',
    'content', jsonb_build_object(
      'parts', jsonb_build_array(
        jsonb_build_object('text', input_text)
      )
    )
  )::text;

  -- Make HTTP request
  SELECT content::jsonb INTO response
  FROM http_post(
    api_url,
    request_body,
    'application/json'
  );

  -- Extract embedding from response
  IF response ? 'embedding' AND response->'embedding' ? 'values' THEN
    SELECT response->'embedding'->>'values' INTO embedding_vector;
    RETURN embedding_vector::vector;
  ELSE
    RAISE EXCEPTION 'Failed to generate embedding: %', response;
  END IF;

EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Error generating embedding: %', SQLERRM;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Main RAG search function
CREATE OR REPLACE FUNCTION rag_search(
  query_text text,
  match_count integer DEFAULT 8,
  similarity_threshold float DEFAULT 0.75
)
RETURNS TABLE(
  id text,
  table_name text,
  preview text,
  full_content text,
  score float,
  metadata jsonb
) AS $$
DECLARE
  query_embedding vector;
  table_info RECORD;
  table_count integer := 0;
  per_table_limit integer;
  sql_parts text[] := '{}';
  final_sql text;
  text_columns text[];
  pk_column text;
BEGIN
  -- Generate embedding for query
  query_embedding := generate_embedding(query_text);
  
  IF query_embedding IS NULL THEN
    RAISE EXCEPTION 'Failed to generate query embedding';
  END IF;

  -- Count tables with embeddings
  SELECT count(*) INTO table_count
  FROM information_schema.tables t
  WHERE t.table_type = 'BASE TABLE'
    AND t.table_schema = 'public'
    AND EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = t.table_schema 
        AND c.table_name = t.table_name 
        AND c.column_name = 'embedding'
    )
    AND t.table_name NOT IN ('embedding_queue', 'ai_companion_log');

  IF table_count = 0 THEN
    RAISE NOTICE 'No tables with embeddings found';
    RETURN;
  END IF;

  -- Calculate results per table
  per_table_limit := GREATEST(1, match_count / table_count);

  -- Build union query for each table with embeddings
  FOR table_info IN
    SELECT t.table_schema, t.table_name
    FROM information_schema.tables t
    WHERE t.table_type = 'BASE TABLE'
      AND t.table_schema = 'public'
      AND EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_schema = t.table_schema 
          AND c.table_name = t.table_name 
          AND c.column_name = 'embedding'
      )
      AND t.table_name NOT IN ('embedding_queue', 'ai_companion_log')
    ORDER BY t.table_name
  LOOP
    -- Get text columns for this table
    SELECT array_agg(column_name) INTO text_columns
    FROM information_schema.columns
    WHERE table_schema = table_info.table_schema 
      AND table_name = table_info.table_name
      AND data_type IN ('text', 'character varying', 'char', 'citext')
      AND column_name != 'embedding';

    -- Get primary key column - simplified approach
    SELECT column_name INTO pk_column
    FROM get_primary_key(table_info.table_schema, table_info.table_name) 
    LIMIT 1;
    
    -- Fallback to 'id' if no primary key found
    IF pk_column IS NULL THEN
      pk_column := 'id';
    END IF;

    IF array_length(text_columns, 1) > 0 THEN
      -- Build SELECT for this table with safe column references
      sql_parts := sql_parts || format('
        SELECT 
          %I::text as id,
          %L as table_name,
          left(COALESCE(%s, ''''), 200) as preview,
          COALESCE(%s, '''') as full_content,
          (1 - (embedding <=> $1)) as score,
          jsonb_build_object(
            ''table'', %L,
            ''text_columns'', %L::text[],
            ''primary_key'', %L
          ) as metadata
        FROM %I.%I 
        WHERE embedding IS NOT NULL
          AND (1 - (embedding <=> $1)) >= $2
        ORDER BY score DESC 
        LIMIT %s',
        pk_column,
        table_info.table_name,
        array_to_string(
          (SELECT array_agg('COALESCE(' || col || ', '''')') 
           FROM unnest(text_columns) AS col), 
          ' || '' '' || '
        ),
        array_to_string(
          (SELECT array_agg('COALESCE(' || col || ', '''')') 
           FROM unnest(text_columns) AS col), 
          ' || '' '' || '
        ),
        table_info.table_name,
        text_columns,
        pk_column,
        table_info.table_schema,
        table_info.table_name,
        per_table_limit
      );
    END IF;
  END LOOP;

  -- Combine all table queries
  IF array_length(sql_parts, 1) > 0 THEN
    final_sql := 'SELECT * FROM (' || array_to_string(sql_parts, ' UNION ALL ') || 
                 ') combined ORDER BY score DESC LIMIT ' || match_count;
    
    -- Execute the dynamic query
    RETURN QUERY EXECUTE final_sql USING query_embedding, similarity_threshold;
  ELSE
    RAISE NOTICE 'No valid tables found for search';
    RETURN;
  END IF;

EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Error in rag_search: %', SQLERRM;
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix the process_embedding_queue function to handle primary keys better
CREATE OR REPLACE FUNCTION process_embedding_queue(batch_size integer DEFAULT 10)
RETURNS TABLE(
  processed_count integer,
  success_count integer,
  error_count integer
) AS $$
DECLARE
  queue_item RECORD;
  embedding_result vector;
  success_cnt integer := 0;
  error_cnt integer := 0;
  total_cnt integer := 0;
  sql_stmt text;
  table_schema text;
  table_name text;
  pk_column text;
BEGIN
  -- Process pending items
  FOR queue_item IN
    SELECT id, table_name, record_id, payload
    FROM public.embedding_queue
    WHERE status = 'pending'
    ORDER BY created_at
    LIMIT batch_size
    FOR UPDATE SKIP LOCKED
  LOOP
    total_cnt := total_cnt + 1;
    
    BEGIN
      -- Update status to processing
      UPDATE public.embedding_queue 
      SET status = 'processing', processed_at = now()
      WHERE id = queue_item.id;
      
      -- Parse table name (handle schema.table format)
      IF position('.' in queue_item.table_name) > 0 THEN
        table_schema := split_part(queue_item.table_name, '.', 1);
        table_name := split_part(queue_item.table_name, '.', 2);
      ELSE
        table_schema := 'public';
        table_name := queue_item.table_name;
      END IF;
      
      -- Get primary key column
      SELECT column_name INTO pk_column
      FROM get_primary_key(table_schema, table_name) 
      LIMIT 1;
      
      -- Fallback to 'id'
      IF pk_column IS NULL THEN
        pk_column := 'id';
      END IF;
      
      -- Generate embedding
      embedding_result := generate_embedding(queue_item.payload->>'text_content');
      
      IF embedding_result IS NOT NULL THEN
        -- Update the actual table with the embedding
        sql_stmt := format('UPDATE %I.%I SET embedding = $1 WHERE %I = $2',
          table_schema, table_name, pk_column);
        
        EXECUTE sql_stmt USING embedding_result, queue_item.record_id;
        
        -- Mark as completed
        UPDATE public.embedding_queue 
        SET status = 'completed', processed_at = now()
        WHERE id = queue_item.id;
        
        success_cnt := success_cnt + 1;
      ELSE
        -- Mark as failed
        UPDATE public.embedding_queue 
        SET status = 'failed', 
            processed_at = now(),
            error_message = 'Failed to generate embedding'
        WHERE id = queue_item.id;
        
        error_cnt := error_cnt + 1;
      END IF;
      
    EXCEPTION
      WHEN others THEN
        -- Mark as failed with error
        UPDATE public.embedding_queue 
        SET status = 'failed', 
            processed_at = now(),
            error_message = SQLERRM
        WHERE id = queue_item.id;
        
        error_cnt := error_cnt + 1;
    END;
  END LOOP;
  
  RETURN QUERY SELECT total_cnt, success_cnt, error_cnt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to set database configuration (needed for API keys)
CREATE OR REPLACE FUNCTION set_config(
  setting_name text,
  new_value text,
  is_local boolean DEFAULT false
)
RETURNS void AS $$
BEGIN
  -- Use PERFORM to execute the command and discard the result
  PERFORM set_config(setting_name, new_value, is_local);
END;
$$ LANGUAGE plpgsql; 