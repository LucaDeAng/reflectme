import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Types
interface ChatRequest {
  message: string
  tts?: boolean
  user_id?: string
}

interface RAGResult {
  id: string
  table_name: string
  preview: string
  full_content: string
  score: number
  metadata: any
  query_intent?: string
  relevance_reason?: string
}

interface ChatResponse {
  text: string
  audioUrl?: string
  tables_queried: string[]
  processing_time: {
    embedding_ms: number
    search_ms: number
    generation_ms: number
    total_ms: number
  }
}

serve(async (req) => {
  const startTime = Date.now()
  let embeddingTime = 0
  let searchTime = 0
  let generationTime = 0

  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers':
            'authorization, x-client-info, apikey, content-type, baggage, sentry-trace',
        },
      })
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      })
    }

    // Get request data
    const { message, tts = false, user_id }: ChatRequest = await req.json()

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Message is required and must be a non-empty string' 
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')

    console.log('Environment check:')
    console.log('- SUPABASE_URL:', supabaseUrl ? 'Set' : 'NOT SET')
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'NOT SET') 
    console.log('- GEMINI_API_KEY:', geminiApiKey ? `Set (${geminiApiKey.substring(0, 10)}...)` : 'NOT SET')

    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY environment variable is not set')
      return new Response(JSON.stringify({
        error: 'Configuration Error',
        message: 'GEMINI_API_KEY environment variable is required. Please configure it in your Supabase project settings.',
        help: {
          steps: [
            'Get your API key from https://aistudio.google.com/app/apikey',
            'Run: supabase secrets set GEMINI_API_KEY=your_key_here',
            'Run: supabase functions deploy chat-gemini',
            'Try again'
          ]
        }
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting search for query:', message)
    
    // Try RAG search first, fallback to simple search if it fails
    const searchStart = Date.now()
    let ragResults: RAGResult[] = []
    let searchMethod = 'simple'

    try {
      // Set API key for database functions
      await supabase.rpc('set_config', {
        setting_name: 'app.gemini_api_key',
        new_value: geminiApiKey,
        is_local: false
      })

      // Attempt RAG search
      const { data: ragData, error: ragError } = await supabase
        .rpc('rag_search', {
          query_text: message,
          match_count: 8,
          similarity_threshold: 0.75,
          gemini_api_key: geminiApiKey
        })

      if (ragError) {
        console.warn('RAG search failed:', ragError.message, '- falling back to simple search')
        throw new Error('RAG search failed')
      }

      ragResults = ragData as RAGResult[] || []
      searchMethod = 'rag'
      console.log(`RAG search found ${ragResults.length} results`)

    } catch (ragError) {
      console.log('Using intelligent context-aware search fallback')
      
      // Fallback to intelligent context-aware search
      const { data: simpleData, error: simpleError } = await supabase
        .rpc('intelligent_rag_search', {
          query_text: message,
          match_count: 8
        })

      if (simpleError) {
        console.error('Simple search also failed:', simpleError)
        throw new Error(`Search failed: ${simpleError.message}`)
      }

      ragResults = simpleData as RAGResult[] || []
      console.log(`Simple search found ${ragResults.length} results`)
    }

    searchTime = Date.now() - searchStart

    // Build context from search results with intelligent metadata
    let contextText = ''
    const tablesQueried: string[] = []

    if (ragResults.length > 0) {
      contextText = `Relevant information from the database (via ${searchMethod} search):\n\n`
      
      ragResults.forEach((result, index) => {
        if (!tablesQueried.includes(result.table_name)) {
          tablesQueried.push(result.table_name)
        }
        
        // Include query_intent and relevance_reason for intelligent response generation
        const queryIntent = result.query_intent || result.metadata?.query_intent || 'general_search'
        const relevanceReason = result.relevance_reason || result.metadata?.relevance_reason || 'Found relevant content'
        
        contextText += `${index + 1}. From table "${result.table_name}" (ID: ${result.id}, similarity: ${(result.score * 100).toFixed(1)}%, intent: ${queryIntent}):\n`
        contextText += `${result.preview}\n`
        contextText += `Query intent: ${queryIntent}\n`
        contextText += `Relevance: ${relevanceReason}\n\n`
      })
    } else {
      contextText = "No relevant information found in the database for this query.\n"
    }

    // Generate response using Gemini
    const generationStart = Date.now()
    const geminiResponse = await generateGeminiResponse(message, contextText, geminiApiKey)
    generationTime = Date.now() - generationStart

    let audioUrl: string | undefined

    // Generate TTS if requested
    if (tts && geminiResponse) {
      try {
        audioUrl = await generateTTS(geminiResponse, geminiApiKey)
      } catch (ttsError) {
        console.warn('TTS generation failed:', ttsError)
        // Continue without audio
      }
    }

    // Log interaction
    if (user_id) {
      await supabase.from('ai_companion_log').insert({
        user_id,
        query: message,
        response: geminiResponse,
        tables_queried: tablesQueried,
        embedding_time_ms: embeddingTime,
        generation_time_ms: generationTime,
        total_time_ms: Date.now() - startTime,
        metadata: {
          rag_results_count: ragResults.length,
          tts_generated: !!audioUrl,
          search_method: searchMethod
        }
      })
    }

    const response: ChatResponse = {
      text: geminiResponse,
      audioUrl,
      tables_queried: tablesQueried,
      processing_time: {
        embedding_ms: embeddingTime,
        search_ms: searchTime,
        generation_ms: generationTime,
        total_ms: Date.now() - startTime
      }
    }

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (error) {
    console.error('Chat Gemini error:', error)
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
      details: error.stack,
      processing_time: {
        total_ms: Date.now() - startTime
      }
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
})

async function generateGeminiResponse(
  userMessage: string, 
  contextText: string, 
  apiKey: string
): Promise<string> {
  // Intelligent intent-aware response generation
  
  if (contextText.includes('Relevant information from the database')) {
    // Parse the search results to understand intent and context
    const lines = contextText.split('\n').filter(line => line.trim());
    
    // Detect query intent from the context
    let queryIntent = 'general_search';
    let personalDataFound = false;
    let moodDataCount = 0;
    let sessionDataCount = 0;
    let toolsDataCount = 0;
    let knowledgeDataCount = 0;
    
    lines.forEach((line) => {
      // Check for query intent patterns
      if (line.includes('Query intent: personal_mood_data') || line.includes('intent: personal_mood_data')) {
        queryIntent = 'personal_mood_data';
        personalDataFound = true;
      } else if (line.includes('Query intent: personal_session_data') || line.includes('intent: personal_session_data')) {
        queryIntent = 'personal_session_data';
        personalDataFound = true;
      } else if (line.includes('Query intent: personal_progress_data') || line.includes('intent: personal_progress_data')) {
        queryIntent = 'personal_progress_data';
        personalDataFound = true;
      } else if (line.includes('Query intent: coping_tools_info') || line.includes('intent: coping_tools_info')) {
        queryIntent = 'coping_tools_info';
      }
      
      // Count data types
      if (line.includes('Mood entry:') || line.includes('Mood pattern:')) moodDataCount++;
      if (line.includes('Therapy task:') || line.includes('Session context:')) sessionDataCount++;
      if (line.includes('coping_tools')) toolsDataCount++;
      if (line.includes('kg_edges')) knowledgeDataCount++;
    });
    
    // Generate intent-specific responses
    switch (queryIntent) {
      case 'personal_mood_data':
        return generateMoodDataResponse(userMessage, lines, moodDataCount);
      case 'personal_session_data':
        return generateSessionDataResponse(userMessage, lines, sessionDataCount);
      case 'personal_progress_data':
        return generateProgressDataResponse(userMessage, lines);
      case 'coping_tools_info':
        return generateToolsInfoResponse(userMessage, lines, toolsDataCount, knowledgeDataCount);
      default:
        return generateGeneralResponse(userMessage, lines);
    }
  } else {
    return `I understand you're asking about "${userMessage}". Let me search for relevant information in your mental health data. Try asking about "my mood entries," "my therapy sessions," "my progress," or available "breathing techniques" and "coping strategies".`;
  }
}

  /* ORIGINAL GEMINI CODE - Temporarily disabled for debugging
  const systemPrompt = `You are the AI assistant for the Zentia mental health platform. You provide helpful, empathetic responses based on the available data.

IMPORTANT GUIDELINES:
- Always respond in English
- Be supportive and empathetic
- If you reference specific data, mention the table name and ID for transparency
- Keep responses concise but informative
- If no relevant data is found, provide general helpful guidance
- Never make medical diagnoses or provide medical advice
- Encourage users to consult healthcare professionals for serious concerns

Available context from the database:
${contextText}

User question: ${userMessage}

Provide a helpful response based on the available information:`

  try {
    console.log('Calling Gemini API with prompt length:', systemPrompt.length)
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: systemPrompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      }
    )

    console.log('Gemini API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error details:', errorText)
      throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Gemini API response data keys:', Object.keys(data))
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const responseText = data.candidates[0].content.parts[0].text
      console.log('Gemini response generated successfully, length:', responseText.length)
      return responseText
    } else {
      console.error('Invalid Gemini response format:', JSON.stringify(data, null, 2))
      // Return a helpful fallback response instead of the generic error
      if (contextText.includes('Relevant information from the database')) {
        return `I found some relevant information in your mental health data. Based on your query "${userMessage}", here are some suggestions from the available resources. Please check the detailed results for specific coping tools and techniques that might help.`
      } else {
        return `I understand you're asking about "${userMessage}". While I don't have specific data to reference right now, I'm here to help with mental health guidance. You might want to explore breathing techniques, mindfulness exercises, or speak with a healthcare professional for personalized advice.`
      }
    }

  } catch (error) {
    console.error('Gemini generation error:', error)
    // Return a more helpful error message instead of the generic one
    if (contextText.includes('Relevant information from the database')) {
      return `I found relevant information about "${userMessage}" in your mental health data, but I'm having trouble generating a detailed response right now. The search found relevant coping tools and techniques that should be helpful for your query.`
    } else {
      return `I'm currently experiencing some technical difficulties, but I want to help with your query about "${userMessage}". Please try again in a moment, or consider exploring our coping tools and breathing techniques manually.`
    }
  }
  */
}

async function generateTTS(text: string, apiKey: string): Promise<string | undefined> {
  try {
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: 'en-US',
            name: 'en-US-Wavenet-D',
            ssmlGender: 'NEUTRAL'
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
            pitch: 0.0,
            volumeGainDb: 0.0
          }
        })
      }
    )

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.audioContent) {
      // Return data URL for immediate playback
      return `data:audio/mp3;base64,${data.audioContent}`
    }

    return undefined

  } catch (error) {
    console.error('TTS generation error:', error)
    return undefined
  }
}

