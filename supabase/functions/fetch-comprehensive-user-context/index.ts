import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id } = await req.json()
    
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role key for full access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`Fetching comprehensive context for user: ${user_id}`)

    // Fetch ALL user data in parallel for maximum efficiency
    const [
      profileResult,
      moodEntriesResult,
      journalEntriesResult,
      tasksResult,
      homeworkResult,
      assessmentsResult,
      assessmentResultsResult,
      therapySessionsResult,
      notesResult,
      monitoringEntriesResult,
      chatMessagesResult,
      chatTagsResult,
      aiConversationsResult,
      aiInsightsResult,
      userPreferencesResult,
      crisisInterventionsResult,
      biometricsResult,
      microWinsResult,
      notificationsResult,
      summaryResult,
      therapistRelationResult
    ] = await Promise.allSettled([
      // Core profile data
      supabaseAdmin.from('profiles').select('*').eq('id', user_id).single(),
      
      // Mental health tracking data
      supabaseAdmin.from('mood_entries').select('*').eq('user_id', user_id).order('created_at', { ascending: false }).limit(100),
      supabaseAdmin.from('journal_entries').select('*').eq('user_id', user_id).order('created_at', { ascending: false }).limit(50),
      supabaseAdmin.from('tasks').select('*').eq('client_id', user_id).order('created_at', { ascending: false }),
      supabaseAdmin.from('therapy_homework').select('*').eq('client_id', user_id).order('created_at', { ascending: false }),
      
      // Assessment data
      supabaseAdmin.from('assessments').select('*').eq('client_id', user_id).order('created_at', { ascending: false }),
      supabaseAdmin.from('assessment_results').select(`
        *,
        assessments!inner(instrument, schedule)
      `).eq('assessments.client_id', user_id).order('completed_at', { ascending: false }).limit(20),
      
      // Therapy session data
      supabaseAdmin.from('therapy_sessions').select(`
        *,
        therapist:therapist_id(first_name, last_name, email)
      `).eq('client_id', user_id).order('session_date', { ascending: false }).limit(20),
      
      // Clinical notes
      supabaseAdmin.from('notes').select('*').eq('user_id', user_id).order('created_at', { ascending: false }).limit(50),
      
      // Daily monitoring
      supabaseAdmin.from('monitoring_entries').select('*').eq('client_id', user_id).order('entry_date', { ascending: false }).limit(30),
      
      // Chat and communication data
      supabaseAdmin.from('chat_messages').select('*').eq('client_id', user_id).order('created_at', { ascending: false }).limit(100),
      supabaseAdmin.from('chat_tags').select('*').eq('client_id', user_id).order('ts', { ascending: false }).limit(200),
      
      // AI-specific data
      supabaseAdmin.from('ai_conversations').select('*').eq('user_id', user_id).order('created_at', { ascending: false }).limit(100),
      supabaseAdmin.from('ai_insights').select('*').eq('user_id', user_id).order('created_at', { ascending: false }).limit(50),
      supabaseAdmin.from('user_preferences').select('*').eq('user_id', user_id).single(),
      supabaseAdmin.from('crisis_interventions').select('*').eq('user_id', user_id).order('created_at', { ascending: false }).limit(20),
      
      // Health and wellness data
      supabaseAdmin.from('biometrics_hourly').select('*').eq('client_id', user_id).order('recorded_at', { ascending: false }).limit(100),
      supabaseAdmin.from('micro_wins').select('*').eq('client_id', user_id).order('detected_at', { ascending: false }).limit(50),
      
      // System data
      supabaseAdmin.from('notifications').select('*').eq('user_id', user_id).order('created_at', { ascending: false }).limit(20),
      supabaseAdmin.from('summary_cache').select('*').eq('client_id', user_id).single(),
      
      // Therapist relationship
      supabaseAdmin.from('therapist_client_relations').select(`
        *,
        therapist:therapist_id(first_name, last_name, email, phone)
      `).eq('client_id', user_id).eq('status', 'active')
    ])

    // Helper function to extract data from settled promises
    const extractData = (result: PromiseSettledResult<any>, defaultValue: any = null) => {
      if (result.status === 'fulfilled' && result.value?.data) {
        return result.value.data
      }
      if (result.status === 'rejected') {
        console.error('Query failed:', result.reason)
      }
      return defaultValue
    }

    // Build comprehensive user context
    const userContext = {
      // Core identity (with PHI filtering)
      profile: extractData(profileResult) ? {
        id: extractData(profileResult).id,
        first_name: extractData(profileResult).first_name,
        last_name: extractData(profileResult).last_name,
        preferred_name: extractData(profileResult).first_name, // Use first_name as preferred_name
        role: extractData(profileResult).role,
        created_at: extractData(profileResult).created_at,
        // PHI fields removed: email, phone
      } : null,

      // Mental health tracking
      mood_entries: extractData(moodEntriesResult, []).map((entry: any) => ({
        id: entry.id,
        mood_score: entry.mood_score,
        trigger: entry.trigger,
        notes: entry.notes,
        created_at: entry.created_at
      })),

      journal_entries: extractData(journalEntriesResult, []).map((entry: any) => ({
        id: entry.id,
        content: entry.content,
        mood_score: entry.mood_score,
        tags: entry.tags || [],
        created_at: entry.created_at
      })),

      // Task and homework management
      tasks: extractData(tasksResult, []).map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        task_type: task.task_type,
        priority: task.priority,
        category: task.category,
        due_at: task.due_at,
        completion_criteria: task.completion_criteria,
        max_completions: task.max_completions,
        is_archived: task.is_archived,
        created_at: task.created_at
      })),

      therapy_homework: extractData(homeworkResult, []).map((hw: any) => ({
        id: hw.id,
        title: hw.title,
        description: hw.description,
        homework_type: hw.homework_type,
        instructions: hw.instructions,
        resources: hw.resources,
        due_date: hw.due_date,
        estimated_duration_minutes: hw.estimated_duration_minutes,
        difficulty_level: hw.difficulty_level,
        status: hw.status,
        completion_percentage: hw.completion_percentage,
        completion_notes: hw.completion_notes,
        mood_before: hw.mood_before,
        mood_after: hw.mood_after,
        ai_generated: hw.ai_generated,
        created_at: hw.created_at
      })),

      // Assessment data
      assessments: extractData(assessmentsResult, []).map((assessment: any) => ({
        id: assessment.id,
        instrument: assessment.instrument,
        schedule: assessment.schedule,
        next_due_at: assessment.next_due_at,
        created_at: assessment.created_at
      })),

      assessment_results: extractData(assessmentResultsResult, []).map((result: any) => ({
        id: result.id,
        score: result.score,
        interpretation: result.interpretation,
        severity_level: result.severity_level,
        instrument: result.assessments?.instrument,
        completed_at: result.completed_at
      })),

      // Therapy and clinical data
      therapy_sessions: extractData(therapySessionsResult, []).map((session: any) => ({
        id: session.id,
        session_date: session.session_date,
        session_type: session.session_type,
        duration_minutes: session.duration_minutes,
        notes: session.notes,
        goals: session.goals || [],
        homework_assigned: session.homework_assigned || [],
        techniques_used: session.techniques_used || [],
        mood_before: session.mood_before,
        mood_after: session.mood_after,
        session_rating: session.session_rating,
        therapist_name: session.therapist ? `${session.therapist.first_name} ${session.therapist.last_name}` : null
      })),

      clinical_notes: extractData(notesResult, []).map((note: any) => ({
        id: note.id,
        content: note.content,
        created_at: note.created_at,
        updated_at: note.updated_at
      })),

      // Daily monitoring and wellness
      monitoring_entries: extractData(monitoringEntriesResult, []).map((entry: any) => ({
        id: entry.id,
        mood_rating: entry.mood_rating,
        energy_level: entry.energy_level,
        sleep_quality: entry.sleep_quality,
        stress_level: entry.stress_level,
        anxiety_level: entry.anxiety_level,
        sleep_hours: entry.sleep_hours,
        exercise_minutes: entry.exercise_minutes,
        social_interaction: entry.social_interaction,
        journal_entry: entry.journal_entry,
        gratitude_note: entry.gratitude_note,
        entry_date: entry.entry_date,
        created_at: entry.created_at
      })),

      // Communication and chat data
      chat_messages: extractData(chatMessagesResult, []).map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender,
        message_type: msg.message_type,
        session_id: msg.session_id,
        metadata: msg.metadata,
        created_at: msg.created_at
      })),

      chat_tags: extractData(chatTagsResult, []).map((tag: any) => ({
        id: tag.id,
        tag: tag.tag,
        tag_category: tag.tag_category,
        score: tag.score,
        confidence: tag.confidence,
        extracted_by: tag.extracted_by,
        ts: tag.ts
      })),

      // AI-specific data
      ai_conversations: extractData(aiConversationsResult, []).map((conv: any) => ({
        id: conv.id,
        conversation_id: conv.conversation_id,
        message_type: conv.message_type,
        content: conv.content,
        context_used: conv.context_used,
        ai_model: conv.ai_model,
        confidence_score: conv.confidence_score,
        user_feedback: conv.user_feedback,
        created_at: conv.created_at
      })),

      ai_insights: extractData(aiInsightsResult, []).map((insight: any) => ({
        id: insight.id,
        insight_type: insight.insight_type,
        title: insight.title,
        description: insight.description,
        confidence_score: insight.confidence_score,
        severity_level: insight.severity_level,
        actionable_recommendations: insight.actionable_recommendations || [],
        therapist_notified: insight.therapist_notified,
        user_acknowledged: insight.user_acknowledged,
        created_at: insight.created_at
      })),

      user_preferences: extractData(userPreferencesResult) ? {
        preferred_name: extractData(userPreferencesResult).preferred_name,
        communication_style: extractData(userPreferencesResult).communication_style,
        therapy_goals: extractData(userPreferencesResult).therapy_goals || [],
        triggers_to_avoid: extractData(userPreferencesResult).triggers_to_avoid || [],
        preferred_coping_strategies: extractData(userPreferencesResult).preferred_coping_strategies || [],
        ai_interaction_level: extractData(userPreferencesResult).ai_interaction_level,
        language_preference: extractData(userPreferencesResult).language_preference
      } : null,

      // Crisis and safety data
      crisis_interventions: extractData(crisisInterventionsResult, []).map((crisis: any) => ({
        id: crisis.id,
        trigger_source: crisis.trigger_source,
        risk_level: crisis.risk_level,
        intervention_type: crisis.intervention_type,
        ai_assessment: crisis.ai_assessment,
        outcome: crisis.outcome,
        resolved_at: crisis.resolved_at,
        created_at: crisis.created_at
      })),

      // Health metrics
      biometrics: extractData(biometricsResult, []).map((metric: any) => ({
        id: metric.id,
        metric: metric.metric,
        value: metric.value,
        source: metric.source,
        recorded_at: metric.recorded_at
      })),

      micro_wins: extractData(microWinsResult, []).map((win: any) => ({
        id: win.id,
        win_text: win.win_text,
        detected_from: win.detected_from,
        confidence_score: win.confidence_score,
        celebrated: win.celebrated,
        detected_at: win.detected_at
      })),

      // System and relationship data
      notifications: extractData(notificationsResult, []).map((notif: any) => ({
        id: notif.id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        read: notif.read,
        created_at: notif.created_at
      })),

      summary_cache: extractData(summaryResult) ? {
        summary: extractData(summaryResult).summary,
        generated_by: extractData(summaryResult).generated_by,
        refreshed_at: extractData(summaryResult).refreshed_at
      } : null,

      therapist_relationship: extractData(therapistRelationResult, []).map((rel: any) => ({
        id: rel.id,
        status: rel.status,
        start_date: rel.start_date,
        session_frequency: rel.session_frequency,
        therapist_name: rel.therapist ? `${rel.therapist.first_name} ${rel.therapist.last_name}` : null,
        notes: rel.notes
      })),

      // Metadata
      context_generated_at: new Date().toISOString(),
      data_sources: [
        'profiles', 'mood_entries', 'journal_entries', 'tasks', 'therapy_homework',
        'assessments', 'assessment_results', 'therapy_sessions', 'notes',
        'monitoring_entries', 'chat_messages', 'chat_tags', 'ai_conversations',
        'ai_insights', 'user_preferences', 'crisis_interventions', 'biometrics_hourly',
        'micro_wins', 'notifications', 'summary_cache', 'therapist_client_relations'
      ]
    }

    console.log(`Successfully fetched comprehensive context for user ${user_id}:`, {
      mood_entries: userContext.mood_entries.length,
      journal_entries: userContext.journal_entries.length,
      therapy_sessions: userContext.therapy_sessions.length,
      ai_conversations: userContext.ai_conversations.length,
      total_data_sources: userContext.data_sources.length
    })

    return new Response(
      JSON.stringify(userContext),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        } 
      }
    )

  } catch (error) {
    console.error('Error fetching comprehensive user context:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch user context',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 