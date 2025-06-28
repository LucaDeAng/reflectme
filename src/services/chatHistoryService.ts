import { supabase } from '../lib/supabase';

export async function fetchClientChatHistory(clientId: string) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  // Messaggi del cliente: sender === 'user' o 'assistant'
  return (data ?? []).filter(msg => msg.sender === 'user' || msg.sender === 'assistant');
}

export async function fetchTherapistChatHistory(clientId: string) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  // Messaggi del terapista: sender === 'therapist' o 'assistant'
  return (data ?? []).filter(msg => msg.sender === 'therapist' || msg.sender === 'assistant');
}

export async function sendMessage({ clientId, sender, content }: { clientId: string, sender: 'user' | 'therapist', content: string }) {
  const { error } = await supabase
    .from('chat_messages')
    .insert([{ client_id: clientId, sender, content }]);
  if (error) throw error;
} 