import { GeminiAIService } from './geminiAIService';
import * as Sentry from "@sentry/react";
import { getFullUserContext, ComprehensiveUserContext, getMoodTrend, getRecentTriggers, getTherapyProgress, getCrisisRiskLevel, getPreferredName, getAIInteractionLevel, shouldNotifyTherapist } from './userContextAggregator';
import { logMoodEntryMCP as logMoodEntryToSupabase, convertToUUID } from './mcpService';
import AIPersistenceService, { AIConversationEntry, AIInsightEntry, CrisisInterventionEntry } from './aiPersistenceService';

// Enhanced AI Companion Types
export interface EnhancedChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    triggerDetected?: string;
    moodDetected?: number;
    copingToolSuggested?: string;
    emotionalContext?: string;
    therapistNotesUsed?: string[];
    journalEntriesReferenced?: string[];
    responseType: 'mood-triggered' | 'journal-informed' | 'therapy-history' | 'proactive-checkin' | 'general' | 'context-aware';
    confidence: number;
    suggestions?: CopingSuggestion[];
    contextUsed?: boolean;
  };
}

export interface CopingSuggestion {
  id: string;
  type: 'breathing' | 'mindfulness' | 'grounding' | 'cognitive' | 'physical' | 'journaling';
  title: string;
  description: string;
  steps: string[];
  duration: string;
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
}

export interface MoodContext {
  currentMood: number;
  moodTrend: 'improving' | 'declining' | 'stable';
  recentMoods: Array<{ date: string; mood: number; trigger?: string }>;
  triggerPatterns: string[];
}

export interface JournalContext {
  recentEntries: Array<{
    id: string;
    date: string;
    content: string;
    mood?: number;
    tags: string[];
  }>;
  emotionalThemes: string[];
  progressIndicators: string[];
}

export interface TherapyContext {
  recentSessions: Array<{
    date: string;
    notes: string;
    goals: string[];
    homework: string[];
    techniques: string[];
  }>;
  therapeuticApproaches: string[];
  currentGoals: string[];
  assignedHomework: string[];
}

// MCP Project ID - Update this with your actual project ID
const PROJECT_ID = 'jjflfhcdxgmpustkffqo';

export class EnhancedAICompanion {
  
