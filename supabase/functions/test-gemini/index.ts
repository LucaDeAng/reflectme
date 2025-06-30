import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        }
      })
    }

    console.log('=== Testing Gemini API Connection ===')
    
    // Check environment variables
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('Environment check:')
    console.log('- GEMINI_API_KEY:', geminiApiKey ? `Set (${geminiApiKey.substring(0, 10)}...)` : 'NOT SET')
    console.log('- SUPABASE_URL:', supabaseUrl ? 'Set' : 'NOT SET')
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'NOT SET')

    if (!geminiApiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'GEMINI_API_KEY environment variable is not set',
        help: 'Please set the GEMINI_API_KEY in your Supabase project settings'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    // Test simple Gemini API call
    console.log('Testing Gemini API call...')
    
    const testResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-latest:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'Say "Hello from Gemini!" in a friendly way.' }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 100,
          }
        })
      }
    )

    console.log('Gemini API response status:', testResponse.status)
    
    if (!testResponse.ok) {
      const errorText = await testResponse.text()
      console.error('Gemini API error:', errorText)
      
      return new Response(JSON.stringify({
        success: false,
        error: `Gemini API error: ${testResponse.status} ${testResponse.statusText}`,
        details: errorText,
        help: 'Check if your API key is valid and has the correct permissions'
      }), {
        status: testResponse.status,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    const geminiData = await testResponse.json()
    console.log('Gemini response:', geminiData)

    // Test embedding API as well
    console.log('Testing Gemini Embedding API...')
    
    const embeddingResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-embedding-exp-03-07:embedContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'models/gemini-embedding-exp-03-07',
          content: {
            parts: [{ text: 'Test embedding content' }]
          }
        })
      }
    )

    console.log('Embedding API response status:', embeddingResponse.status)
    
    const embeddingSuccess = embeddingResponse.ok
    let embeddingError = null
    
    if (!embeddingResponse.ok) {
      embeddingError = await embeddingResponse.text()
      console.error('Embedding API error:', embeddingError)
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Gemini API connection test completed',
      results: {
        generation_api: {
          status: 'success',
          response: geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || 'No text returned'
        },
        embedding_api: {
          status: embeddingSuccess ? 'success' : 'error',
          error: embeddingError
        }
      },
      environment: {
        gemini_api_key_set: true,
        supabase_url_set: !!supabaseUrl,
        supabase_service_key_set: !!supabaseServiceKey
      }
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    })

  } catch (error) {
    console.error('Test function error:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Test function failed',
      message: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    })
  }
}) 