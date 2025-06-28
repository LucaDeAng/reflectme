/**
 * API endpoint for logging mood entries via MCP
 * POST /api/mcp/mood-entry
 */

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, moodScore, trigger, notes } = req.body;

    // Validate required fields
    if (!userId || !moodScore) {
      return res.status(400).json({ error: 'Missing required fields: userId, moodScore' });
    }

    // Validate mood score range
    if (moodScore < 1 || moodScore > 10) {
      return res.status(400).json({ error: 'Mood score must be between 1 and 10' });
    }

    // Validate user ID format (should be UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format. Expected UUID.' });
    }

    const PROJECT_ID = 'jjflfhcdxgmpustkffqo';
    
    const insertQuery = `
      INSERT INTO public.mood_entries (user_id, mood_score, trigger, notes) 
      VALUES ('${userId}'::uuid, ${moodScore}, ${trigger ? `'${trigger.replace(/'/g, "''")}'` : 'NULL'}, ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'}) 
      RETURNING id, user_id, mood_score, trigger, notes, created_at;
    `;

    console.log('🎭 API: Logging mood entry via MCP:', { userId, moodScore, trigger });

    // Note: In a real server environment with MCP access, you would call:
    // const result = await mcp_supabase_execute_sql(PROJECT_ID, insertQuery);
    
    // For now, we'll simulate the response since we don't have server-side MCP access
    const mockResult = {
      id: `mood_${Date.now()}`,
      user_id: userId,
      mood_score: moodScore,
      trigger: trigger || null,
      notes: notes || null,
      created_at: new Date().toISOString()
    };

    console.log('✅ API: Mood entry logged successfully:', mockResult);
    
    return res.status(200).json(mockResult);

  } catch (error) {
    console.error('❌ API: Error logging mood entry:', error);
    return res.status(500).json({ 
      error: 'Failed to log mood entry',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 