  /**
   * 1. MOOD-TRIGGERED SUGGESTIONS
   * Analyze current mood and provide immediate support
   */
  static async handleMoodTrigger(
    mood: number, 
    trigger?: string, 
    userId?: string
  ): Promise<{
    message: EnhancedChatMessage;
    suggestions: CopingSuggestion[];
  }> {
    const { logger } = Sentry;
    
    return Sentry.startSpan(
      {
        op: "ai.mood_analysis",
        name: "Handle Mood Trigger",
      },
      async (span) => {
        span.setAttribute("mood_score", mood);
        span.setAttribute("has_trigger", !!trigger);
        span.setAttribute("has_user_id", !!userId);
        
        logger.info("Starting mood trigger analysis", {
          mood,
          trigger,
          userId: userId ? '[REDACTED]' : undefined,
          severity: mood <= 2 ? 'critical' : mood <= 4 ? 'moderate' : 'low'
        });

        try {
          console.log('🎭 Handling mood trigger:', { mood, trigger, userId });

          // Log mood entry via MCP
          if (userId) {
            await this.logMoodEntryMCP(userId, mood, trigger);
          }

          // Get mood context via MCP
          const moodContext = await this.getMoodContextMCP(userId);
          
          // Generate personalized suggestions
          const suggestions = await this.generateMoodBasedSuggestions(mood, trigger, moodContext);
          
          // Create AI response
          const aiResponse = await this.generateMoodTriggeredResponse(mood, trigger, suggestions, moodContext);
          
          const message: EnhancedChatMessage = {
            id: this.generateId(),
            sender: 'assistant',
            content: aiResponse,
            timestamp: new Date().toISOString(),
            metadata: {
              moodDetected: mood,
              triggerDetected: trigger,
              responseType: 'mood-triggered',
              confidence: 0.9,
              suggestions,
              emotionalContext: mood <= 3 ? 'crisis-support' : mood <= 5 ? 'low-mood-support' : 'general-support'
            }
          };

          // Log AI suggestion via MCP
          if (userId) {
            await this.logAISuggestionMCP(userId, message.id, 'mood-triggered');
          }

          span.setAttribute("suggestion_count", suggestions.length);
          span.setAttribute("response_length", aiResponse.length);
          span.setAttribute("success", true);
          
          logger.info("Successfully handled mood trigger", {
            mood,
            suggestionCount: suggestions.length,
            responseLength: aiResponse.length,
            emotionalContext: message.metadata?.emotionalContext
          });

          return { message, suggestions };
        } catch (error) {
          span.setAttribute("success", false);
          span.setAttribute("error", error instanceof Error ? error.message : 'Unknown error');
          
          logger.error('Error handling mood trigger', {
            mood,
            trigger,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          
          Sentry.captureException(error);
          throw new Error('Failed to process mood trigger');
        }
      }
    );
  }

  /**
   * 2. JOURNAL-INFORMED RESPONSES
   * Analyze journal entry and provide tailored feedback
   */
  static async analyzeJournalEntry(
    entryContent: string,
    userId?: string,
    moodScore?: number
  ): Promise<{
    message: EnhancedChatMessage;
    insights: string[];
    suggestions: CopingSuggestion[];
  }> {
    console.log('📝 Analyzing journal entry for user:', userId);

    // Log journal entry via MCP
    if (userId) {
      await this.logJournalEntryMCP(userId, entryContent, moodScore);
    }

    // Get journal context via MCP
    const journalContext = await this.getJournalContextMCP(userId);
    
    // Extract keywords and themes
    const extractedThemes = await this.extractThemesFromJournal(entryContent);
    
    // Generate insights based on patterns
    const insights = await this.generateJournalInsights(entryContent, journalContext, extractedThemes);
    
    // Create targeted suggestions
    const suggestions = await this.generateJournalBasedSuggestions(extractedThemes, journalContext);
    
    // Generate personalized response
    const aiResponse = await this.generateJournalInformedResponse(
      entryContent, 
      insights, 
      suggestions, 
      journalContext
    );

    const message: EnhancedChatMessage = {
      id: this.generateId(),
      sender: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString(),
      metadata: {
        responseType: 'journal-informed',
        confidence: 0.85,
        suggestions,
        journalEntriesReferenced: journalContext.recentEntries.map(e => e.id),
        emotionalContext: extractedThemes.join(', ')
      }
    };

    // Log AI suggestion via MCP
    if (userId) {
      await this.logAISuggestionMCP(userId, message.id, 'journal-informed');
    }

    return { message, insights, suggestions };
  }

  /**
   * 3. THERAPY HISTORY INTEGRATION
   * Leverage therapy history for personalized support
   */
  static async integrateTherapyHistory(
    userMessage: string,
    userId?: string
  ): Promise<{
    message: EnhancedChatMessage;
    relevantTechniques: string[];
    homeworkReminders: string[];
  }> {
    console.log('🧠 Integrating therapy history for user:', userId);

    // Get therapy context via MCP
    const therapyContext = await this.getTherapyContextMCP(userId);
    
    // Identify relevant therapeutic techniques
    const relevantTechniques = await this.identifyRelevantTechniques(userMessage, therapyContext);
    
    // Check for homework opportunities
    const homeworkReminders = await this.generateHomeworkReminders(userMessage, therapyContext);
    
    // Generate therapy-informed response
    const aiResponse = await this.generateTherapyInformedResponse(
      userMessage,
      therapyContext,
      relevantTechniques,
      homeworkReminders
    );

    const message: EnhancedChatMessage = {
      id: this.generateId(),
      sender: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString(),
      metadata: {
        responseType: 'therapy-history',
        confidence: 0.88,
        therapistNotesUsed: therapyContext.recentSessions.map((_, i) => `session_${i}`),
        emotionalContext: relevantTechniques.join(', ')
      }
    };

    // Log AI suggestion via MCP
    if (userId) {
      await this.logAISuggestionMCP(userId, message.id, 'therapy-history');
    }

    return { message, relevantTechniques, homeworkReminders };
  }

  /**
   * 4. PROACTIVE CHECK-INS
   * Generate proactive supportive messages based on patterns
   */
  static async generateProactiveCheckin(
    userId?: string
  ): Promise<{
    message: EnhancedChatMessage;
    checkinType: 'mood-pattern' | 'session-prep' | 'goal-progress' | 'general-support';
    suggestions: CopingSuggestion[];
  }> {
    console.log('🔔 Generating proactive check-in for user:', userId);

    // Analyze user patterns via MCP
    const patterns = await this.analyzeUserPatternsMCP(userId);
    
    // Determine check-in type
    const checkinType = this.determineCheckinType(patterns);
    
    // Generate appropriate suggestions
    const suggestions = await this.generateCheckinSuggestions(checkinType, patterns);
    
    // Create proactive message
    const aiResponse = await this.generateProactiveMessage(checkinType, patterns, suggestions);

    const message: EnhancedChatMessage = {
      id: this.generateId(),
      sender: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString(),
      metadata: {
        responseType: 'proactive-checkin',
        confidence: 0.82,
        suggestions,
        emotionalContext: checkinType
      }
    };

    // Log AI suggestion via MCP
    if (userId) {
      await this.logAISuggestionMCP(userId, message.id, 'proactive-checkin');
    }

    return { message, checkinType, suggestions };
  }

  /**
   * Provides context-aware responses to user messages
   */
  static async generateContextAwareResponse(
    userMessage: string,
    chatHistory: EnhancedChatMessage[],
    userId?: string
  ): Promise<{ message: EnhancedChatMessage; suggestions?: CopingSuggestion[] }> {
    const { logger } = Sentry;

    return Sentry.startSpan(
      {
        op: "ai.chat_response",
        name: "Generate Context Aware Response",
      },
      async (span) => {
        span.setAttribute("has_user_id", !!userId);
        span.setAttribute("message_length", userMessage.length);
        span.setAttribute("history_length", chatHistory.length);

        try {
          console.log('💬 Generating context-aware response for user:', userId);

          let userContext: ComprehensiveUserContext | null = null;
          if (userId) {
            span.setAttribute("context_fetching", true);
            userContext = await getFullUserContext(userId);
            span.setAttribute("context_fetching", false);
            span.setAttribute("context_fetched", !!userContext);
          }

          if (this.detectCrisisKeywords(userMessage)) {
            await this.handleCrisisIntervention(userId, userMessage, userContext);
          }

          // Call Gemini AI service
          const aiResponseText = await GeminiAIService.generateContextAwareResponse(
            userMessage,
            chatHistory,
            userId
          );

          const message: EnhancedChatMessage = {
            id: this.generateId(),
            sender: 'assistant',
            content: aiResponseText,
            timestamp: new Date().toISOString(),
            metadata: {
              responseType: 'context-aware',
              confidence: 0.8,
              contextUsed: !!userContext
            }
          };

          if (userId && userContext && this.shouldGenerateInsight(userContext, userMessage, aiResponseText)) {
            await this.generateAndLogInsight(userId, userContext, userMessage, aiResponseText);
          }

          if (userId && userContext && shouldNotifyTherapist(userContext)) {
             await this.notifyTherapist(userId, userContext, userMessage, aiResponseText);
          }

          span.setAttribute("response_length", aiResponseText.length);
          span.setAttribute("success", true);
          logger.info("Successfully generated context-aware response", {
             responseLength: aiResponseText.length
          });

          return { message };
        } catch (error) {
           span.setAttribute("success", false);
           span.setAttribute("error", error instanceof Error ? error.message : 'Unknown error');
           
           logger.error('Error generating context aware response', {
             error: error instanceof Error ? error.message : 'Unknown error'
           });

           Sentry.captureException(error);
           throw new Error('Failed to generate context-aware response');
        }
      }
    );
  }

  // ===== MCP DATABASE OPERATIONS =====

  /**
   * Log mood entry using MCP
   */
  private static async logMoodEntryMCP(userId: string, moodScore: number, trigger?: string, notes?: string) {
    try {
      console.log('Logging mood entry via MCP:', { userId, moodScore, trigger });
      
      // Convert demo user ID to UUID format
      const userUUID = convertToUUID(userId);
      console.log('Converted user ID to UUID:', { original: userId, uuid: userUUID });
      
      // Use the MCP service to log the mood entry
      const result = await logMoodEntryToSupabase(userUUID, moodScore, trigger, notes);
      
      console.log('✅ Mood entry logged successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error logging mood entry via MCP:', error);
      throw error;
    }
  }

  /**
   * Execute SQL via MCP Supabase service
   */
  private static async executeMCPSQL(projectId: string, query: string) {
    // This function will be implemented to call the MCP service
    // For now, we'll simulate the call and log the query
    console.log('🔧 MCP SQL Query:', query);
    
    // In a real implementation, this would call the MCP Supabase service
    // Return a mock result for now
    return {
      id: `mood_${Date.now()}`,
      created_at: new Date().toISOString()
    };
  }

  /**
   * Log journal entry using MCP
   */
  private static async logJournalEntryMCP(userId: string, content: string, moodScore?: number, tags?: string[]) {
    try {
      const tagsArray = tags ? `ARRAY[${tags.map(tag => `'${tag.replace(/'/g, "''")}'`).join(',')}]` : 'NULL';
      const insertQuery = `
        INSERT INTO public.journal_entries (user_id, content, mood_score, tags)
        VALUES ('${userId}', '${content.replace(/'/g, "''")}', ${moodScore || 'NULL'}, ${tagsArray})
        RETURNING id;
      `;
      
      console.log('Logging journal entry via MCP:', { userId, contentLength: content.length });
      // await mcp_supabase_execute_sql(PROJECT_ID, insertQuery);
    } catch (error) {
      console.error('Error logging journal entry via MCP:', error);
    }
  }

