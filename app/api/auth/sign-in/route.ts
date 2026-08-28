import { z } from "zod";
import { getSupabaseClient } from "@/lib/supabase";
import { isTestAuthEnabled, registerMockUser } from "@/lib/auth-server";

const bodySchema = z.object({
  email: z.string().trim().email(),
  redirectTo: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const supabase = getSupabaseClient();

    if (!supabase && isTestAuthEnabled()) {
      // Local demo / mock mode signin
      const mock = registerMockUser(
        `user-${Buffer.from(body.email).toString("hex").slice(0, 12)}`,
        body.email
      );
      return Response.json({
        message: "Sign-in simulated for local development environment.",
        user: mock.user,
        token: `mock-token-${mock.user.id}`,
      });
    }

    if (!supabase) {
      return Response.json({ error: "Passwordless sign-in is unavailable right now. Please try again later." }, { status: 503 });
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: body.email,
      options: {
        emailRedirectTo: body.redirectTo || `${new URL(request.url).origin}/auth/callback`,
      },
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ message: "Check your email for the magic sign-in link." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    console.error("Sign-in error:", error);
    return Response.json({ error: "Could not send sign-in link. Please try again." }, { status: 500 });
  }
}
