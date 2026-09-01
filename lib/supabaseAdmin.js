import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client, authenticated with the SERVICE ROLE key.
// This must never be imported into client-side code or exposed via
// NEXT_PUBLIC_* — it bypasses row-level security and storage policies,
// which is exactly what the upload API route needs to write into the
// artwork bucket on the artist's behalf.
let cachedClient = null;

export function getSupabaseAdmin() {
  if (cachedClient) return cachedClient;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to enable cover art uploads."
    );
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  return cachedClient;
}

export const ARTWORK_BUCKET = "artwork";