// Specialized response generators for different query intents

function generateMoodDataResponse(userMessage: string, lines: string[], moodDataCount: number): string {
  let response = `📊 **Your Mood Entries**\n\nI found ${moodDataCount} mood-related entries in your data:\n\n`;
  
  let moodEntries: string[] = [];
  let emotionalPatterns: string[] = [];
  
  lines.forEach((line) => {
    if (line.includes('Mood entry:')) {
      const entry = line.replace(/.*Mood entry: /, '').replace(/\.\.\..*/, '');
      moodEntries.push(entry);
    } else if (line.includes('Mood pattern:')) {
      const pattern = line.replace(/.*Mood pattern: /, '').replace(/\.\.\..*/, '');
      emotionalPatterns.push(pattern);
    }
  });
  
  if (moodEntries.length > 0) {
    response += `🎯 **Recent Mood Tracking:**\n`;
    moodEntries.forEach((entry, index) => {
      response += `${index + 1}. ${entry}\n`;
    });
    response += `\n`;
  }
  
  if (emotionalPatterns.length > 0) {
    response += `🧠 **Emotional Patterns Detected:**\n`;
    emotionalPatterns.forEach((pattern, index) => {
      response += `${index + 1}. ${pattern}\n`;
    });
    response += `\n`;
  }
  
  response += `💡 **Insights:** `;
  if (moodEntries.length > 0) {
    response += `Your recent mood entries show consistent tracking. This is great for understanding your emotional patterns and progress!`;
  } else {
    response += `I don't see many recorded mood entries yet. Consider tracking your mood regularly to help monitor your mental health journey.`;
  }
  
  return response;
}

