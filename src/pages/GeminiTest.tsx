import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Bot, Send, Loader2, User, Key, Server, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { EnhancedAICompanion, EnhancedChatMessage } from '../services/enhancedAICompanion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const GeminiTest: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [chatHistory, setChatHistory] = useState<EnhancedChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startWelcomeChat = () => {
    setChatHistory([
      {
        id: 'init',
        sender: 'assistant',
        content: `Hello ${user?.user_metadata.first_name || 'there'}! I'm your Zentia AI companion, now running with full context awareness. How can I help you today?`,
        timestamp: new Date().toISOString(),
        metadata: { responseType: 'general', confidence: 1 }
      }
    ]);
  };

  React.useEffect(() => {
    if (user) {
      startWelcomeChat();
    }
  }, [user]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const userMessage: EnhancedChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: userInput,
      timestamp: new Date().toISOString(),
      metadata: { responseType: 'general', confidence: 1 }
    };

    setChatHistory(prev => [...prev, userMessage]);
    const currentInput = userInput;
    setUserInput('');
    setIsLoading(true);
    setError(null);

    try {
      if (!user) throw new Error('User is not authenticated.');

      const { message: aiResponseMessage } = await EnhancedAICompanion.generateContextAwareResponse(
        currentInput,
        chatHistory.filter(m => m.sender !== 'system').map(m => ({
            role: m.sender === 'user' ? 'user' : 'model', 
            parts: [{ text: m.content }]
        })),
        user.id
      );
      
      setChatHistory(prev => [...prev, aiResponseMessage]);

    } catch (err: any) {
      const errorMessage = `Error: ${err.message || 'An unknown error occurred.'}`;
      setError(errorMessage);
      setChatHistory(prev => [...prev, {
        id: `error-${Date.now()}`,
        sender: 'system',
        content: errorMessage,
        timestamp: new Date().toISOString(),
        metadata: { responseType: 'general', confidence: 1 }
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const apiKeyStatus = import.meta.env.VITE_GEMINI_API_KEY && import.meta.env.VITE_GEMINI_API_KEY.startsWith('AIza');

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <Bot className="w-16 h-16 mx-auto text-primary mb-4" />
          <h1 className="text-4xl font-bold text-gray-800">AI Companion Context Test</h1>
          <p className="text-lg text-gray-600 mt-2">
            A "certosino" panel to test the AI's contextual awareness.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Authentication</CardTitle>
              <User className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {user ? <Badge variant="success">Authenticated</Badge> : <Badge variant="destructive">Not Authenticated</Badge>}
              <p className="text-xs text-muted-foreground mt-1">{user?.email}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Gemini API Key</CardTitle>
              <Key className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {apiKeyStatus ? <Badge variant="success">Configured</Badge> : <Badge variant="destructive">Missing or Invalid</Badge>}
               <p className="text-xs text-muted-foreground mt-1">.env VITE_GEMINI_API_KEY</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Context Function</CardTitle>
              <Server className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
               <Badge variant="success">Ready</Badge>
               <p className="text-xs text-muted-foreground mt-1">fetch-comprehensive-user-context</p>
            </CardContent>
          </Card>
        </div>

        {!user ? (
          <Card className="text-center p-8">
            <AlertTriangle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription className="mt-2">Please log in to use the AI Companion test panel.</CardDescription>
            <Button onClick={() => window.location.href = '/login'} className="mt-4">Go to Login</Button>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="h-[500px] w-full pr-4 mb-4 overflow-y-auto">
                <div className="flex flex-col space-y-4">
                  {chatHistory.map((msg) => (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.sender === 'assistant' && <Bot className="w-6 h-6 text-primary flex-shrink-0"/>}
                      <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg ${
                        msg.sender === 'user' ? 'bg-primary text-primary-foreground' :
                        msg.sender === 'assistant' ? 'bg-muted' : 'bg-destructive/20 text-destructive-foreground'
                      }`}>
                        <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                        {msg.metadata?.contextUsed !== undefined && <p className="text-xs mt-2 opacity-60">Context Used: {String(msg.metadata.contextUsed)}</p>}
                      </div>
                       {msg.sender === 'user' && <User className="w-6 h-6 text-muted-foreground flex-shrink-0"/>}
                    </div>
                  ))}
                  {isLoading && <div className="flex justify-start"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground"/></div>}
                </div>
              </div>
              
              {error && <p className="text-destructive text-sm my-2">{error}</p>}
              
              <div className="flex space-x-2">
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask for your name or last journal entry..."
                  disabled={isLoading || !user}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={isLoading || !user}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default GeminiTest; 