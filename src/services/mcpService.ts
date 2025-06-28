/**
 * mcpService.ts
 * 
 * This service centralizes all Model-Context-Protocol (MCP) calls for the application.
 * It provides a clean, reusable interface for interacting with the Supabase backend via MCP,
 * handling tasks like database operations (SQL execution, migrations), and other MCP-specific functionalities.
 *
 * For the purpose of this demo, this file contains mock implementations that simulate
 * the behavior of real MCP calls, returning sample data without actual backend interaction.
 * This allows for frontend and feature development to proceed independently of the backend setup.
 *
 * In a production environment, the functions in this file would be replaced with actual
 * calls to the MCP server, using the appropriate MCP client library.
 */

import { MCP } from 'mcp.js'; // This is a placeholder for the actual MCP client library

// Mock data and types
type MoodEntry = {
  user_id: string;
  mood_score: number;
  trigger?: string;
};

type JournalEntry = {
  user_id: string;
  content: string;
  mood_score?: number;
};

type AISuggestion = {
    id: string;
    user_id: string;
    suggestion_type: 'coping' | 'insight';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    related_journal_entry_id?: string;
    related_mood_entry_id?: string;
};

// --- Mock MCP Service ---

// This mock simulates the MCP client, providing methods to interact with the database.
const mockMcpClient = {
  // Simulates executing a SQL query via MCP
  executeSql: async (query: string, params: any[] = []): Promise<{ data: any[] | null, error: any | null }> => {
    console.log(`[MCP MOCK] Executing SQL: ${query}`, params);
    
    // Simulate logging a mood entry
    if (query.includes('INSERT INTO mood_entries')) {
      return { data: [{ id: 'mock-mood-id-123', ...params[0] }], error: null };
    }
    
    // Simulate logging a journal entry
    if (query.includes('INSERT INTO journal_entries')) {
      return { data: [{ id: 'mock-journal-id-456', ...params[0] }], error: null };
    }

    // Simulate logging an AI suggestion
    if (query.includes('INSERT INTO ai_suggestions_log')) {
        return { data: [{ id: 'mock-suggestion-id-789', ...params[0] }], error: null };
    }

    // Simulate fetching recent journal entries for context
    if (query.includes('SELECT content, created_at FROM journal_entries')) {
        return { 
            data: [
                { content: 'Feeling a bit overwhelmed with work today.', created_at: new Date().toISOString() },
                { content: 'Had a great time with friends, feeling much better.', created_at: new Date().toISOString() }
            ], 
            error: null 
        };
    }
    
    // Default response for unknown queries
    return { data: [], error: null };
  },

  // Simulates applying a database migration via MCP
  applyMigration: async (migrationScript: string): Promise<{ success: boolean, error: any | null }> => {
    console.log(`[MCP MOCK] Applying migration:\n${migrationScript}`);
    return { success: true, error: null };
  },
};


export const mcpService = {
  /**
   * Logs a mood entry to the database using MCP.
   * @param entry - The mood entry data.
   * @returns The newly created mood entry record.
   */
  logMoodEntry: async (entry: MoodEntry): Promise<any> => {
    const query = `
      INSERT INTO mood_entries (user_id, mood_score, trigger)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const params = [entry.user_id, entry.mood_score, entry.trigger];
    
    const { data, error } = await mockMcpClient.executeSql(query, params);
    
    if (error) {
      console.error('MCP Error logging mood entry:', error);
      throw new Error('Failed to log mood entry via MCP.');
    }
    
    return data ? data[0] : null;
  },

  /**
   * Logs a journal entry to the database using MCP.
   * @param entry - The journal entry data.
   * @returns The newly created journal entry record.
   */
  logJournalEntry: async (entry: JournalEntry): Promise<any> => {
    const query = `
      INSERT INTO journal_entries (user_id, content, mood_score)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const params = [entry.user_id, entry.content, entry.mood_score];

    const { data, error } = await mockMcpClient.executeSql(query, params);

    if (error) {
      console.error('MCP Error logging journal entry:', error);
      throw new Error('Failed to log journal entry via MCP.');
    }
    
    return data ? data[0] : null;
  },

  /**
   * Logs an AI-generated suggestion to the database using MCP.
   * @param suggestion - The suggestion data.
   * @returns The newly created suggestion record.
   */
  logAiSuggestion: async (suggestion: Omit<AISuggestion, 'id'>): Promise<any> => {
      const query = `
        INSERT INTO ai_suggestions_log (user_id, suggestion_type, title, description, priority, related_journal_entry_id, related_mood_entry_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
      `;
      const params = [
          suggestion.user_id,
          suggestion.suggestion_type,
          suggestion.title,
          suggestion.description,
          suggestion.priority,
          suggestion.related_journal_entry_id,
          suggestion.related_mood_entry_id
      ];

      const { data, error } = await mockMcpClient.executeSql(query, params);

      if (error) {
          console.error('MCP Error logging AI suggestion:', error);
          throw new Error('Failed to log AI suggestion via MCP.');
      }
      return data ? data[0] : null;
  },
  
  /**
   * Fetches recent journal entries for a user to provide context to the AI.
   * @param userId - The ID of the user.
   * @param limit - The number of recent entries to fetch.
   * @returns A list of recent journal entries.
   */
  getRecentJournalEntries: async (userId: string, limit: number = 5): Promise<{ content: string, created_at: string }[]> => {
    const query = `
      SELECT content, created_at
      FROM journal_entries
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2;
    `;
    const params = [userId, limit];

    const { data, error } = await mockMcpClient.executeSql(query, params);

    if (error) {
      console.error('MCP Error fetching journal entries:', error);
      throw new Error('Failed to fetch journal entries via MCP.');
    }

    return data || [];
  },
};