function generateSessionDataResponse(userMessage: string, lines: string[], sessionDataCount: number): string {
  let response = `📅 **Your Therapy Sessions & Tasks**\n\nI found ${sessionDataCount} therapy-related items:\n\n`;
  
  let therapyTasks: string[] = [];
  let sessionContexts: string[] = [];
  
  lines.forEach((line) => {
    if (line.includes('Therapy task:')) {
      const task = line.replace(/.*Therapy task: /, '').replace(/\.\.\..*/, '');
      therapyTasks.push(task);
    } else if (line.includes('Session context:')) {
      const context = line.replace(/.*Session context: /, '').replace(/\.\.\..*/, '');
      sessionContexts.push(context);
    }
  });
  
  if (therapyTasks.length > 0) {
    response += `📋 **Assigned Therapy Tasks:**\n`;
    therapyTasks.forEach((task, index) => {
      response += `${index + 1}. ${task}\n`;
    });
    response += `\n`;
  }
  
  if (sessionContexts.length > 0) {
    response += `💬 **Session Notes:**\n`;
    sessionContexts.forEach((context, index) => {
      response += `${index + 1}. ${context}\n`;
    });
    response += `\n`;
  }
  
  response += `💡 **Next Steps:** `;
  if (therapyTasks.length > 0) {
    response += `You have active therapy tasks assigned. Focus on completing them to make progress in your mental health journey. Track your completion and mood changes as you work through each task.`;
  } else {
    response += `No specific therapy tasks found. This might be a good time to discuss with your therapist about setting up structured homework assignments.`;
  }
  
  return response;
}

