// @refresh skip
// Disable Fast Refresh for this context because its exported hooks/providers are not compatible with React Fast Refresh and caused infinite HMR invalidations.

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { GeminiAIService } from '../services/geminiAIService';
import { fetchClientChatHistory, fetchTherapistChatHistory } from '../services/chatHistoryService';
import { supabase } from '../lib/supabase';

// Types
export interface ChatMessage {
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
    responseElements?: {
      validation?: string;
      therapyReference?: string;
      microInsight?: string;
      actionSuggestion?: string;
      choice?: string;
      progressCallout?: string;
      patternNoticing?: string;
      followUp?: string;
    };
  };
}

export interface CopingTool {
  id: string;
  title: string;
  description: string;
  category: 'breathing' | 'mindfulness' | 'grounding' | 'cognitive' | 'physical';
  duration: string;
  steps: string[];
  isRecommended: boolean;
  therapistApproved: boolean;
}

export interface SessionRecap {
  id: string;
  date: string;
  title: string;
  keyTakeaways: string[];
  therapistSuggestions: string[];
  actionItems: string[];
  moodBefore?: number;
  moodAfter?: number;
}

export interface MoodEntry {
  id: string;
  date: string;
  mood: number;
  trigger?: string;
  notes?: string;
  context: 'chat' | 'manual' | 'session' | 'demo';
}

interface ZentiaContextType {
  // Chat
  chatHistory: ChatMessage[];
  addMessage: (message: Omit<ChatMessage, 'id'>) => ChatMessage;
  isGeneratingResponse: boolean;
  
  // Coping Tools
  copingTools: CopingTool[];
  getRecommendedTools: () => CopingTool[];
  
  // Session Recaps
  sessionRecaps: SessionRecap[];
  
  // Mood & Triggers
  moodEntries: MoodEntry[];
  addMoodEntry: (entry: Omit<MoodEntry, 'id'>) => void;
  
  // Progress
  getProgressData: () => { date: string; mood: number }[];
  fetchInsightsData: () => Promise<void>;
  
  // Chat storica separata
  clientChatHistory: ChatMessage[];
  therapistChatHistory: ChatMessage[];
  fetchAndSetClientChatHistory: (clientId: string) => Promise<ChatMessage[]>;
  fetchAndSetTherapistChatHistory: (clientId: string) => Promise<ChatMessage[]>;
}

const ZentiaContext = createContext<ZentiaContextType | undefined>(undefined);

export const useZentia = () => {
  const context = useContext(ZentiaContext);
  if (context === undefined) {
    throw new Error('useZentia must be used within a ZentiaProvider');
  }
  return context;
};

