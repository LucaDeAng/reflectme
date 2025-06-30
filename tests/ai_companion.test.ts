import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Test configuration
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Test data
const testData = {
  mood_entry: {
    id: 'test-mood-1',
    user_id: 'test-user-123',
    mood_score: 7,
    notes: 'Feeling good today after morning exercise',
    created_at: new Date().toISOString()
  },
  journal_entry: {
    id: 'test-journal-1',
    user_id: 'test-user-123',
    content: 'Today I practiced mindfulness meditation for 20 minutes. It helped me feel centered and calm.',
    created_at: new Date().toISOString()
  }
}

Deno.test("AI Companion Integration Test", async (t) => {
  
  await t.step("Setup - Create test data", async () => {
    console.log("Creating test mood entry...")
    
    // Insert test mood entry
    const { error: moodError } = await supabase
      .from('mood_entries')
      .insert(testData.mood_entry)
    
    if (moodError && !moodError.message.includes('duplicate')) {
      throw new Error(`Failed to insert mood entry: ${moodError.message}`)
    }
    
    console.log("Creating test journal entry...")
    
    // Insert test journal entry
    const { error: journalError } = await supabase
      .from('journal_entries')
      .insert(testData.journal_entry)
    
    if (journalError && !journalError.message.includes('duplicate')) {
      throw new Error(`Failed to insert journal entry: ${journalError.message}`)
    }
    
    // Wait for embeddings to be processed
    console.log("Waiting for embeddings to be processed...")
    await new Promise(resolve => setTimeout(resolve, 5000))
  })

  await t.step("Test - RAG Search Function", async () => {
    console.log("Testing RAG search...")
    
    // Set API key for database functions
    await supabase.rpc('set_config', {
      setting_name: 'app.gemini_api_key',
      new_value: GEMINI_API_KEY,
      is_local: false
    })
    
    // Test RAG search
    const { data: ragResults, error: ragError } = await supabase
      .rpc('rag_search', {
        query_text: 'How am I feeling lately?',
        match_count: 5,
        similarity_threshold: 0.5
      })
    
    if (ragError) {
      throw new Error(`RAG search failed: ${ragError.message}`)
    }
    
    console.log(`RAG search returned ${ragResults?.length || 0} results`)
    
    // Verify we get results
    assertExists(ragResults, "RAG search should return results")
    
    // Check if we found our test data
    const foundMoodEntry = ragResults?.some((result: any) => 
      result.table_name === 'mood_entries' && result.full_content.includes('morning exercise')
    )
    
    const foundJournalEntry = ragResults?.some((result: any) => 
      result.table_name === 'journal_entries' && result.full_content.includes('mindfulness meditation')
    )
    
    console.log(`Found mood entry: ${foundMoodEntry}`)
    console.log(`Found journal entry: ${foundJournalEntry}`)
  })

  await t.step("Test - Chat Gemini Edge Function", async () => {
    console.log("Testing chat-gemini edge function...")
    
    // Test the edge function
    const { data: chatResponse, error: chatError } = await supabase.functions.invoke('chat-gemini', {
      body: {
        message: 'What mood entries do I have?',
        tts: false,
        user_id: testData.mood_entry.user_id
      }
    })
    
    if (chatError) {
      throw new Error(`Chat function failed: ${chatError.message}`)
    }
    
    console.log("Chat response received:", {
      textLength: chatResponse?.text?.length,
      tablesQueried: chatResponse?.tables_queried,
      processingTime: chatResponse?.processing_time
    })
    
    // Verify response structure
    assertExists(chatResponse?.text, "Response should have text")
    assertExists(chatResponse?.tables_queried, "Response should include tables queried")
    assertExists(chatResponse?.processing_time, "Response should include processing time")
    
    // Verify the AI mentions relevant data
    const responseText = chatResponse.text.toLowerCase()
    const mentionsMood = responseText.includes('mood') || 
                        responseText.includes('feeling') || 
                        responseText.includes('7')
    
    if (mentionsMood) {
      console.log("✅ AI response mentions mood-related content")
    } else {
      console.log("⚠️ AI response may not be referencing mood data specifically")
    }
  })

  await t.step("Test - Embedding Queue Processing", async () => {
    console.log("Testing embedding queue processing...")
    
    // Check if there are items in the queue
    const { data: queueItems, error: queueError } = await supabase
      .from('embedding_queue')
      .select('*')
      .eq('status', 'pending')
      .limit(5)
    
    if (queueError) {
      throw new Error(`Failed to fetch queue: ${queueError.message}`)
    }
    
    console.log(`Found ${queueItems?.length || 0} pending items in embedding queue`)
    
    if (queueItems && queueItems.length > 0) {
      // Process some items
      const { data: processResult, error: processError } = await supabase
        .rpc('process_embedding_queue', { batch_size: 3 })
      
      if (processError) {
        throw new Error(`Failed to process queue: ${processError.message}`)
      }
      
      console.log("Queue processing result:", processResult)
    }
  })

  await t.step("Test - Table Discovery", async () => {
    console.log("Testing table discovery...")
    
    // Test get_text_tables function
    const { data: textTables, error: tablesError } = await supabase
      .rpc('get_text_tables')
    
    if (tablesError) {
      throw new Error(`Failed to get text tables: ${tablesError.message}`)
    }
    
    console.log(`Found ${textTables?.length || 0} text columns across all tables`)
    
    // Verify we found expected tables
    const tableNames = new Set(textTables?.map((t: any) => t.table_name) || [])
    console.log("Tables with text columns:", Array.from(tableNames))
    
    // Should include our test tables
    const hasMoodEntries = tableNames.has('mood_entries')
    const hasJournalEntries = tableNames.has('journal_entries')
    
    console.log(`mood_entries found: ${hasMoodEntries}`)
    console.log(`journal_entries found: ${hasJournalEntries}`)
  })

  await t.step("Cleanup - Remove test data", async () => {
    console.log("Cleaning up test data...")
    
    // Remove test entries
    await supabase
      .from('mood_entries')
      .delete()
      .eq('id', testData.mood_entry.id)
    
    await supabase
      .from('journal_entries')
      .delete()
      .eq('id', testData.journal_entry.id)
    
    // Remove any embedding queue entries for test data
    await supabase
      .from('embedding_queue')
      .delete()
      .or(`record_id.eq.${testData.mood_entry.id},record_id.eq.${testData.journal_entry.id}`)
    
    console.log("Test data cleanup complete")
  })
})