  /**
   * Log AI suggestion using MCP
   */
  private static async logAISuggestionMCP(userId: string, suggestionId: string, context: string, accepted?: boolean, feedback?: string) {
    try {
      const insertQuery = `
        INSERT INTO public.ai_suggestions_log (user_id, suggestion_id, context, accepted, feedback)
        VALUES ('${userId}', '${suggestionId}', '${context}', ${accepted || 'NULL'}, ${feedback ? `'${feedback.replace(/'/g, "''")}'` : 'NULL'})
        RETURNING id;
      `;
      
      console.log('Logging AI suggestion via MCP:', { userId, suggestionId, context });
      // await mcp_supabase_execute_sql(PROJECT_ID, insertQuery);
    } catch (error) {
      console.error('Error logging AI suggestion via MCP:', error);
    }
  }

  /**
   * Get mood context using MCP
   */
  private static async getMoodContextMCP(userId?: string): Promise<MoodContext> {
    if (!userId) {
      return this.getDefaultMoodContext();
    }

    try {
      const query = `
        SELECT mood_score, trigger, created_at
        FROM public.mood_entries
        WHERE user_id = '${userId}'
        ORDER BY created_at DESC
        LIMIT 30;
      `;
      
      console.log('Getting mood context via MCP for user:', userId);
      // const result = await mcp_supabase_execute_sql(PROJECT_ID, query);
      
      // For now, return default context
      // TODO: Process MCP result
      return this.getDefaultMoodContext();
    } catch (error) {
      console.error('Error getting mood context via MCP:', error);
      return this.getDefaultMoodContext();
    }
  }

  /**
   * Get journal context using MCP
   */
  private static async getJournalContextMCP(userId?: string): Promise<JournalContext> {
    if (!userId) {
      return this.getDefaultJournalContext();
    }

    try {
      const query = `
        SELECT id, content, mood_score, tags, created_at
        FROM public.journal_entries
        WHERE user_id = '${userId}'
        ORDER BY created_at DESC
        LIMIT 10;
      `;
      
      console.log('Getting journal context via MCP for user:', userId);
      // const result = await mcp_supabase_execute_sql(PROJECT_ID, query);
      
      // For now, return default context
      // TODO: Process MCP result
      return this.getDefaultJournalContext();
    } catch (error) {
      console.error('Error getting journal context via MCP:', error);
      return this.getDefaultJournalContext();
    }
  }

  /**
   * Get therapy context using MCP
   */
  private static async getTherapyContextMCP(userId?: string): Promise<TherapyContext> {
    if (!userId) {
      return this.getDefaultTherapyContext();
    }

    try {
      // Query therapist notes and tasks from existing tables
      const notesQuery = `
        SELECT content, created_at
        FROM public.notes
        WHERE user_id = '${userId}'
        ORDER BY created_at DESC
        LIMIT 5;
      `;
      
      const tasksQuery = `
        SELECT title, description, category, completion_criteria
        FROM public.tasks
        WHERE client_id = '${userId}' AND is_archived = false
        ORDER BY created_at DESC
        LIMIT 10;
      `;
      
      console.log('Getting therapy context via MCP for user:', userId);
      // const notesResult = await mcp_supabase_execute_sql(PROJECT_ID, notesQuery);
      // const tasksResult = await mcp_supabase_execute_sql(PROJECT_ID, tasksQuery);
      
      // For now, return default context
      // TODO: Process MCP results
      return this.getDefaultTherapyContext();
    } catch (error) {
      console.error('Error getting therapy context via MCP:', error);
      return this.getDefaultTherapyContext();
    }
  }

  /**
   * Analyze user patterns using MCP
   */
  private static async analyzeUserPatternsMCP(userId?: string): Promise<any> {
    if (!userId) {
      return {
        recentMoodTrend: 'stable',
        lastJournalEntry: null,
        upcomingSessions: [],
        pendingHomework: []
      };
    }

    try {
      // Get recent mood trends
      const moodQuery = `
        SELECT mood_score, created_at
        FROM public.mood_entries
        WHERE user_id = '${userId}'
        ORDER BY created_at DESC
        LIMIT 7;
      `;
      
      // Get monitoring entries
      const monitoringQuery = `
        SELECT mood_rating, energy_level, stress_level, anxiety_level, entry_date
        FROM public.monitoring_entries
        WHERE client_id = '${userId}'
        ORDER BY entry_date DESC
        LIMIT 7;
      `;
      
      console.log('Analyzing user patterns via MCP for user:', userId);
      // const moodResult = await mcp_supabase_execute_sql(PROJECT_ID, moodQuery);
      // const monitoringResult = await mcp_supabase_execute_sql(PROJECT_ID, monitoringQuery);
      
      // For now, return basic patterns
      // TODO: Process MCP results
      return {
        recentMoodTrend: 'stable',
        lastJournalEntry: null,
        upcomingSessions: [],
        pendingHomework: []
      };
    } catch (error) {
      console.error('Error analyzing user patterns via MCP:', error);
      return {
        recentMoodTrend: 'stable',
        lastJournalEntry: null,
        upcomingSessions: [],
        pendingHomework: []
      };
    }
  }

  // ===== EXISTING HELPER METHODS (UNCHANGED) =====

  private static async generateMoodBasedSuggestions(
    mood: number,
    trigger?: string,
    context?: MoodContext
  ): Promise<CopingSuggestion[]> {
    const suggestions: CopingSuggestion[] = [];

    // Crisis support for very low moods
    if (mood <= 3) {
      suggestions.push({
        id: this.generateId(),
        type: 'breathing',
        title: 'Emergency Breathing Exercise',
        description: 'A quick technique to help stabilize overwhelming emotions',
        steps: [
          'Breathe in slowly for 4 counts',
          'Hold your breath for 7 counts',
          'Exhale slowly for 8 counts',
          'Repeat 4 times'
        ],
        duration: '2-3 minutes',
        priority: 'high',
        reasoning: 'Immediate grounding technique for crisis moments'
      });

      suggestions.push({
        id: this.generateId(),
        type: 'grounding',
        title: '5-4-3-2-1 Grounding',
        description: 'Use your senses to anchor yourself in the present moment',
        steps: [
          'Name 5 things you can see',
          'Name 4 things you can touch',
          'Name 3 things you can hear',
          'Name 2 things you can smell',
          'Name 1 thing you can taste'
        ],
        duration: '3-5 minutes',
        priority: 'high',
        reasoning: 'Helps interrupt overwhelming emotional states'
      });
    }

    // Low mood support
    if (mood <= 5) {
      suggestions.push({
        id: this.generateId(),
        type: 'mindfulness',
        title: 'Brief Mindfulness Check-in',
        description: 'A gentle way to acknowledge your feelings without judgment',
        steps: [
          'Take three deep breaths',
          'Notice what you\'re feeling right now',
          'Remind yourself: "This feeling will pass"',
          'Set one small, achievable intention for today'
        ],
        duration: '5 minutes',
        priority: 'medium',
        reasoning: 'Provides emotional validation and forward momentum'
      });
    }

    // Trigger-specific suggestions
    if (trigger) {
      const triggerLower = trigger.toLowerCase();
      
      if (triggerLower.includes('work') || triggerLower.includes('stress')) {
        suggestions.push({
          id: this.generateId(),
          type: 'cognitive',
          title: 'Work Stress Reset',
          description: 'Reframe work challenges with perspective',
          steps: [
            'Write down the specific stressor',
            'Ask: "What can I control about this situation?"',
            'List 2 actions you can take today',
            'Set a boundary: when will you stop thinking about work today?'
          ],
          duration: '10 minutes',
          priority: 'medium',
          reasoning: 'Addresses work-related triggers with practical coping'
        });
      }

      if (triggerLower.includes('relationship') || triggerLower.includes('family')) {
        suggestions.push({
          id: this.generateId(),
          type: 'journaling',
          title: 'Relationship Reflection',
          description: 'Process relationship challenges with clarity',
          steps: [
            'Write about the situation without censoring',
            'Identify your emotions and needs',
            'Consider the other person\'s perspective',
            'Write one thing you\'re grateful for about this relationship'
          ],
          duration: '15 minutes',
          priority: 'medium',
          reasoning: 'Helps process interpersonal difficulties constructively'
        });
      }
    }

    return suggestions;
  }

  private static async generateMoodTriggeredResponse(
    mood: number,
    trigger?: string,
    suggestions: CopingSuggestion[],
    context?: MoodContext
  ): Promise<string> {
    let response = '';

    // Crisis response
    if (mood <= 3) {
      response = `I notice you're going through a really difficult time right now with a mood of ${mood}/10. Your feelings are completely valid, and I want you to know that you're not alone. `;
      
      if (trigger) {
        response += `It sounds like ${trigger} is particularly challenging right now. `;
      }
      
      response += `I'm here to support you with some immediate coping strategies that can help stabilize these overwhelming feelings. `;
      