// MCP Service for Enhanced AI Companion
// This service handles all database operations via MCP calls

const PROJECT_ID = 'jjflfhcdxgmpustkffqo';

export interface MCPMoodEntry {
  id: string;
  user_id: string;
  mood_score: number;
  trigger?: string;
  notes?: string;
  created_at: string;
}

export interface MCPJournalEntry {
  id: string;
  user_id: string;
  content: string;
  mood_score?: number;
  tags?: string[];
  created_at: string;
}

export interface MCPAISuggestion {
  id: string;
  user_id: string;
  suggestion_id: string;
  context: string;
  accepted?: boolean;
  feedback?: string;
  created_at: string;
}

export class MCPService {
  
  /**
   * Log a mood entry using MCP execute_sql
   */
  static async logMoodEntry(
    userId: string, 
    moodScore: number, 
    trigger?: string, 
    notes?: string
  ): Promise<MCPMoodEntry | null> {
    try {
      const triggerValue = trigger ? `'${trigger.replace(/'/g, "''")}'` : 'NULL';
      const notesValue = notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL';
      
      const query = `
        INSERT INTO public.mood_entries (user_id, mood_score, trigger, notes)
        VALUES ('${userId}', ${moodScore}, ${triggerValue}, ${notesValue})
        RETURNING id, user_id, mood_score, trigger, notes, created_at;
      `;
      
      console.log('🎭 Executing MCP mood entry query:', query);
      
      const mockResult = {
        id: `mood_${Date.now()}`,
        user_id: userId,
        mood_score: moodScore,
        trigger,
        notes,
        created_at: new Date().toISOString()
      };
      
      console.log('✅ MCP mood entry logged:', mockResult);
      return mockResult;
    } catch (error) {
      console.error('❌ Error logging mood entry via MCP:', error);
      return null;
    }
  }

  /**
   * Log a journal entry using MCP execute_sql
   */
  static async logJournalEntry(
    userId: string, 
    content: string, 
    moodScore?: number, 
    tags?: string[]
  ): Promise<MCPJournalEntry | null> {
    try {
      const tagsArray = tags && tags.length > 0 
        ? `ARRAY[${tags.map(tag => `'${tag.replace(/'/g, "''")}'`).join(',')}]` 
        : 'NULL';
      const moodValue = moodScore ? moodScore.toString() : 'NULL';
      
      const query = `
        INSERT INTO public.journal_entries (user_id, content, mood_score, tags)
        VALUES ('${userId}', '${content.replace(/'/g, "''")}', ${moodValue}, ${tagsArray})
        RETURNING id, user_id, content, mood_score, tags, created_at;
      `;
      
      console.log('📝 Executing MCP journal entry query:', query);
      
      // For now, simulate the MCP call
      const mockResult = {
        id: `journal_${Date.now()}`,
        user_id: userId,
        content,
        mood_score: moodScore,
        tags,
        created_at: new Date().toISOString()
      };
      
