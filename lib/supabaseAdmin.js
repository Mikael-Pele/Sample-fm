import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client for the cover-art upload route.
//
// This uses the ANON/PUBLISHABLE key rather than the service_role/secret
// key. That's intentional: our own /api/upload/artwork route already
// requires a valid Droppa.fm session (getSessionFromRequest) before it
// ever calls Supabase, so app-level auth is already enforced — Supabase
// itself only needs an explicit Storage policy granting the `anon` role
// INSERT access scoped to the `artwork` bucket (see the SQL in the setup
// instructions). This sidesteps inconsistent service-role/secret-key
// support for bypassing Storage RLS across different Supabase projects.
let cachedClient = null;

export function getSupabaseAdmin() {
  if (cachedClient) return cachedClient;

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set to enable cover art uploads.");
  }

  cachedClient = createClient(url, anonKey, {
    auth: { persistSession: false },
  });

  return cachedClient;
}

export const ARTWORK_BUCKET = "artwork";
