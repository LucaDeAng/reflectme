import { supabase } from '@/lib/supabase';

export async function getFullUserContext(userId: string) {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-user-context', {
      body: { user_id: userId }
    });
    if (error) throw error;
    return data as any;
  } catch (err) {
    console.error('getFullUserContext error:', err);
    return null;
  }
} 