      console.log('✅ MCP journal entry logged:', mockResult);
      return mockResult;
    } catch (error) {
      console.error('❌ Error logging journal entry via MCP:', error);
      return null;
    }
  }

  /**
   * Log an AI suggestion using MCP execute_sql
   */
  static async logAISuggestion(
    userId: string, 
    suggestionId: string, 
    context: string, 
    accepted?: boolean, 
    feedback?: string
  ): Promise<MCPAISuggestion | null> {
    try {
      const acceptedValue = accepted !== undefined ? accepted.toString() : 'NULL';
      const feedbackValue = feedback ? `'${feedback.replace(/'/g, "''")}'` : 'NULL';
      
      const query = `
        INSERT INTO public.ai_suggestions_log (user_id, suggestion_id, context, accepted, feedback)
        VALUES ('${userId}', '${suggestionId}', '${context}', ${acceptedValue}, ${feedbackValue})
        RETURNING id, user_id, suggestion_id, context, accepted, feedback, created_at;
      `;
      
      console.log('🤖 Executing MCP AI suggestion query:', query);
      
      // For now, simulate the MCP call
      const mockResult = {
        id: `ai_suggestion_${Date.now()}`,
        user_id: userId,
        suggestion_id: suggestionId,
        context,
        accepted,
        feedback,
        created_at: new Date().toISOString()
      };
      
      console.log('✅ MCP AI suggestion logged:', mockResult);
      return mockResult;
    } catch (error) {
      console.error('❌ Error logging AI suggestion via MCP:', error);
      return null;
    }
  }

  /**
   * Get mood history using MCP execute_sql
   */
  static async getMoodHistory(userId: string, limit: number = 30): Promise<MCPMoodEntry[]> {
    try {
      const query = `
        SELECT id, user_id, mood_score, trigger, notes, created_at
        FROM public.mood_entries
        WHERE user_id = '${userId}'
        ORDER BY created_at DESC
        LIMIT ${limit};
      `;
      
      console.log('📊 Executing MCP mood history query:', query);
      
      // For now, simulate the MCP call with mock data
      const mockResults: MCPMoodEntry[] = [
        {
          id: 'mood_1',
          user_id: userId,
          mood_score: 7,
          trigger: 'work stress',
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'mood_2',
          user_id: userId,
          mood_score: 5,
          trigger: 'sleep issues',
          created_at: new Date(Date.now() - 172800000).toISOString()
        }
      ];
      
      console.log('✅ MCP mood history retrieved:', mockResults.length, 'entries');
      return mockResults;
    } catch (error) {
      console.error('❌ Error getting mood history via MCP:', error);
      return [];
    }
  }

  /**
   * Get journal history using MCP execute_sql
   */
  static async getJournalHistory(userId: string, limit: number = 10): Promise<MCPJournalEntry[]> {
    try {
      const query = `
        SELECT id, user_id, content, mood_score, tags, created_at
        FROM public.journal_entries
        WHERE user_id = '${userId}'
        ORDER BY created_at DESC
        LIMIT ${limit};
      `;
      
      console.log('📖 Executing MCP journal history query:', query);
      
      // For now, simulate the MCP call with mock data
      const mockResults: MCPJournalEntry[] = [
        {
          id: 'journal_1',
          user_id: userId,
          content: 'Had a challenging day at work today. Feeling overwhelmed with deadlines.',
          mood_score: 4,
          tags: ['work', 'stress'],
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ];
      
      console.log('✅ MCP journal history retrieved:', mockResults.length, 'entries');
      return mockResults;
    } catch (error) {
      console.error('❌ Error getting journal history via MCP:', error);
      return [];
    }
  }

  /**
   * Get AI suggestions analytics using MCP execute_sql
   */
  static async getAISuggestionsAnalytics(userId: string): Promise<{
    totalSuggestions: number;
    acceptedSuggestions: number;
    acceptanceRate: number;
    recentContexts: string[];
  }> {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_suggestions,
          COUNT(CASE WHEN accepted = true THEN 1 END) as accepted_suggestions,
          ARRAY_AGG(DISTINCT context) as contexts
        FROM public.ai_suggestions_log
        WHERE user_id = '${userId}';
      `;
      
      console.log('📈 Executing MCP AI analytics query:', query);
      
      // For now, simulate the MCP call
      const mockResults = {
        totalSuggestions: 15,
        acceptedSuggestions: 12,
        acceptanceRate: 0.8,
        recentContexts: ['mood-triggered', 'journal-informed', 'proactive-checkin']
      };
      
      console.log('✅ MCP AI analytics retrieved:', mockResults);
      return mockResults;
    } catch (error) {
      console.error('❌ Error getting AI analytics via MCP:', error);
      return {
        totalSuggestions: 0,
        acceptedSuggestions: 0,
        acceptanceRate: 0,
        recentContexts: []
      };
    }
  }

  /**
   * Execute a custom MCP query (for advanced operations)
   */
  static async executeCustomQuery(query: string): Promise<any> {
    try {
      console.log('🔧 Executing custom MCP query:', query);
      
      // For now, log the query that would be executed
      console.log('✅ Custom MCP query logged for execution');
      return { success: true, query };
    } catch (error) {
      console.error('❌ Error executing custom MCP query:', error);
      return { success: false, error };
    }
  }
}

// Export the main functions for external use
export const logMoodEntryMCP = MCPService.logMoodEntry;
export const logJournalEntryMCP = MCPService.logJournalEntry;
export const logAISuggestionMCP = MCPService.logAISuggestion;
export const getMoodHistoryMCP = MCPService.getMoodHistory;
export const getJournalHistoryMCP = MCPService.getJournalHistory;
export const getAISuggestionsAnalyticsMCP = MCPService.getAISuggestionsAnalytics;

/**
 * Convert demo user ID to UUID format for database operations
 */
export function convertToUUID(demoUserId: string): string {
  // For demo users, we'll map them to existing UUIDs in the database
  const demoUserMappings: Record<string, string> = {
    'demo-patient-1751129467386': 'a9154110-1a92-4219-b3ab-10e8d788f49f', // lucatherightside@hotmail.it
    'demo-therapist-1751129467386': 'caf247e9-b966-4382-aa3c-19b97ed8fafb', // lucadng@gmail.com
  };
  
  // If it's already a UUID, return as-is
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(demoUserId)) {
    return demoUserId;
  }
  
  // Map demo user to UUID
  const mappedUUID = demoUserMappings[demoUserId];
  if (mappedUUID) {
    return mappedUUID;
  }
  
  // For other demo users, use a default UUID
  return 'a9154110-1a92-4219-b3ab-10e8d788f49f';
} 