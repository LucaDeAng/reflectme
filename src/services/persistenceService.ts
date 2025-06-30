/**
 * Centralized Persistence Service
 * Ensures ALL user data is properly saved to Supabase with error handling and logging
 */

import { supabase } from '../lib/supabase';
import { convertToUUID } from './mcpService';

export interface PersistenceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class PersistenceService {
  
  /**
   * Save journal entry with comprehensive error handling
   */
  static async saveJournalEntry(
    userId: string,
    content: string,
    moodScore?: number,
    tags: string[] = []
  ): Promise<PersistenceResult> {
    try {
      const userUUID = convertToUUID(userId);
      
      const entry = {
        user_id: userUUID,
        content: content.trim(),
        mood_score: moodScore || null,
        tags: tags || [],
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('journal_entries')
        .insert(entry)
        .select()
        .single();

      if (error) {
        console.error('❌ Journal entry save failed:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Journal entry saved:', data.id);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Journal entry save exception:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Save mood entry
   */
  static async saveMoodEntry(
    userId: string,
    moodScore: number,
    trigger?: string,
    notes?: string
  ): Promise<PersistenceResult> {
    try {
      const userUUID = convertToUUID(userId);
      
      const entry = {
        user_id: userUUID,
        mood_score: moodScore,
        trigger: trigger || null,
        notes: notes || null,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('mood_entries')
        .insert(entry)
        .select()
        .single();

      if (error) {
        console.error('❌ Mood entry save failed:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Mood entry saved:', data.id);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Mood entry save exception:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Save monitoring entry
   */
  static async saveMonitoringEntry(
    clientId: string,
    entryData: {
      mood_rating: number;
      energy_level: number;
      sleep_quality: number;
      stress_level: number;
      anxiety_level: number;
      sleep_hours: number;
      exercise_minutes: number;
      social_interaction: boolean;
      journal_entry?: string;
      gratitude_note?: string;
      task_notes?: string;
      task_remarks?: string;
      entry_date: string;
    }
  ): Promise<PersistenceResult> {
    try {
      const clientUUID = convertToUUID(clientId);
      
      const entry = {
        ...entryData,
        client_id: clientUUID,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('monitoring_entries')
        .insert(entry)
        .select()
        .single();

      if (error) {
        console.error('❌ Monitoring entry save failed:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Monitoring entry saved:', data.id);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Monitoring entry save exception:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Save therapy session note
   */
  static async saveTherapySession(
    therapistId: string,
    clientId: string,
    sessionData: {
      session_type: string;
      notes: string;
      goals?: string[];
      interventions?: string[];
      homework_assigned?: string[];
      next_session_focus?: string;
      session_rating?: number;
      session_date?: string;
    }
  ): Promise<PersistenceResult> {
    try {
      const therapistUUID = convertToUUID(therapistId);
      const clientUUID = convertToUUID(clientId);
      
      const entry = {
        ...sessionData,
        therapist_id: therapistUUID,
        client_id: clientUUID,
        session_date: sessionData.session_date || new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('therapy_sessions')
        .insert(entry)
        .select()
        .single();

      if (error) {
        console.error('❌ Therapy session save failed:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Therapy session saved:', data.id);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Therapy session save exception:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Save task completion
   */
  static async saveTaskCompletion(
    taskId: string,
    clientId: string,
    completionData: {
      pct: number;
      notes?: string;
      mood_after?: number;
      difficulty_rating?: number;
      completion_time_minutes?: number;
      completed_via?: string;
    }
  ): Promise<PersistenceResult> {
    try {
      const clientUUID = convertToUUID(clientId);
      
      const entry = {
        ...completionData,
        task_id: taskId,
        client_id: clientUUID,
        ts: new Date().toISOString(),
        completed_via: completionData.completed_via || 'manual'
      };

      const { data, error } = await supabase
        .from('homework_progress')
        .insert(entry)
        .select()
        .single();

      if (error) {
        console.error('❌ Task completion save failed:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Task completion saved:', data.id);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Task completion save exception:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Save AI conversation
   */
  static async saveAIConversation(
    userId: string,
    userMessage: string,
    aiResponse: string,
    metadata?: any
  ): Promise<PersistenceResult> {
    try {
      const userUUID = convertToUUID(userId);
      
      const entry = {
        user_id: userUUID,
        user_message: userMessage,
        ai_response: aiResponse,
        metadata: metadata || {},
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('ai_conversations')
        .insert(entry)
        .select()
        .single();

      if (error) {
        console.error('❌ AI conversation save failed:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ AI conversation saved:', data.id);
      return { success: true, data };
    } catch (error) {
      console.error('❌ AI conversation save exception:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Save assessment result
   */
  static async saveAssessmentResult(
    assessmentId: string,
    score: number,
    rawData: any,
    interpretation?: string,
    severityLevel?: string
  ): Promise<PersistenceResult> {
    try {
      const entry = {
        assessment_id: assessmentId,
        score,
        raw_json: rawData,
        interpretation: interpretation || null,
        severity_level: severityLevel || null,
        completed_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('assessment_results')
        .insert(entry)
        .select()
        .single();

      if (error) {
        console.error('❌ Assessment result save failed:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Assessment result saved:', data.id);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Assessment result save exception:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Batch save multiple entries (for bulk operations)
   */
  static async batchSave<T>(
    tableName: string,
    entries: T[]
  ): Promise<PersistenceResult<T[]>> {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .insert(entries)
        .select();

      if (error) {
        console.error(`❌ Batch save to ${tableName} failed:`, error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Batch saved ${data.length} entries to ${tableName}`);
      return { success: true, data };
    } catch (error) {
      console.error(`❌ Batch save to ${tableName} exception:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Verify data integrity - check if data was actually saved
   */
  static async verifyDataIntegrity(
    tableName: string,
    id: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('id')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error(`❌ Data integrity check failed for ${tableName}:${id}`);
        return false;
      }

      console.log(`✅ Data integrity verified for ${tableName}:${id}`);
      return true;
    } catch (error) {
      console.error(`❌ Data integrity check exception:`, error);
      return false;
    }
  }

  /**
   * Get persistence statistics
   */
  static async getPersistenceStats(userId: string): Promise<{
    journalEntries: number;
    moodEntries: number;
    monitoringEntries: number;
    aiConversations: number;
    taskCompletions: number;
  }> {
    try {
      const userUUID = convertToUUID(userId);
      
      const [journal, mood, monitoring, ai, tasks] = await Promise.all([
        supabase.from('journal_entries').select('id', { count: 'exact' }).eq('user_id', userUUID),
        supabase.from('mood_entries').select('id', { count: 'exact' }).eq('user_id', userUUID),
        supabase.from('monitoring_entries').select('id', { count: 'exact' }).eq('client_id', userUUID),
        supabase.from('ai_conversations').select('id', { count: 'exact' }).eq('user_id', userUUID),
        supabase.from('homework_progress').select('id', { count: 'exact' }).eq('client_id', userUUID)
      ]);

      return {
        journalEntries: journal.count || 0,
        moodEntries: mood.count || 0,
        monitoringEntries: monitoring.count || 0,
        aiConversations: ai.count || 0,
        taskCompletions: tasks.count || 0
      };
    } catch (error) {
      console.error('❌ Error getting persistence stats:', error);
      return {
        journalEntries: 0,
        moodEntries: 0,
        monitoringEntries: 0,
        aiConversations: 0,
        taskCompletions: 0
      };
    }
  }
}

export default PersistenceService; 