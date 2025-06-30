import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all tables from information_schema
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_schema, table_name')
      .in('table_schema', ['public', 'app', 'content'])
      .eq('table_type', 'BASE TABLE')

    if (tablesError) {
      throw new Error(`Failed to fetch tables: ${tablesError.message}`)
    }

    const manifest = []

    for (const table of tables || []) {
      const tableName = table.table_name
      const schema = table.table_schema

      // Get column information
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_schema', schema)
        .eq('table_name', tableName)
        .in('data_type', ['text', 'character varying', 'char', 'citext', 'json', 'jsonb'])

      if (columnsError) {
        console.warn(`Failed to fetch columns for ${schema}.${tableName}:`, columnsError.message)
        continue
      }

      // Find primary key
      const { data: primaryKey, error: pkError } = await supabase.rpc('get_primary_key', {
        table_schema: schema,
        table_name: tableName
      }).single()

      if (pkError) {
        console.warn(`Failed to get primary key for ${schema}.${tableName}:`, pkError.message)
      }

      // Check if embedding column exists
      const { data: embeddingCol, error: embError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_schema', schema)
        .eq('table_name', tableName)
        .eq('column_name', 'embedding')
        .single()

      const textColumns = columns?.map(col => col.column_name) || []
      
      if (textColumns.length > 0) {
        manifest.push({
          table: `${schema}.${tableName}`,
          schema,
          tableName,
          primaryKey: primaryKey?.column_name || 'id',
          textColumns,
          hasEmbedding: !!embeddingCol,
          embeddingType: embeddingCol?.data_type
        })
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      manifest,
      totalTables: manifest.length
    }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Discovery error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

/* Helper RPC function to get primary key - to be created in migration */ 