-- Discover and Prepare Tables for AI Companion
-- This migration automatically adds embedding columns to all tables with text content

DO $$
DECLARE
  table_record RECORD;
  success_count INTEGER := 0;
  total_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting table discovery and preparation...';

  -- Get all tables with text columns that don't have system-managed content
  FOR table_record IN
    SELECT DISTINCT t.table_schema, t.table_name
    FROM information_schema.tables t
    JOIN information_schema.columns c ON c.table_name = t.table_name 
      AND c.table_schema = t.table_schema
    WHERE t.table_type = 'BASE TABLE'
      AND t.table_schema = 'public'
      AND c.data_type IN ('text', 'character varying', 'char', 'citext', 'json', 'jsonb')
      -- Skip system/meta tables
      AND t.table_name NOT LIKE 'pg_%'
      AND t.table_name NOT LIKE '_prisma_%'
      AND t.table_name NOT IN ('embedding_queue', 'ai_companion_log', 'storage_objects', 'buckets')
    ORDER BY t.table_name
  LOOP
    total_count := total_count + 1;
    
    RAISE NOTICE 'Processing table: %.%', table_record.table_schema, table_record.table_name;
    
    -- Add embedding column (function handles existence check)
    IF add_embedding_column(table_record.table_schema, table_record.table_name, 3072) THEN
      success_count := success_count + 1;
    END IF;
  END LOOP;

  RAISE NOTICE 'Table preparation complete: % of % tables processed successfully', success_count, total_count;
END;
$$;

-- Now add triggers for automatic embedding generation
-- This will be done per table to handle different text column combinations

DO $$
DECLARE
  table_record RECORD;
  text_cols text[];
  text_col text;
  trigger_name text;
  function_name text;
  combined_content text;
  sql_stmt text;
BEGIN
  RAISE NOTICE 'Creating embedding triggers...';

  -- For each table with embedding column
  FOR table_record IN
    SELECT t.table_schema, t.table_name
    FROM information_schema.tables t
    JOIN information_schema.columns c ON c.table_name = t.table_name 
      AND c.table_schema = t.table_schema
    WHERE t.table_type = 'BASE TABLE'
      AND t.table_schema = 'public'
      AND EXISTS (
        SELECT 1 FROM information_schema.columns ec
        WHERE ec.table_schema = t.table_schema 
          AND ec.table_name = t.table_name 
          AND ec.column_name = 'embedding'
      )
      AND t.table_name NOT IN ('embedding_queue', 'ai_companion_log')
    ORDER BY t.table_name
  LOOP
    -- Get all text columns for this table
    SELECT array_agg(column_name) INTO text_cols
    FROM information_schema.columns
    WHERE table_schema = table_record.table_schema 
      AND table_name = table_record.table_name
      AND data_type IN ('text', 'character varying', 'char', 'citext')
      AND column_name != 'embedding';

    IF array_length(text_cols, 1) > 0 THEN
      trigger_name := table_record.table_name || '_embedding_trg';
      function_name := table_record.table_name || '_embedding_fn';
      
      -- Build combined content expression
      combined_content := '';
      FOR i IN 1..array_length(text_cols, 1) LOOP
        IF i > 1 THEN
          combined_content := combined_content || ' || '' '' || ';
        END IF;
        combined_content := combined_content || 'COALESCE(NEW.' || text_cols[i] || ', '''')';
      END LOOP;
      
      -- Create trigger function
      sql_stmt := format('
        CREATE OR REPLACE FUNCTION %I.%I()
        RETURNS trigger AS $func$
        DECLARE
          content_text text;
          pk_col text;
          pk_value text;
        BEGIN
          -- Get primary key column name
          SELECT column_name INTO pk_col 
          FROM get_primary_key(%L, %L) 
          LIMIT 1;
          
          IF pk_col IS NULL THEN
            pk_col := ''id'';
          END IF;
          
          -- Get the primary key value
          EXECUTE format(''SELECT ($1).%I::text'', pk_col) 
          USING NEW INTO pk_value;
          
          -- Combine text content
          content_text := %s;
          
          -- Only queue if there is actual content
          IF length(trim(content_text)) > 0 THEN
            PERFORM queue_embedding_job(
              %L,
              pk_value,
              content_text
            );
          END IF;
          
          RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;',
        table_record.table_schema,
        function_name,
        table_record.table_schema,
        table_record.table_name,
        combined_content,
        table_record.table_schema || '.' || table_record.table_name
      );
      
      EXECUTE sql_stmt;
      
      -- Drop existing trigger if exists
      sql_stmt := format('DROP TRIGGER IF EXISTS %I ON %I.%I',
        trigger_name, table_record.table_schema, table_record.table_name);
      EXECUTE sql_stmt;
      
      -- Create trigger
      sql_stmt := format('
        CREATE TRIGGER %I
        AFTER INSERT OR UPDATE OF %s ON %I.%I
        FOR EACH ROW
        EXECUTE FUNCTION %I.%I()',
        trigger_name,
        array_to_string(text_cols, ', '),
        table_record.table_schema,
        table_record.table_name,
        table_record.table_schema,
        function_name
      );
      
      EXECUTE sql_stmt;
      
      RAISE NOTICE 'Created trigger % for table %.% with columns: %', 
        trigger_name, table_record.table_schema, table_record.table_name, array_to_string(text_cols, ', ');
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Embedding triggers creation complete';
END;
$$; 