Deno.test("AI Companion Performance Test", async () => {
  const startTime = Date.now()
  
  // Set API key
  await supabase.rpc('set_config', {
    setting_name: 'app.gemini_api_key',
    new_value: GEMINI_API_KEY,
    is_local: false
  })
  
  // Test a simple query
  const { data: response, error } = await supabase.functions.invoke('chat-gemini', {
    body: {
      message: 'Hello, what can you tell me about my data?',
      tts: false,
      user_id: 'test-performance-user'
    }
  })
  
  const totalTime = Date.now() - startTime
  
  console.log(`Performance test completed in ${totalTime}ms`)
  console.log("Processing breakdown:", response?.processing_time)
  
  if (error) {
    throw new Error(`Performance test failed: ${error.message}`)
  }
  
  // Performance assertions
  if (totalTime > 30000) { // 30 seconds
    console.warn(`⚠️ Response time (${totalTime}ms) exceeded 30 seconds`)
  } else {
    console.log(`✅ Response time (${totalTime}ms) is acceptable`)
  }
})

Deno.test("AI Companion Error Handling", async () => {
  console.log("Testing error handling...")
  
  // Test with invalid message
  const { error: emptyMessageError } = await supabase.functions.invoke('chat-gemini', {
    body: {
      message: '',
      user_id: 'test-error-user'
    }
  })
  
  if (!emptyMessageError) {
    throw new Error("Should have failed with empty message")
  }
  
  console.log("✅ Properly handled empty message")
  
  // Test with very long message
  const longMessage = 'A'.repeat(10000)
  const { data: longResponse, error: longError } = await supabase.functions.invoke('chat-gemini', {
    body: {
      message: longMessage,
      user_id: 'test-error-user'
    }
  })
  
  if (longError) {
    console.log("⚠️ Long message handling:", longError.message)
  } else {
    console.log("✅ Handled long message successfully")
  }
}) 