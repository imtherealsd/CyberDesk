import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let serviceRoleClient: SupabaseClient | null = null;

/**
 * Service-role access is intentionally isolated to server-only modules. It
 * bypasses RLS and must never be imported by a client component or route that
 * has not already performed request authorization.
 */
export function getSupabaseServiceRoleClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  serviceRoleClient ??= createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return serviceRoleClient;
}

