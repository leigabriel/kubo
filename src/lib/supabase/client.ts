import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null | undefined;

/**
 * Returns a browser-safe Supabase client for reading public data, or `null`
 * when the public URL/key are not configured.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (client !== undefined) return client;

  if (!supabaseUrl || !supabaseKey) {
    client = null;
    return client;
  }

  client = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return client;
}
