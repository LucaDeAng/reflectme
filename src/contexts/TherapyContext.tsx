// @refresh skip
import React, { createContext, useContext, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

// Types
export interface Client {
  id: string;
  name: string;
  email: string;
  avatar: string;
  age: number;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  therapistEmail: string;
  lastSessionDate: string;
  nextSessionDate: string;
  mood: number; // Changed from 'good' | 'neutral' | 'bad' to number (1-5 scale)
  moodHistory: { date: string; value: number }[];
  notes: TherapyNote[];
  triggers: string[];
  copingStrategies: CopingStrategy[];
  medicalHistory: string;
  familyHistory: string;
  developmentalHistory: string;
  safetyNotes: string;
}

export interface TherapyNote {
  id: string;
  date: string;
  title: string;
  content: string;
  tags: string[];
}

export interface CopingStrategy {
  id: string;
  title: string;
  description: string;
  steps: string[];
  tags: string[];
  effectiveness: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  mood: number;
  content: string;
  tags: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'system';
  content: string;
  timestamp: string;
  tags?: string[];
}

interface TherapyContextType {
  clients: Client[];
  journalEntries: JournalEntry[];
  chatHistory: ChatMessage[];
  addClient: (client: Omit<Client, 'id'>) => void;
  addNote: (clientId: string, note: Omit<TherapyNote, 'id'>) => void;
  addCopingStrategy: (clientId: string, strategy: Omit<CopingStrategy, 'id'>) => void;
  addJournalEntry: (entry: Omit<JournalEntry, 'id'>) => void;
  addChatMessage: (message: Omit<ChatMessage, 'id'>) => ChatMessage;
  getClient: (clientId: string) => Client | undefined;
}

const TherapyContext = createContext<TherapyContextType>({
  clients: [],
  journalEntries: [],
  chatHistory: [],
  addClient: () => {},
  addNote: () => {},
  addCopingStrategy: () => {},
  addJournalEntry: () => {},
  addChatMessage: () => ({ id: '', sender: 'user', content: '', timestamp: '' }),
  getClient: () => undefined,
});

export const useTherapy = () => {
  return useContext(TherapyContext);
};

// Generate 30 days of mock mood data
const generateMoodHistory = () => {
  const moodHistory = [];
  const today = new Date();
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    
    moodHistory.push({
      date: format(date, 'yyyy-MM-dd'),
      value: Math.floor(Math.random() * 5) + 1, // Random value between 1-5
    });
  }
  
  return moodHistory;
};

// Generate random session dates
const generateSessionDates = () => {
  const today = new Date();
  const lastSession = new Date();
  lastSession.setDate(today.getDate() - Math.floor(Math.random() * 7) - 1); // 1-7 days ago
  
  const nextSession = new Date();
  nextSession.setDate(today.getDate() + Math.floor(Math.random() * 7) + 1); // 1-7 days from now
  
  return {
    last: format(lastSession, 'yyyy-MM-dd'),
    next: format(nextSession, 'yyyy-MM-dd')
  };
};

// Minimal demo data - only for demo accounts
const getDemoClients = (therapistEmail: string): Client[] => {
  // Only return demo clients for the demo therapist account
  if (therapistEmail !== 'demo.therapist@zentia.app') {
    return [];
  }

  return [
    {
      id: 'demo-client-1',
      name: 'Demo Client',
      email: 'demo.client@zentia.app',
      avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=demo-client',
    age: 28,
    gender: 'female',
      therapistEmail: 'demo.therapist@zentia.app',
      lastSessionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      nextSessionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    mood: 3,
    moodHistory: generateMoodHistory(),
      medicalHistory: 'No significant medical concerns. Part of demo account for platform exploration.',
      familyHistory: 'Demo family history for testing purposes.',
      developmentalHistory: 'Demo developmental history.',
      safetyNotes: 'Demo safety notes. In real use, this would contain important safety information.',
    notes: [
      {
          id: 'demo-note-1',
          date: new Date().toISOString().split('T')[0],
          title: 'Demo Session Note',
          content: 'This is a sample therapy note to demonstrate the note-taking functionality. In a real session, this would contain detailed session notes and treatment progress.',
          tags: ['demo', 'sample'],
        },
      ],
      triggers: ['Demo trigger 1', 'Demo trigger 2'],
    copingStrategies: [
      {
          id: 'demo-strategy-1',
          title: 'Demo Breathing Exercise',
          description: 'A sample coping strategy for demonstration purposes.',
        steps: [
            'This is a demo coping strategy',
            'In real use, this would contain actual therapeutic techniques',
            'Multiple steps would be listed here',
          ],
          tags: ['demo', 'breathing'],
        effectiveness: 4,
      },
    ],
  },
  ];
};

