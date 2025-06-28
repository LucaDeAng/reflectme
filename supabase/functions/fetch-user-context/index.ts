// Edge Function: fetch-user-context
// Fetches complete context for a single user (profile, moods, journal, tasks, assessments, notes, homework)
// This runs server-side with the Supabase service-role key, bypassing RLS but returning only the requested user's rows.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

// Environment variables automatically exposed inside Supabase Edge Functions
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function scrubPHI<T extends Record<string, unknown>>(obj: T | null) {
  if (!obj) return null;
  const { email, phone, ...rest } = obj as Record<string, unknown>;
  // Retain a non-PII friendly display name if present (first_name or name)
  const preferred_name = (rest.first_name ?? rest.name ?? '').toString().split(' ')[0] || undefined;
  return { ...rest, preferred_name } as T;
}

serve(async (req) => {
  try {
    const { user_id } = await req.json();
    if (!user_id) return new Response("user_id required", { status: 400 });

    const [profileRes, moodsRes, journalsRes, tasksRes, assessmentsRes, notesRes, homeworkRes] = await Promise.all([
      supabase.from("profiles").select("*" ).eq("id", user_id).single(),
      supabase.from("mood_entries").select("*" ).eq("user_id", user_id).order("date", { ascending: true }),
      supabase.from("journal_entries").select("*" ).eq("user_id", user_id).order("created_at", { ascending: false }),
      supabase.from("tasks").select("*" ).eq("user_id", user_id),
      supabase.from("assessments").select("*" ).eq("user_id", user_id),
      supabase.from("therapy_notes").select("*" ).eq("user_id", user_id),
      supabase.from("homework").select("*" ).eq("user_id", user_id),
    ]);

    const error = profileRes.error || moodsRes.error || journalsRes.error || tasksRes.error || assessmentsRes.error || notesRes.error || homeworkRes.error;
    if (error) throw error;

    const body = {
      profile : scrubPHI(profileRes.data),
      moods   : moodsRes.data,
      journals: journalsRes.data,
      tasks   : tasksRes.data,
      assessments: assessmentsRes.data,
      notes   : notesRes.data,
      homework: homeworkRes.data,
    };

    return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("fetch-user-context error", err);
    return new Response("Internal error", { status: 500 });
  }
}); 