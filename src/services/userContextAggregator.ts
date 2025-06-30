import { supabase } from '@/lib/supabase';

/**
 * Comprehensive User Context Aggregator
 * Fetches ALL user data from the mental health platform for AI Companion
 * Uses Edge Function with service-role access for complete data retrieval
 */

export interface ComprehensiveUserContext {
  // Core identity
  profile: {
    id: string;
    first_name: string;
    last_name: string;
    preferred_name: string;
    role: string;
    created_at: string;
  } | null;

  // Mental health tracking
  mood_entries: Array<{
    id: string;
    mood_score: number;
    trigger?: string;
    notes?: string;
    created_at: string;
  }>;

  journal_entries: Array<{
    id: string;
    content: string;
    mood_score?: number;
    tags: string[];
    created_at: string;
  }>;

  // Task and homework management
  tasks: Array<{
    id: string;
    title: string;
    description?: string;
    task_type: string;
    priority: string;
    category?: string;
    due_at?: string;
    completion_criteria?: string;
    max_completions: number;
    is_archived: boolean;
    created_at: string;
  }>;

  therapy_homework: Array<{
    id: string;
    title: string;
    description?: string;
    homework_type: string;
    instructions?: string[];
    resources?: string[];
    due_date?: string;
    estimated_duration_minutes?: number;
    difficulty_level?: number;
    status: string;
    completion_percentage: number;
    completion_notes?: string;
    mood_before?: number;
    mood_after?: number;
    ai_generated: boolean;
    created_at: string;
  }>;

  // Assessment data
  assessments: Array<{
    id: string;
    instrument: string;
    schedule: string;
    next_due_at: string;
    created_at: string;
  }>;

  assessment_results: Array<{
    id: string;
    score: number;
    interpretation?: string;
    severity_level?: string;
    instrument?: string;
    completed_at: string;
  }>;

  // Therapy and clinical data
  therapy_sessions: Array<{
    id: string;
    session_date: string;
    session_type: string;
    duration_minutes?: number;
    notes?: string;
    goals: string[];
    homework_assigned: string[];
    techniques_used: string[];
    mood_before?: number;
    mood_after?: number;
    session_rating?: number;
    therapist_name?: string;
  }>;

  clinical_notes: Array<{
    id: string;
    content: string;
    created_at: string;
    updated_at: string;
  }>;

  // Daily monitoring and wellness
  monitoring_entries: Array<{
    id: string;
    mood_rating?: number;
    energy_level?: number;
    sleep_quality?: number;
    stress_level?: number;
    anxiety_level?: number;
    sleep_hours?: number;
    exercise_minutes?: number;
    social_interaction?: boolean;
    journal_entry?: string;
    gratitude_note?: string;
    entry_date: string;
    created_at: string;
  }>;

  // Communication and chat data
  chat_messages: Array<{
    id: string;
    content: string;
    sender: string;
    message_type: string;
    session_id?: string;
    metadata?: any;
    created_at: string;
  }>;

  chat_tags: Array<{
    id: string;
    tag: string;
    tag_category?: string;
    score: number;
    confidence: number;
    extracted_by: string;
    ts: string;
  }>;

  // AI-specific data
  ai_conversations: Array<{
    id: string;
    conversation_id: string;
    message_type: string;
    content: string;
    context_used?: any;
    ai_model: string;
    confidence_score?: number;
    user_feedback?: string;
    created_at: string;
  }>;

  ai_insights: Array<{
    id: string;
    insight_type: string;
    title: string;
    description: string;
    confidence_score: number;
    severity_level: string;
    actionable_recommendations: string[];
    therapist_notified: boolean;
    user_acknowledged: boolean;
    created_at: string;
  }>;

  user_preferences: {
    preferred_name?: string;
    communication_style: string;
    therapy_goals: string[];
    triggers_to_avoid: string[];
    preferred_coping_strategies: string[];
    ai_interaction_level: string;
    language_preference: string;
  } | null;

  // Crisis and safety data
  crisis_interventions: Array<{
    id: string;
    trigger_source: string;
    risk_level: string;
    intervention_type: string;
    ai_assessment?: string;
    outcome?: string;
    resolved_at?: string;
    created_at: string;
  }>;

  // Health metrics
  biometrics: Array<{
    id: string;
    metric: string;
    value: number;
    source: string;
    recorded_at: string;
  }>;

  micro_wins: Array<{
    id: string;
    win_text: string;
    detected_from?: string;
    confidence_score: number;
    celebrated: boolean;
    detected_at: string;
  }>;

  // System and relationship data
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    created_at: string;
  }>;

  summary_cache: {
    summary: string;
    generated_by: string;
    refreshed_at: string;
  } | null;

  therapist_relationship: Array<{
    id: string;
    status: string;
    start_date: string;
    session_frequency: string;
    therapist_name?: string;
    notes?: any;
  }>;

  // Metadata
  context_generated_at: string;
  data_sources: string[];
}