export const ZentiaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      content: `Hello! I'm your Zentia AI companion. I'm here to support you on your mental health journey between therapy sessions.

Here's how I can help you:
• **Chat & Support**: Share how you're feeling, and I'll provide personalized guidance
• **Mood Tracking**: I can help you track your daily mood and identify patterns
• **Coping Strategies**: Get personalized coping techniques based on your needs
• **Progress Insights**: Review your mental health journey with AI-powered analytics

To get started, try telling me:
- How you're feeling today
- What brought you to Zentia
- Any specific challenges you're facing

I remember our conversations and learn about your preferences over time. What would you like to talk about?`,
      timestamp: new Date().toISOString(),
    }
  ]);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);

  // Initialize with empty arrays for new users - no mock data
  const [copingTools, setCopingTools] = useState<CopingTool[]>([]);
  const [sessionRecaps, setSessionRecaps] = useState<SessionRecap[]>([]);
  
  // Chat histories
  const [clientChatHistory, setClientChatHistory] = useState<ChatMessage[]>([]);
  const [therapistChatHistory, setTherapistChatHistory] = useState<ChatMessage[]>([]);

  const fetchInsightsData = useCallback(async () => {
    if (!user) return;

    console.log('Fetching insights data for user:', user.id);
    
    // Fetch mood entries
    const { data: moodData, error: moodError } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (moodError) {
      console.error('Error fetching mood entries:', moodError);
    } else if (moodData) {
      const formattedMoodData = moodData.map(entry => ({
        id: entry.id,
        date: entry.created_at,
        mood: entry.mood_score,
        trigger: entry.trigger,
        notes: entry.notes,
        context: 'manual' as const,
      }));
      setMoodEntries(formattedMoodData);
    }

    // Fetch therapy sessions
    const { data: sessionData, error: sessionError } = await supabase
      .from('therapy_sessions')
      .select('*')
      .eq('client_id', user.id)
      .order('session_date', { ascending: false });

    if (sessionError) {
      console.error('Error fetching therapy sessions:', sessionError);
    } else if (sessionData) {
      const formattedSessionData = sessionData.map(session => ({
        id: session.id,
        date: session.session_date,
        title: `Session on ${new Date(session.session_date).toLocaleDateString()}`,
        keyTakeaways: session.goals || [],
        therapistSuggestions: session.techniques_used || [],
        actionItems: session.homework_assigned || [],
        moodBefore: session.mood_before,
        moodAfter: session.mood_after
      }));
      setSessionRecaps(formattedSessionData);
    }

    // Fetch coping tools (if any are stored in database)
    const { data: toolsData, error: toolsError } = await supabase
      .from('coping_tools')
      .select('*')
      .eq('user_id', user.id);

    if (toolsError) {
      console.error('Error fetching coping tools:', toolsError);
    } else if (toolsData) {
      setCopingTools(toolsData);
    }
  }, [user]);


  // Funzioni per fetch separato
  const fetchAndSetClientChatHistory = useCallback(async (clientId: string) => {
    const history = await fetchClientChatHistory(clientId);
    setClientChatHistory(history);
    setTherapistChatHistory(history);
    return history;
  }, []);
  
  const fetchAndSetTherapistChatHistory = useCallback(async (clientId: string) => {
    const history = await fetchTherapistChatHistory(clientId);
    setTherapistChatHistory(history);
    return history;
  }, []);
 // Automatically fetch data when user is authenticated
 useEffect(() => {
  if (user) {
    console.log('👤 User authenticated, fetching initial data...');
    fetchInsightsData();
  }
}, [user, fetchInsightsData]);

  const generateAIResponse = useCallback(async (userMessage: string) => {
    setIsGeneratingResponse(true);
    
    try {
      // Use the new context-aware response method
      const chatHistoryFormatted = chatHistory.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model' as const,
        parts: [{ text: msg.content }]
      }));

      const response = await GeminiAIService.generateContextAwareResponse(
        userMessage,
        chatHistoryFormatted,
        user?.id
      );

      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };

      setChatHistory(prev => [...prev, aiMessage]);
      return aiMessage;
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: 'assistant',
        content: "I'm sorry, I'm having trouble responding right now. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setChatHistory(prev => [...prev, errorMessage]);
      return errorMessage;
    } finally {
      setIsGeneratingResponse(false);
    }
  }, [chatHistory, user?.id]);

  const addMessage = (message: Omit<ChatMessage, 'id'>): ChatMessage => {
    const newMessage = { ...message, id: Date.now().toString() };
    setChatHistory(prev => [...prev, newMessage]);
    if (newMessage.sender === 'user') {
      generateAIResponse(newMessage.content);
    }
    return newMessage;
  };

  const addMoodEntry = (entry: Omit<MoodEntry, 'id'>) => {
    const newEntry = { ...entry, id: Date.now().toString() };
    setMoodEntries(prev => [...prev, newEntry]);
  };

  const getRecommendedTools = useCallback(() => {
    return copingTools.filter(tool => tool.isRecommended);
  }, [copingTools]);
  
  const getProgressData = useCallback(() => {
    return moodEntries.map(entry => ({
      date: entry.date,
      mood: entry.mood
    }));
  }, [moodEntries]);

  const value: ZentiaContextType = React.useMemo(() => ({
    chatHistory,
    addMessage,
    isGeneratingResponse,
    copingTools,
    getRecommendedTools,
    sessionRecaps,
    moodEntries,
    addMoodEntry,
    getProgressData,
    fetchInsightsData,
    clientChatHistory,
    therapistChatHistory,
    fetchAndSetClientChatHistory,
    fetchAndSetTherapistChatHistory,
  }), [chatHistory, addMessage, isGeneratingResponse, moodEntries, getRecommendedTools, addMoodEntry, getProgressData, clientChatHistory, therapistChatHistory, fetchAndSetClientChatHistory, fetchAndSetTherapistChatHistory, fetchInsightsData]);

  return (
    <ZentiaContext.Provider value={value}>
      {children}
    </ZentiaContext.Provider>
  );
}; 