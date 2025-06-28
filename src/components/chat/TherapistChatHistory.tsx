import React, { useEffect, useState, useRef } from 'react';
import { useZentia } from '../../contexts/ZentiaContext';
import { sendMessage } from '../../services/chatHistoryService';
import { useAuth } from '../../contexts/AuthContext';
import { EnhancedAICompanion } from '../../services/enhancedAICompanion';

interface Props {
  clientId: string;
}

const TherapistChatHistory: React.FC<Props> = ({ clientId }) => {
  const { therapistChatHistory, fetchAndSetTherapistChatHistory } = useZentia();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);

  useEffect(() => {
    if (clientId) fetchAndSetTherapistChatHistory(clientId);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      fetchAndSetTherapistChatHistory(clientId);
    }, 4000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [clientId, fetchAndSetTherapistChatHistory]);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    setAiSuggestions([]);
    try {
      // 1. Save therapist message
      await sendMessage({ clientId, sender: 'therapist', content: message });
      setMessage('');
      await fetchAndSetTherapistChatHistory(clientId);

      // 2. Fetch updated chat history
      const updatedHistory = await fetchAndSetTherapistChatHistory(clientId);

      // 3. Call AI for context-aware response
      if (user) {
        const aiResult = await EnhancedAICompanion.generateContextAwareResponse(
          message,
          updatedHistory,
          user.id
        );
        // 4. Save AI response to chat
        await sendMessage({ clientId, sender: 'assistant', content: aiResult.message.content });
        await fetchAndSetTherapistChatHistory(clientId);
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
      <h3 className="font-bold mb-2">Storico Chat Terapista</h3>
      <div className="space-y-2 mb-4">
        {therapistChatHistory.length === 0 && <div>Nessun messaggio.</div>}
        {therapistChatHistory.map(msg => (
          <div key={msg.id} className={`p-2 rounded ${msg.sender === 'therapist' ? 'bg-green-50' : 'bg-gray-100'}`}>
            <div className="text-xs text-gray-500">{msg.timestamp}</div>
            <div><b>{msg.sender}:</b> {msg.content}</div>
          </div>
        ))}
      </div>
      {sending && (
        <div className="flex items-center gap-2 mb-2 text-green-600">
          <span className="loader w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></span>
          AI is thinking...
        </div>
      )}
      {aiSuggestions.length > 0 && (
        <div className="mb-4 p-3 rounded bg-green-100 border border-green-300">
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
          className="bg-green-600 text-white px-4 py-1 rounded"
          onClick={handleSend}
          disabled={sending || !message.trim()}
        >Invia</button>
      </div>
    </div>
  );
};

export default TherapistChatHistory; 