// Generate minimal demo journal entries - only for demo accounts
const generateDemoJournalEntries = (): JournalEntry[] => {
  // Return empty array for now - demo users can create their own journal entries
  // This provides a clean slate for exploring the journaling functionality
  return [];
};

// Mock journal entries
const mockJournalEntries: JournalEntry[] = generateDemoJournalEntries();

// Generate minimal demo chat history - only for demo accounts
const generateDemoChatHistory = (): ChatMessage[] => {
  // Return empty array for now - demo users can start fresh conversations
  // This provides a clean slate for exploring the chat functionality
  return [];
};

// Mock chat history
const mockChatHistory: ChatMessage[] = generateDemoChatHistory();

export const TherapyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(mockJournalEntries);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(mockChatHistory);

  // Fetch real patients from Supabase or provide demo data
  useEffect(() => {
    const fetchClients = async () => {
      if (!user || user.role !== 'therapist') {
        setClients([]);
        return;
      }

      // If it's a demo therapist, provide demo clients
      if (user.isDemo) {
        console.log('🎭 Loading demo clients for therapist');
        const demoClients: Client[] = getDemoClients(user.email);
        
        setClients(demoClients);
        return;
      }

      // For real therapists, load from database
      const { data, error } = await supabase.from('patients').select('*');
      if (error) {
        console.error('Error fetching patients from Supabase:', error);
        setClients([]);
        return;
      }
      
      const mappedClients: Client[] = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        avatar: p.avatar || `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(p.name || p.email)}`,
        age: p.age || 0,
        gender: p.gender || 'other',
        therapistEmail: p.therapist_email || user.email,
        lastSessionDate: p.last_session_date || format(new Date(), 'yyyy-MM-dd'),
        nextSessionDate: p.next_session_date || format(new Date(), 'yyyy-MM-dd'),
        mood: 3,
        moodHistory: [],
        notes: [],
        triggers: [],
        copingStrategies: [],
        medicalHistory: '',
        familyHistory: '',
        developmentalHistory: '',
        safetyNotes: '',
      }));
      setClients(mappedClients);
    };
    fetchClients();
  }, [user]);

  const addClient = (client: Omit<Client, 'id'>) => {
    const newClient = {
      ...client,
      id: Math.random().toString(36).substring(2, 11),
    };
    setClients([...clients, newClient as Client]);
  };

  const addNote = (clientId: string, note: Omit<TherapyNote, 'id'>) => {
    setClients(clients.map(client => {
      if (client.id === clientId) {
        return {
          ...client,
          notes: [
            ...client.notes,
            { ...note, id: Math.random().toString(36).substring(2, 11) }
          ]
        };
      }
      return client;
    }));
  };

  const addCopingStrategy = (clientId: string, strategy: Omit<CopingStrategy, 'id'>) => {
    setClients(clients.map(client => {
      if (client.id === clientId) {
        return {
          ...client,
          copingStrategies: [
            ...client.copingStrategies,
            { ...strategy, id: Math.random().toString(36).substring(2, 11) }
          ]
        };
      }
      return client;
    }));
  };

  const addJournalEntry = (entry: Omit<JournalEntry, 'id'>) => {
    const newEntry = {
      ...entry,
      id: Math.random().toString(36).substring(2, 11),
    };
    setJournalEntries([newEntry as JournalEntry, ...journalEntries]);
  };

  const addChatMessage = (message: Omit<ChatMessage, 'id'>) => {
    const newMessage = {
      ...message,
      id: Math.random().toString(36).substring(2, 11),
    };
    setChatHistory([...chatHistory, newMessage as ChatMessage]);
    
    // If it's a user message, generate a bot response based on therapy context
    if (message.sender === 'user') {
      // Detect crisis keywords
      const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'want to die'];
      const isCrisis = crisisKeywords.some(keyword => 
        message.content.toLowerCase().includes(keyword)
      );
      
      if (isCrisis) {
        const crisisResponse: Omit<ChatMessage, 'id'> = {
          sender: 'bot',
          content: "I'm concerned about what you're saying. This sounds serious, and I want to make sure you get the help you need right away. Please call the National Suicide Prevention Lifeline at 988 or text HOME to 741741 to reach the Crisis Text Line. Both are available 24/7. Would you like me to connect you with your therapist immediately?",
          timestamp: new Date().toISOString(),
          tags: ['crisis', 'urgent', 'escalation'],
        };
        
        const newCrisisMessage = {
          ...crisisResponse,
          id: Math.random().toString(36).substring(2, 11),
        };
        
        setChatHistory(prev => [...prev, newCrisisMessage as ChatMessage]);
        return newCrisisMessage as ChatMessage;
      }
      
      // Generate contextual response based on therapy notes and patterns
      const lowercaseMessage = message.content.toLowerCase();
      let botResponse: Omit<ChatMessage, 'id'>;
      
      // Perfectionism and self-criticism responses
      if (lowercaseMessage.includes('mess up') || lowercaseMessage.includes('stupid') || lowercaseMessage.includes('failure')) {
        botResponse = {
          sender: 'bot',
          content: "I can hear that inner critic being really harsh with you right now. Remember the evidence chart technique you've been practicing? What evidence do you actually have that supports this self-critical thought?",
          timestamp: new Date().toISOString(),
          tags: ['perfectionism', 'self-criticism', 'evidence-chart'],
        };
      }
      // Social anxiety responses
      else if (lowercaseMessage.includes('presentation') || lowercaseMessage.includes('meeting') || lowercaseMessage.includes('embarrassed')) {
        botResponse = {
          sender: 'bot',
          content: "Social situations can definitely trigger that perfectionist anxiety. The box breathing technique (4-4-4-4) has been helpful for you before presentations. Would you like to try that now?",
          timestamp: new Date().toISOString(),
          tags: ['social-anxiety', 'box-breathing', 'presentations'],
        };
      }
      // General supportive response
      else {
        botResponse = {
          sender: 'bot',
          content: "Thank you for sharing that with me. I'm here to support you using the strategies you've been developing in therapy. Would it be helpful to practice one of your coping techniques, or would you prefer to talk through what you're experiencing?",
          timestamp: new Date().toISOString(),
          tags: ['support', 'therapy-integration'],
        };
      }
      
      const newBotMessage = {
        ...botResponse,
        id: Math.random().toString(36).substring(2, 11),
      };
      
      setChatHistory(prev => [...prev, newBotMessage as ChatMessage]);
    }
    
    return newMessage as ChatMessage;
  };

  const getClient = (clientId: string) => {
    return clients.find(client => client.id === clientId);
  };

  return (
    <TherapyContext.Provider value={{
      clients,
      journalEntries,
      chatHistory,
      addClient,
      addNote,
      addCopingStrategy,
      addJournalEntry,
      addChatMessage,
      getClient,
    }}>
      {children}
    </TherapyContext.Provider>
  );
};