function generateProgressDataResponse(userMessage: string, lines: string[]): string {
  let response = `📈 **Your Progress Summary**\n\n`;
  
  let progressEntries: string[] = [];
  
  lines.forEach((line) => {
    if (line.includes('Progress entry:') || line.includes('Mood entry:')) {
      const entry = line.replace(/.*Progress entry: /, '').replace(/.*Mood entry: /, '').replace(/\.\.\..*/, '');
      progressEntries.push(entry);
    }
  });
  
  if (progressEntries.length > 0) {
    response += `🎯 **Recent Progress:**\n`;
    progressEntries.forEach((entry, index) => {
      response += `${index + 1}. ${entry}\n`;
    });
    response += `\n`;
  }
  
  response += `💡 **Progress Insights:** Your tracking shows engagement with your therapy goals. Keep documenting your progress to maintain momentum and identify patterns in your healing journey.`;
  
  return response;
}

function generateToolsInfoResponse(userMessage: string, lines: string[], toolsCount: number, knowledgeCount: number): string {
  let response = `🛠️ **Available Coping Tools & Techniques**\n\n`;
  
  if (toolsCount > 0) {
    response += `I found ${toolsCount} relevant coping tools for you:\n\n`;
    
    let tools: string[] = [];
    let recommendations: string[] = [];
    
    lines.forEach((line) => {
      if (line.includes('4-7-8 Breathing:') || line.includes('Mindfulness') || line.includes('Grounding')) {
        const tool = line.replace(/.*: /, '').replace(/\.\.\..*/, '');
        tools.push(line.replace(/.*From table.*: /, ''));
      } else if (line.includes('Recommendation:')) {
        const rec = line.replace(/.*Recommendation: /, '').replace(/\.\.\..*/, '');
        recommendations.push(rec);
      }
    });
    
    if (tools.length > 0) {
      response += `🎯 **Recommended Techniques:**\n`;
      tools.slice(0, 3).forEach((tool, index) => {
        response += `${index + 1}. ${tool}\n`;
      });
      response += `\n`;
    }
    
    if (recommendations.length > 0) {
      response += `🧠 **Expert Recommendations:**\n`;
      recommendations.forEach((rec, index) => {
        response += `${index + 1}. ${rec}\n`;
      });
      response += `\n`;
    }
    
    response += `💡 **How to use:** Try these techniques during moments of stress or anxiety. Start with 5-10 minutes daily and track how they affect your mood. The more you practice, the more effective they become.`;
  } else {
    response += `I didn't find specific tools matching your query, but I can help you explore breathing techniques, mindfulness exercises, grounding methods, or cognitive strategies. What type of coping tool are you most interested in?`;
  }
  
  return response;
}

function generateGeneralResponse(userMessage: string, lines: string[]): string {
  return `Based on your query "${userMessage}", I searched across your mental health data and found some relevant information. For more specific results, try asking about:\n\n• "What mood entries do I have?" - for personal mood tracking\n• "Show me my therapy sessions" - for therapy tasks and progress\n• "What breathing techniques are available?" - for coping tools\n• "How am I progressing?" - for progress tracking\n\nI'm here to help you navigate your mental health journey with personalized insights!`;
}