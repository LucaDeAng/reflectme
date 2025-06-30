import { supabase } from '@/lib/supabase';
import * as Sentry from "@sentry/react";

/**
 * AI Persistence Service
 * Handles all AI-related data persistence including conversations, insights, and analytics
 */

export interface AIConversationEntry {
  user_id: string;
  conversation_id: string;
  message_type: 'user' | 'assistant' | 'system';
  content: string;
  context_used?: any;
  ai_model?: string;
  response_time_ms?: number;
  tokens_used?: number;
  confidence_score?: number;
  user_feedback?: string;
  flagged_content?: boolean;
  intervention_triggered?: boolean;
  metadata?: any;
}

export interface AIInsightEntry {
  user_id: string;
  insight_type: 'mood_pattern' | 'trigger_pattern' | 'progress_trend' | 'risk_assessment' | 'recommendation';
  title: string;
  description: string;
  confidence_score: number;
  severity_level: 'low' | 'medium' | 'high' | 'critical';
  data_sources?: string[];
  actionable_recommendations?: string[];
  therapist_notified?: boolean;
  user_acknowledged?: boolean;
  valid_until?: string;
  metadata?: any;
}

export interface CrisisInterventionEntry {
  user_id: string;
  trigger_source: 'mood_entry' | 'chat_message' | 'journal_entry' | 'assessment' | 'manual';
  risk_level: 'low' | 'medium' | 'high' | 'imminent';
  intervention_type: 'automated_response' | 'therapist_notification' | 'emergency_contact' | 'crisis_hotline';
  ai_assessment?: string;
  user_response?: string;
  outcome?: string;
  follow_up_required?: boolean;
  therapist_notified_at?: string;
  resolved_at?: string;
  metadata?: any;
}

class AIPersistenceService {
  /**
   * Log AI conversation message
   */
  static async logConversation(entry: AIConversationEntry): Promise<boolean> {
    return Sentry.startSpan(
      {
        op: "ai.persistence.conversation",
        name: "Log AI Conversation",
      },
      async (span) => {
        span.setAttribute("user_id", entry.user_id);
        span.setAttribute("message_type", entry.message_type);

        try {
          const { error } = await supabase
            .from('ai_conversations')
            .insert([{
              user_id: entry.user_id,
              conversation_id: entry.conversation_id,
              message_type: entry.message_type,
              content: entry.content,
              context_used: entry.context_used || {},
              ai_model: entry.ai_model || 'gemini-pro',
              response_time_ms: entry.response_time_ms,
              confidence_score: entry.confidence_score,
              intervention_triggered: entry.intervention_triggered || false,
              metadata: entry.metadata || {}
            }]);

          if (error) {
            console.error('❌ Error logging AI conversation:', error);
            Sentry.captureException(error);
            return false;
          }

          console.log('✅ AI conversation logged successfully');
          return true;
        } catch (error) {
          console.error('❌ Exception logging AI conversation:', error);
          Sentry.captureException(error);
          return false;
        }
      }
    );
  }

  /**
   * Log AI-generated insight
   */
  static async logInsight(entry: AIInsightEntry): Promise<string | null> {
    return Sentry.startSpan(
      {
        op: "ai.persistence.insight",
        name: "Log AI Insight",
      },
      async (span) => {
        span.setAttribute("user_id", entry.user_id);
        span.setAttribute("insight_type", entry.insight_type);

        try {
          const { data, error } = await supabase
            .from('ai_insights')
            .insert([{
              user_id: entry.user_id,
              insight_type: entry.insight_type,
              title: entry.title,
              description: entry.description,
              confidence_score: entry.confidence_score,
              severity_level: entry.severity_level,
              data_sources: entry.data_sources || [],
              actionable_recommendations: entry.actionable_recommendations || [],
              therapist_notified: entry.therapist_notified || false,
              user_acknowledged: entry.user_acknowledged || false,
              metadata: entry.metadata || {}
            }])
            .select('id')
            .single();

          if (error) {
            console.error('❌ Error logging AI insight:', error);
            Sentry.captureException(error);
            return null;
          }

          console.log('✅ AI insight logged successfully:', data.id);
          return data.id;
        } catch (error) {
          console.error('❌ Exception logging AI insight:', error);
          Sentry.captureException(error);
          return null;
        }
      }
    );
  }

  /**
   * Log crisis intervention
   */
  static async logCrisisIntervention(entry: CrisisInterventionEntry): Promise<string | null> {
    return Sentry.startSpan(
      {
        op: "ai.persistence.crisis",
        name: "Log Crisis Intervention",
      },
      async (span) => {
        span.setAttribute("user_id", entry.user_id);
        span.setAttribute("risk_level", entry.risk_level);

        try {
          const { data, error } = await supabase
            .from('crisis_interventions')
            .insert([{
              user_id: entry.user_id,
              trigger_source: entry.trigger_source,
              risk_level: entry.risk_level,
              intervention_type: entry.intervention_type,
              ai_assessment: entry.ai_assessment,
              follow_up_required: entry.follow_up_required || true,
              metadata: entry.metadata || {}
            }])
            .select('id')
            .single();

          if (error) {
            console.error('❌ Error logging crisis intervention:', error);
            Sentry.captureException(error);
            return null;
          }

          console.log('✅ Crisis intervention logged successfully:', data.id);
          
          // Alert Sentry for high-risk interventions
          if (entry.risk_level === 'high' || entry.risk_level === 'imminent') {
            Sentry.captureMessage(`Crisis intervention logged: ${entry.risk_level} risk`, 'warning');
          }

          return data.id;
        } catch (error) {
          console.error('❌ Exception logging crisis intervention:', error);
          Sentry.captureException(error);
          return null;
        }
      }
    );
  }

  /**
   * Get user's recent AI conversations
   */
  static async getRecentConversations(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error fetching recent conversations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Exception fetching recent conversations:', error);
      return [];
    }
  }

  /**
   * Get user's AI insights
   */
  static async getUserInsights(
    userId: string, 
    insightType?: string, 
    limit: number = 20
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', userId);

      if (insightType) {
        query = query.eq('insight_type', insightType);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error fetching user insights:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Exception fetching user insights:', error);
      return [];
    }
  }
}

export default AIPersistenceService; 