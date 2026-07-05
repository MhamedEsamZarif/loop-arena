import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Handles the redirect Supabase sends the user back to after they click the
 * magic-link email. Exchanges the one-time `code` query param for a real
 * session and sets the auth cookies, then redirects into the app.
 *
 * This route must exist at exactly this path (or match whatever `redirectTo`
 * the login page passes to `supabase.auth.signInWithOtp`), and that same
 * path must be added to Supabase's Redirect URLs allow-list.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // No code, or the exchange failed — send the user back to login with a
  // visible reason instead of a silent redirect.
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
