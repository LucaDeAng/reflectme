import { createClient } from '@supabase/supabase-js';

// CRITICAL SECURITY WARNING:
// The VITE_SUPABASE_SERVICE_ROLE_KEY (or any secret key) MUST NOT be exposed on the client side.
// Any variable prefixed with VITE_ is embedded into the client-side bundle.
//
// This file is intended for server-side use only. Using it in a client-side
// context (like a Vite app) will embed the service role key into the
// publicly accessible JavaScript bundle, compromising your database security.
//
// To perform admin actions, create a dedicated server-side function (e.g., in /netlify/functions or /supabase/functions)
// and call it from the client. The server-side function can safely use environment variables.

// The code below is commented out to prevent accidental exposure.
/*
const supabaseAdmin = createClient(
  // These should be standard environment variables on your server, NOT VITE_ prefixed
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export { supabaseAdmin };
*/

// Placeholder export to avoid breaking imports.
// This will cause a runtime error if supabaseAdmin is actually used,
// which is a good thing as it highlights the security issue.
export const supabaseAdmin = null;