import React, { useEffect, useState, useRef } from 'react';
import { useZentia } from '../../contexts/ZentiaContext';
import { sendMessage } from '../../services/chatHistoryService';
import { useAuth } from '../../contexts/AuthContext';
import { EnhancedAICompanion } from '../../services/enhancedAICompanion';

interface Props {
  clientId: string;
}

const ClientChatHistory: React.FC<Props> = ({ clientId }) => {
  const { clientChatHistory, fetchAndSetClientChatHistory } = useZentia();
  const { user } = useAuth();
  const [nextSession, setNextSession] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);

  useEffect(() => {
    if (clientId) fetchAndSetClientChatHistory(clientId);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      fetchAndSetClientChatHistory(clientId);
    }, 4000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [clientId, fetchAndSetClientChatHistory]);

  useEffect(() => {
    // Try to get next session from user object (if available)
    if (user && (user.nextSessionDate || user.next_session_date)) {
      setNextSession(user.nextSessionDate || user.next_session_date);
    } else {
      setNextSession(null);
    }
  }, [user]);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    setAiSuggestions([]);
    try {
      // 1. Save user message
      await sendMessage({ clientId, sender: 'user', content: message });
      setMessage('');
      await fetchAndSetClientChatHistory(clientId);

      // 2. Fetch updated chat history
      const updatedHistory = await fetchAndSetClientChatHistory(clientId);

      // 3. Call AI for context-aware response
      if (user) {
        const aiResult = await EnhancedAICompanion.generateContextAwareResponse(
          message,
          updatedHistory,
          user.id
        );
        // 4. Save AI response to chat
        await sendMessage({ clientId, sender: 'assistant', content: aiResult.message.content });
        await fetchAndSetClientChatHistory(clientId);
        // 5. Show suggestions if present
        if (aiResult.suggestions && aiResult.suggestions.length > 0) {
          setAiSuggestions(aiResult.suggestions);
        }
      }
    } catch (e) {
      // handle error
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h3 className="font-bold mb-2">Storico Chat Cliente</h3>
      <div className="mb-4 p-3 rounded bg-blue-50 border border-blue-100">
        {nextSession ? (
          <span>📅 Your next session is scheduled for <b>{new Date(nextSession).toLocaleDateString()}</b>.</span>
        ) : (
          <span>
            I understand you're looking for the date of your next session with your therapist.<br/>
            <span className="text-gray-600">I don't have access to your scheduling information for privacy reasons. However, you can typically find this information in your appointment confirmation email, through the online portal you use to manage your appointments, or by contacting your therapist's office directly.</span>
          </span>
        )}
      </div>
      <div className="space-y-2 mb-4">
        {clientChatHistory.length === 0 && <div>Nessun messaggio.</div>}
        {clientChatHistory.map(msg => (
          <div key={msg.id} className={`p-2 rounded ${msg.sender === 'user' ? 'bg-blue-50' : 'bg-gray-100'}`}>
            <div className="text-xs text-gray-500">{msg.timestamp}</div>
            <div><b>{msg.sender}:</b> {msg.content}</div>
          </div>
        ))}
      </div>
      {sending && (
        <div className="flex items-center gap-2 mb-2 text-blue-600">
          <span className="loader w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
          AI is thinking...
        </div>
      )}
      {aiSuggestions.length > 0 && (
        <div className="mb-4 p-3 rounded bg-blue-100 border border-blue-300">
          <div className="font-semibold mb-1">AI Suggestions:</div>
          <ul className="list-disc pl-5">
            {aiSuggestions.map((s, i) => (
              <li key={i}><b>{s.title}:</b> {s.description}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-2 py-1"
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Scrivi un messaggio..."
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          disabled={sending}
        />
        <button
          className="bg-blue-600 text-white px-4 py-1 rounded"
          onClick={handleSend}
          disabled={sending || !message.trim()}
        >Invia</button>
      </div>
    </div>
  );
};

export default ClientChatHistory; 