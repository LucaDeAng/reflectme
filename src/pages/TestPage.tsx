import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useZentia } from '../contexts/ZentiaContext';
import { GeminiAIService } from '../services/geminiAIService';
import { getFullUserContext } from '../services/userContextAggregator';

const TestPage: React.FC = () => {
  const { user } = useAuth();
  const { chatHistory, addMessage, isGeneratingResponse, fetchInsightsData, moodEntries, sessionRecaps, copingTools } = useZentia();
  const [testMessage, setTestMessage] = useState('');
  const [userContext, setUserContext] = useState<any>(null);
  const [contextError, setContextError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      // Test fetching user context
      getFullUserContext(user.id).then(context => {
        setUserContext(context);
        addTestResult(`✅ User context loaded successfully. Profile: ${context.profile?.first_name || 'No name'}`);
      }).catch(error => {
        setContextError(error.message);
        addTestResult(`❌ Failed to load user context: ${error.message}`);
      });

      // Test fetching insights data
      fetchInsightsData().then(() => {
        addTestResult(`✅ Insights data fetched. Mood entries: ${moodEntries.length}, Sessions: ${sessionRecaps.length}, Tools: ${copingTools.length}`);
      }).catch(error => {
        addTestResult(`❌ Failed to fetch insights: ${error.message}`);
      });
    }
  }, [user]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testAIResponse = async () => {
    if (!testMessage.trim()) return;
    
    addTestResult(`🤖 Testing AI with message: "${testMessage}"`);
    
    try {
      const chatHistoryFormatted = chatHistory.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model' as const,
        parts: [{ text: msg.content }]
      }));

      const response = await GeminiAIService.generateContextAwareResponse(
        testMessage,
        chatHistoryFormatted,
        user?.id
      );

      addTestResult(`✅ AI Response received: "${response.substring(0, 100)}..."`);
      
      // Check if AI mentions user's name
      if (userContext?.profile?.first_name && response.toLowerCase().includes(userContext.profile.first_name.toLowerCase())) {
        addTestResult(`✅ AI correctly mentioned user's name!`);
      } else {
        addTestResult(`⚠️ AI did not mention user's name in response`);
      }
      
    } catch (error: any) {
      addTestResult(`❌ AI Response failed: ${error.message}`);
    }
  };

  const testZentiaContext = () => {
    addTestResult(`📊 ZentiaContext Status:`);
    addTestResult(`- Chat history length: ${chatHistory.length}`);
    addTestResult(`- Mood entries: ${moodEntries.length}`);
    addTestResult(`- Session recaps: ${sessionRecaps.length}`);
    addTestResult(`- Coping tools: ${copingTools.length}`);
    addTestResult(`- Is generating: ${isGeneratingResponse}`);
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Test Page</h1>
        <p className="text-red-600">Please log in to test the functionality.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-4">🧪 Zentia Test Page</h1>
      
      {/* User Info */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">User Information</h2>
        <p><strong>User ID:</strong> {user.id}</p>
        <p><strong>Email:</strong> {user.email}</p>
        {userContext?.profile && (
          <div>
            <p><strong>Name:</strong> {userContext.profile.first_name} {userContext.profile.last_name}</p>
            <p><strong>Preferred Name:</strong> {userContext.profile.preferred_name || 'Not set'}</p>
            <p><strong>Role:</strong> {userContext.profile.role}</p>
          </div>
        )}
        {contextError && (
          <p className="text-red-600"><strong>Context Error:</strong> {contextError}</p>
        )}
      </div>

      {/* AI Test */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">AI Context Test</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Enter a test message (e.g., 'What's my name?')"
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={testAIResponse}
            disabled={isGeneratingResponse || !testMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {isGeneratingResponse ? 'Testing...' : 'Test AI'}
          </button>
        </div>
        <button
          onClick={testZentiaContext}
          className="px-4 py-2 bg-purple-600 text-white rounded"
        >
          Check ZentiaContext
        </button>
      </div>

      {/* Test Results */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Test Results</h2>
        <div className="max-h-96 overflow-y-auto space-y-1">
          {testResults.map((result, index) => (
            <div key={index} className="text-sm font-mono p-2 bg-white rounded border">
              {result}
            </div>
          ))}
        </div>
        {testResults.length === 0 && (
          <p className="text-gray-500 italic">No test results yet. Run some tests above!</p>
        )}
      </div>

      {/* Raw Data Display */}
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Raw Context Data</h2>
        <details>
          <summary className="cursor-pointer font-medium">Click to view raw user context</summary>
          <pre className="mt-2 text-xs bg-white p-4 rounded border overflow-auto max-h-96">
            {JSON.stringify(userContext, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
};

export default TestPage; 