      if (suggestions.length > 0) {
        response += `I've suggested some grounding techniques that many people find helpful in moments like this. Would you like to try the ${suggestions[0].title} together?`;
      }
    }
    // Low mood response
    else if (mood <= 5) {
      response = `I can see you're having a tough day with a mood of ${mood}/10. `;
      
      if (trigger) {
        response += `${trigger} seems to be affecting you right now. `;
      }
      
      response += `It's okay to have difficult days - they're part of the human experience. I'm here to help you navigate through this. `;
      
      if (suggestions.length > 0) {
        response += `I've prepared some gentle techniques that might help lift your spirits. The ${suggestions[0].title} could be a good starting point. `;
      }
      
      response += `Remember, you've gotten through difficult days before, and you have the strength to get through this one too.`;
    }
    // General support
    else {
      response = `Thanks for sharing your mood of ${mood}/10 with me. `;
      
      if (trigger) {
        response += `I understand that ${trigger} is on your mind. `;
      }
      
      response += `It's great that you're staying aware of your emotional state. `;
      
      if (suggestions.length > 0) {
        response += `I have some suggestions that might be helpful for maintaining your wellbeing. `;
      }
      
      response += `Keep up the good work with tracking your mood - it shows real commitment to your mental health journey.`;
    }

    return response;
  }

  private static generateId(): string {
    return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get default mood context when no data is available
   */
  private static getDefaultMoodContext(): MoodContext {
    return {
      currentMood: 5,
      moodTrend: 'stable',
      recentMoods: [],
      triggerPatterns: []
    };
  }

  /**
   * Get default journal context when no data is available
   */
  private static getDefaultJournalContext(): JournalContext {
    return {
      recentEntries: [],
      emotionalThemes: [],
      progressIndicators: []
    };
  }

  /**
   * Get default therapy context when no data is available
   */
  private static getDefaultTherapyContext(): TherapyContext {
    return {
      recentSessions: [],
      therapeuticApproaches: [],
      currentGoals: [],
      assignedHomework: []
    };
  }

  // ===== COMPREHENSIVE AI HELPER METHODS =====

  /**
   * Detect crisis keywords in user messages
   */
  private static detectCrisisKeywords(text: string): boolean {
    const crisisKeywords = [
      'suicide', 'suicidal', 'kill myself', 'end my life', 'want to die',
      'self harm', 'hurt myself', 'cut myself', 'overdose',
      'hopeless', 'worthless', 'better off dead', 'no point',
      'can\'t go on', 'give up', 'end it all'
    ];
    
    const lowerText = text.toLowerCase();
    return crisisKeywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Determine if an insight should be generated based on user context and conversation
   */
  private static shouldGenerateInsight(
    userContext: ComprehensiveUserContext,
    userMessage: string,
    aiResponse: string
  ): boolean {
    // Generate insights for:
    // 1. Mood pattern changes
    if (userContext.mood_entries && userContext.mood_entries.length >= 5) {
      const recentMoods = userContext.mood_entries.slice(0, 5).map(m => m.mood_score);
      const avgRecent = recentMoods.reduce((a, b) => a + b, 0) / recentMoods.length;
      const olderMoods = userContext.mood_entries.slice(5, 10).map(m => m.mood_score);
      if (olderMoods.length > 0) {
        const avgOlder = olderMoods.reduce((a, b) => a + b, 0) / olderMoods.length;
        if (Math.abs(avgRecent - avgOlder) > 2) return true; // Significant mood change
      }
    }

    // 2. Trigger pattern recognition
    const triggerWords = ['stress', 'anxiety', 'work', 'family', 'relationship'];
    const messageLower = userMessage.toLowerCase();
    if (triggerWords.some(trigger => messageLower.includes(trigger))) {
      return true;
    }

    // 3. Progress milestones
    if (userContext.therapy_sessions && userContext.therapy_sessions.length > 0) {
      const lastSession = userContext.therapy_sessions[0];
      const daysSinceSession = (Date.now() - new Date(lastSession.session_date).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceSession > 7) return true; // Been a week since last session
    }

    return false;
  }

  /**
   * Generate and log AI insight based on user patterns
   */
  private static async generateAndLogInsight(
    userId: string,
    userContext: ComprehensiveUserContext,
    userMessage: string,
    aiResponse: string
  ): Promise<void> {
    try {
      const moodTrend = getMoodTrend(userContext);
      const recentTriggers = getRecentTriggers(userContext);
      const riskLevel = getCrisisRiskLevel(userContext);

      let insightType: 'mood_pattern' | 'trigger_pattern' | 'progress_trend' | 'risk_assessment' | 'recommendation' = 'recommendation';
      let title = '';
      let description = '';
      let severityLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      let recommendations: string[] = [];

      // Mood pattern insights
      if (userContext.mood_entries && userContext.mood_entries.length >= 5) {
        insightType = 'mood_pattern';
        title = `Mood Trend Analysis: ${moodTrend}`;
        description = `Based on your recent mood entries, I've noticed your mood has been ${moodTrend}. `;
        
        if (moodTrend === 'declining') {
          severityLevel = riskLevel === 'high' ? 'high' : 'medium';
          description += 'This suggests you might benefit from additional support or coping strategies.';
          recommendations = [
            'Consider scheduling a check-in with your therapist',
            'Practice daily mindfulness exercises',
            'Maintain regular sleep schedule',
            'Engage in physical activity'
          ];
        } else if (moodTrend === 'improving') {
          severityLevel = 'low';
          description += 'This is a positive sign that your coping strategies are working well.';
          recommendations = [
            'Continue with current coping strategies',
            'Reflect on what has been helping',
            'Consider sharing this progress with your therapist'
          ];
        }
      }

      // Trigger pattern insights
      if (recentTriggers.length > 0) {
        insightType = 'trigger_pattern';
        title = `Trigger Pattern Identified: ${recentTriggers[0]}`;
        description = `I've noticed that "${recentTriggers[0]}" appears frequently in your recent entries. Understanding this pattern can help you prepare better coping strategies.`;
        severityLevel = 'medium';
        recommendations = [
          `Develop specific coping strategies for ${recentTriggers[0]}`,
          'Practice grounding techniques when triggered',
          'Discuss this pattern with your therapist',
          'Consider trigger avoidance strategies when possible'
        ];
      }

      // Risk assessment insights
      if (riskLevel === 'high' || riskLevel === 'medium') {
        insightType = 'risk_assessment';
        title = `Wellness Check: ${riskLevel} Support Needed`;
        description = `Based on your recent activity and mood patterns, it appears you might benefit from additional support. Your wellbeing is important.`;
        severityLevel = riskLevel === 'high' ? 'critical' : 'high';
        recommendations = [
          'Reach out to your support network',
          'Consider contacting your therapist',
          'Use crisis resources if needed',
          'Practice immediate self-care activities'
        ];
      }

      // Log the insight
      await AIPersistenceService.logInsight({
        user_id: userId,
        insight_type: insightType,
        title,
        description,
        confidence_score: 0.8,
        severity_level: severityLevel,
        data_sources: ['mood_entries', 'journal_entries', 'chat_messages'],
        actionable_recommendations: recommendations,
        therapist_notified: severityLevel === 'critical',
        metadata: {
          generated_from_conversation: true,
          user_message_trigger: userMessage.substring(0, 100),
          mood_trend: moodTrend,
          recent_triggers: recentTriggers
        }
      });

      console.log('✅ AI insight generated and logged:', { insightType, title, severityLevel });
    } catch (error) {
      console.error('❌ Error generating AI insight:', error);
    }
  }

  /**
   * Handle crisis intervention when triggered
   */
  private static async handleCrisisIntervention(
    userId: string,
    userMessage: string,
    userContext: ComprehensiveUserContext | null
  ): Promise<void> {
    try {
      const riskLevel = userContext ? getCrisisRiskLevel(userContext) : 'medium';
      
      // Determine intervention type based on risk level
      let interventionType: 'automated_response' | 'therapist_notification' | 'emergency_contact' | 'crisis_hotline' = 'automated_response';
      
      if (riskLevel === 'high' || this.detectCrisisKeywords(userMessage)) {
        interventionType = 'therapist_notification';
      }

      // Log crisis intervention
      await AIPersistenceService.logCrisisIntervention({
        user_id: userId,
        trigger_source: 'chat_message',
        risk_level: riskLevel as 'low' | 'medium' | 'high' | 'imminent',
        intervention_type: interventionType,
        ai_assessment: `Crisis keywords detected in user message. Risk level assessed as ${riskLevel}. Immediate support recommended.`,
        follow_up_required: true,
        metadata: {
          triggering_message: userMessage.substring(0, 200),
          detection_method: 'keyword_analysis',
          user_context_available: !!userContext
        }
      });

      // Notify therapist if high risk
      if (interventionType === 'therapist_notification' && userContext?.therapy_sessions?.[0]) {
        await this.notifyTherapist(userId, userContext, userMessage, 'Crisis intervention triggered');
      }

      console.log('🚨 Crisis intervention logged:', { userId, riskLevel, interventionType });
    } catch (error) {
      console.error('❌ Error handling crisis intervention:', error);
    }
  }

  /**
   * Notify therapist when significant events occur
   */
  private static async notifyTherapist(
    userId: string,
    userContext: ComprehensiveUserContext | null,
    userMessage: string,
    aiResponse: string
  ): Promise<void> {
    try {
      // This would integrate with your notification system
      // For now, we'll log the notification intent
      console.log('📧 Therapist notification triggered:', {
        userId,
        reason: 'Significant user activity detected',
        userMessage: userMessage.substring(0, 100),
        timestamp: new Date().toISOString()
      });

      // In a real implementation, this would:
      // 1. Send email/SMS to therapist
      // 2. Create a task in therapist dashboard
      // 3. Log the notification in the system
      
    } catch (error) {
      console.error('❌ Error notifying therapist:', error);
    }
  }
} 