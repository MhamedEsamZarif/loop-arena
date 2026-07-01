import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Uses the anon key only — never the service
 * role key, which must stay server-side (see ./server.ts and ./admin.ts).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
