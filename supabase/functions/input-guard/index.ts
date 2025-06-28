import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.1.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!, 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const { text, client_id } = await req.json();
    
    if (!text || !client_id) {
      return new Response(
        JSON.stringify({ 
          allowed: false, 
          reason: 'missing_required_fields' 
        }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check for crisis keywords first (faster than external AI APIs)
    const { data: crisisKeywords } = await supabase
      .from('crisis_keywords')
      .select('keyword, severity')
      .eq('is_active', true);

    const lowerText = text.toLowerCase();
    const crisisMatch = crisisKeywords?.find(kw => 
      lowerText.includes(kw.keyword.toLowerCase())
    );

    if (crisisMatch) {
      await supabase.from('guardrail_log').insert({
        client_id,
        direction: 'in',
        reason: `crisis_keyword_${crisisMatch.severity}`,
        raw: text
      });

      // Create alert for critical/high severity
      if (['critical', 'high'].includes(crisisMatch.severity)) {
        await supabase.from('alerts').insert({
          client_id,
          reason: 'crisis_keyword_detected',
          details: {
            keyword: crisisMatch.keyword,
            severity: crisisMatch.severity,
            text: text.substring(0, 200) // First 200 chars for context
          }
        });
      }

      return new Response(
        JSON.stringify({ 
          allowed: false, 
          reason: 'crisis_detected',
          severity: crisisMatch.severity
        }), 
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Gemini safety moderation check
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const moderationPrompt = `
Analyze the following user message for mental health safety concerns.
Respond with "SAFE" if the content is appropriate for mental health therapy, or "UNSAFE" if it contains:
- Explicit self-harm content
- Detailed suicide plans
- Harassment or abuse
- Spam or inappropriate content
- Non-therapeutic harmful content

User message to analyze: "${text}"

Analysis:`;

    const moderationResult = await model.generateContent(moderationPrompt);
    const moderationResponse = await moderationResult.response;
    const moderationText = moderationResponse.text().trim().toLowerCase();
    
    const isUnsafe = moderationText.includes('unsafe') || 
                    moderationText.includes('flagged') || 
                    moderationText.includes('inappropriate');
    
    if (isUnsafe) {
      await supabase.from('guardrail_log').insert({
        client_id,
        direction: 'in',
        reason: 'gemini_flag',
        raw: text
      });
      
      return new Response(
        JSON.stringify({ 
          allowed: false, 
          reason: 'safety_violation' 
        }), 
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ allowed: true }), 
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Input guard error:', error);
    return new Response(
      JSON.stringify({ 
        allowed: false, 
        reason: 'system_error' 
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});