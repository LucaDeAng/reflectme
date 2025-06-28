import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { GeminiAIService } from '../services/geminiAIService';
import { fetchClientChatHistory, fetchTherapistChatHistory } from '../services/chatHistoryService';

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

// Removed unused initializeGemini function - now handled in GeminiAIService

// Simplified mock data for demo purposes only
const mockCopingTools: CopingTool[] = [
  {
    id: '1',
    title: '4-7-8 Breathing',
    description: 'A calming breathing technique to reduce anxiety and promote relaxation',
    category: 'breathing',
    duration: '2-3 minutes',
    steps: [
      'Sit comfortably with your back straight',
      'Inhale through your nose for 4 counts',
      'Hold your breath for 7 counts',
      'Exhale through your mouth for 8 counts'
    ],
    isRecommended: true,
    therapistApproved: true,
  },
  {
    id: '2',
    title: '5-4-3-2-1 Grounding',
    description: 'Use your senses to ground yourself in the present moment',
    category: 'grounding',
    duration: '3-5 minutes',
    steps: [
      'Notice 5 things you can see',
      'Notice 4 things you can touch',
      'Notice 3 things you can hear',
      'Notice 2 things you can smell',
      'Notice 1 thing you can taste'
    ],
    isRecommended: true,
    therapistApproved: true,
  }
];

const mockSessionRecaps: SessionRecap[] = [
  {
    id: '1',
    date: new Date().toISOString().split('T')[0],
    title: 'Demo Session',
    keyTakeaways: [
      'Explored coping strategies for daily challenges',
      'Practiced mindfulness techniques'
    ],
    therapistSuggestions: [
      'Continue daily breathing exercises',
      'Practice grounding when feeling overwhelmed'
    ],
    actionItems: [
      'Practice breathing exercises',
      'Use grounding techniques'
    ],
    moodBefore: 4,
    moodAfter: 6
  }
];

// Generate more realistic mock mood data for better insights
const generateMockMoodEntries = (): MoodEntry[] => {
  const entries: MoodEntry[] = [];
  const today = new Date();
  
  // Generate 14 days of mock data for better trend analysis
  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Create realistic mood patterns (slight variations)
    const baseMood = 6; // Average mood
    const variation = Math.random() * 3 - 1.5; // -1.5 to +1.5 variation
    const mood = Math.max(1, Math.min(10, Math.round(baseMood + variation)));
    
    entries.push({
      id: `mock_${i}`,
      date: date.toISOString().split('T')[0],
      mood: mood,
      context: 'demo',
      trigger: i % 3 === 0 ? ['work stress', 'good sleep', 'exercise', 'social time'][Math.floor(Math.random() * 4)] : undefined
    });
  }
  
  return entries;
};

const mockMoodEntries: MoodEntry[] = generateMockMoodEntries();

export const ZentiaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      content: "Hello! I'm your Zentia companion. I'm here to support you between therapy sessions. How are you feeling today?",
      timestamp: new Date().toISOString(),
    }
  ]);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>(mockMoodEntries);
  // Stato per chat storica separata
  const [clientChatHistory, setClientChatHistory] = useState<ChatMessage[]>([]);
  const [therapistChatHistory, setTherapistChatHistory] = useState<ChatMessage[]>([]);

  // Funzioni per fetch separato
  const fetchAndSetClientChatHistory = useCallback(async (clientId: string) => {
    const history = await fetchClientChatHistory(clientId);
    setClientChatHistory(history);
    return history;
  }, []);
  const fetchAndSetTherapistChatHistory = useCallback(async (clientId: string) => {
    const history = await fetchTherapistChatHistory(clientId);
    setTherapistChatHistory(history);
    return history;
  }, []);

  const generateAIResponse = useCallback(async (userMessage: string) => {
    setIsGeneratingResponse(true);
    
    try {
      // Create therapy context from session recaps and mood entries
      const therapyContext = {
        recentSessions: mockSessionRecaps.slice(0, 2),
        recentMoods: moodEntries.slice(-7),
        copingTools: mockCopingTools.filter(tool => tool.therapistApproved)
      };

      const response = await GeminiAIService.generaRispostaChat(
        userMessage,
        user?.id
      );
      console.log('Gemini response:', response);

      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: 'assistant',
        content: response.contenuto,
        timestamp: new Date().toISOString(),
        metadata: response.metadata
      };

      setChatHistory(prev => [...prev, aiMessage]);

      // If mood was detected, add it to mood entries
      if (response.metadata?.moodDetected) {
        const moodEntry: MoodEntry = {
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          mood: response.metadata.moodDetected,
          context: 'chat',
          notes: `Detected during conversation: "${userMessage.substring(0, 50)}..."`
        };
        setMoodEntries(prev => [...prev, moodEntry]);
      }

    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: 'system',
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment, or if this persists, you can always reach out to your therapist directly.",
        timestamp: new Date().toISOString(),
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsGeneratingResponse(false);
    }
  }, [moodEntries, user?.id]);

  const addMessage = useCallback((message: Omit<ChatMessage, 'id'>): ChatMessage => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
    };
    
    setChatHistory(prev => [...prev, newMessage]);

    // If it's a user message, generate AI response
    if (message.sender === 'user') {
      generateAIResponse(message.content);
    }

    return newMessage;
  }, [generateAIResponse]);

  const getRecommendedTools = useCallback((): CopingTool[] => {
    return mockCopingTools.filter(tool => tool.isRecommended);
  }, []);

  const addMoodEntry = useCallback((entry: Omit<MoodEntry, 'id'>): void => {
    const newEntry: MoodEntry = {
      ...entry,
      id: Date.now().toString(),
    };
    setMoodEntries(prev => [...prev, newEntry]);
  }, []);

  const getProgressData = useCallback(() => {
    return moodEntries
      .slice(-30) // Last 30 entries
      .map(entry => ({
        date: entry.date,
        mood: entry.mood
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [moodEntries]);

  const value: ZentiaContextType = React.useMemo(() => ({
    chatHistory,
    addMessage,
    isGeneratingResponse,
    copingTools: mockCopingTools,
    getRecommendedTools,
    sessionRecaps: mockSessionRecaps,
    moodEntries,
    addMoodEntry,
    getProgressData,
    clientChatHistory,
    therapistChatHistory,
    fetchAndSetClientChatHistory,
    fetchAndSetTherapistChatHistory,
  }), [chatHistory, addMessage, isGeneratingResponse, moodEntries, getRecommendedTools, addMoodEntry, getProgressData, clientChatHistory, therapistChatHistory, fetchAndSetClientChatHistory, fetchAndSetTherapistChatHistory]);



  return (
    <ZentiaContext.Provider value={value}>
      {children}
    </ZentiaContext.Provider>
  );
}; 