/**
 * Fetches comprehensive user context from all platform data sources
 * Uses Edge Function with service-role access for complete data retrieval
 * Includes PHI filtering and data sanitization
 */
export async function getFullUserContext(userId: string): Promise<ComprehensiveUserContext> {
  if (!userId) {
    throw new Error("User ID is required to fetch user context.");
  }

  const { data, error } = await supabase.functions.invoke('fetch-comprehensive-user-context', {
    body: { userId },
  });

  if (error) {
    console.error('Error fetching comprehensive user context:', error);
    throw new Error(`Failed to invoke Edge Function: ${error.message}`);
  }

  if (!data) {
    throw new Error('No data returned from Edge Function.');
  }

  return data as ComprehensiveUserContext;
}

/**
 * Analyzes mood entries to detect a trend (improving, declining, stable)
 * @param context The comprehensive user context
 * @returns 'improving', 'declining', or 'stable'
 */
export function getMoodTrend(context: ComprehensiveUserContext): 'improving' | 'declining' | 'stable' {
  if (context.mood_entries.length < 2) {
    return 'stable';
  }
  const sortedEntries = [...context.mood_entries].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const recentEntries = sortedEntries.slice(-7);
  if (recentEntries.length < 2) {
    return 'stable';
  }
  const first = recentEntries[0].mood_score;
  const last = recentEntries[recentEntries.length - 1].mood_score;
  if (last > first) return 'improving';
  if (last < first) return 'declining';
  return 'stable';
}

/**
 * Extracts recent triggers from mood entries
 * @param context The comprehensive user context
 * @param days The number of days to look back
 * @returns An array of unique trigger strings
 */
export function getRecentTriggers(context: ComprehensiveUserContext, days: number = 7): string[] {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - days);
    const triggers = context.mood_entries
        .filter(entry => new Date(entry.created_at) > recentDate && entry.trigger)
        .map(entry => entry.trigger as string);
    return [...new Set(triggers)];
}

/**
 * Calculates therapy progress based on homework and sessions
 * @param context The comprehensive user context
 * @returns An object with progress metrics
 */
export function getTherapyProgress(context: ComprehensiveUserContext): {
  completedHomework: number;
  totalHomework: number;
  recentSessionCount: number;
  goalProgress: string[];
} {
  const completedHomework = context.therapy_homework.filter(h => h.status === 'completed').length;
  const totalHomework = context.therapy_homework.length;
  const recentSessionCount = context.therapy_sessions.filter(s => new Date(s.session_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;
  
  // This is a simplified logic for goal progress
  const goalProgress = context.therapy_sessions.flatMap(s => s.goals);

  return { completedHomework, totalHomework, recentSessionCount, goalProgress: [...new Set(goalProgress)] };
}

/**
 * Assesses the current crisis risk level based on various data points
 * @param context The comprehensive user context
 * @returns 'low', 'medium', 'high', or 'critical'
 */
export function getCrisisRiskLevel(context: ComprehensiveUserContext): 'low' | 'medium' | 'high' | 'critical' {
    if (context.crisis_interventions.length > 0) return 'critical';
    
    const recentMoods = context.mood_entries.slice(-5).map(m => m.mood_score);
    const avgMood = recentMoods.reduce((sum, score) => sum + score, 0) / recentMoods.length;

    if (avgMood < 3) return 'high';
    if (avgMood < 5) return 'medium';

    // Check for specific keywords in journal entries (example)
    const crisisKeywords = ['hopeless', 'suicide', 'self-harm', 'can\'t go on'];
    const hasCrisisKeywords = context.journal_entries.some(j => crisisKeywords.some(k => j.content.includes(k)));
    if (hasCrisisKeywords) return 'high';

    return 'low';
}

/**
 * Gets the user's preferred name, falling back to first name
 * @param context The comprehensive user context
 * @returns The user's preferred name as a string
 */
export function getPreferredName(context: ComprehensiveUserContext): string {
    return context.profile?.preferred_name || context.profile?.first_name || 'there';
}

/**
 * Determines the user's preferred level of AI interaction
 * @param context The comprehensive user context
 * @returns The interaction level preference
 */
export function getAIInteractionLevel(context: ComprehensiveUserContext): 'minimal' | 'standard' | 'enhanced' | 'proactive' {
    return context.user_preferences?.ai_interaction_level as any || 'standard';
}

/**
 * Determines if a therapist should be notified based on context
 * @param context The comprehensive user context
 * @returns A boolean indicating if notification is needed
 */
export function shouldNotifyTherapist(context: ComprehensiveUserContext): boolean {
    const risk = getCrisisRiskLevel(context);
    return risk === 'high' || risk === 'critical';
} 