import { createAuthenticatedSupabaseClient, getSupabaseClient } from "./supabase";
import type { UserProfile } from "./types";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export type AuthContext = {
  user: User;
  profile: UserProfile;
  token: string;
  client: SupabaseClient | null;
};

const globalForAuth = globalThis as unknown as {
  mockUsers?: Map<string, { user: User; profile: UserProfile }>;
};

/**
 * Test authentication is deliberately opt-in and cannot be enabled in a
 * production build. It is only used by the local Playwright/dev harness.
 */
export function isTestAuthEnabled() {
  return process.env.NODE_ENV !== "production" &&
    process.env.CYBERDESK_TEST_AUTH === "1" &&
    process.env.CYBERDESK_FORCE_LOCAL_STORE === "1";
}

// In-memory mock user registry for local testing / offline development only.
const mockUsers = globalForAuth.mockUsers ?? new Map<string, { user: User; profile: UserProfile }>();
if (isTestAuthEnabled()) globalForAuth.mockUsers = mockUsers;

export function registerMockUser(id: string, email: string, fullName?: string) {
  if (!isTestAuthEnabled()) {
    throw new Error("Test authentication is disabled.");
  }

  const user: User = {
    id,
    app_metadata: { provider: "email" },
    user_metadata: { full_name: fullName },
    aud: "authenticated",
    confirmation_sent_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    email,
    email_confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    phone: "",
    role: "authenticated",
    updated_at: new Date().toISOString(),
  };
  const profile: UserProfile = {
    id,
    email,
    fullName: fullName || email.split("@")[0],
    createdAt: new Date().toISOString(),
  };
  mockUsers.set(id, { user, profile });
  mockUsers.set(email.toLowerCase(), { user, profile });
  return { user, profile };
}

// Seed default test users only inside the explicit local test harness.
if (isTestAuthEnabled() && !mockUsers.has("user-alpha-001")) {
  registerMockUser("user-alpha-001", "citizen.alpha@example.com", "Citizen Alpha");
  registerMockUser("user-beta-002", "citizen.beta@example.com", "Citizen Beta");
}

/**
 * Extracts and validates the authenticated user from the incoming request.
 * Fails closed (returns null) if no valid authentication is present.
 */
export async function getAuthenticatedUser(request: Request): Promise<AuthContext | null> {
  const authHeader = request.headers.get("Authorization");

  // Test headers are accepted only by the explicit non-production harness.
  // In every other environment they are ignored and real Supabase Auth is
  // the only source of identity.
  if (isTestAuthEnabled()) {
    const testUserId = request.headers.get("x-test-user-id");
    const testUserEmail = request.headers.get("x-test-user-email");
    const key = (testUserId || testUserEmail || "").toLowerCase();
    if (testUserId || testUserEmail) {
      let found = mockUsers.get(key);
      if (!found && testUserEmail) {
        found = registerMockUser(testUserId || `test-${Date.now()}`, testUserEmail);
      }
      if (found) {
        return {
          user: found.user,
          profile: found.profile,
          token: `mock-token-${found.user.id}`,
          client: null,
        };
      }
    }
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // Also check cookie if header is not present
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/sb-access-token=([^;]+)/);
    if (!match) return null;
    const token = match[1];
    return validateSupabaseToken(token);
  }

  const token = authHeader.replace("Bearer ", "").trim();
  if (isTestAuthEnabled() && token.startsWith("mock-token-")) {
    const userId = token.replace("mock-token-", "");
    const found = mockUsers.get(userId);
    if (found) {
      return {
        user: found.user,
        profile: found.profile,
        token,
        client: null,
      };
    }
  }

  return validateSupabaseToken(token);
}

/** Legacy endpoints are intentionally public only for the synthetic demo. */
export async function rejectAuthenticatedDemoRequest(request: Request): Promise<Response | null> {
  if (await getAuthenticatedUser(request)) {
    return Response.json({ error: "This demo endpoint is not available to authenticated case workspaces." }, { status: 403 });
  }
  return null;
}

async function validateSupabaseToken(token: string): Promise<AuthContext | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    // No real auth provider means protected requests fail closed. Mock users
    // are never a production-capable fallback.
    if (!isTestAuthEnabled()) return null;
    const found = Array.from(mockUsers.values()).find((u) => `mock-token-${u.user.id}` === token || u.user.id === token);
    if (found) {
      return {
        user: found.user,
        profile: found.profile,
        token,
        client: null,
      };
    }
    return null;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;

    const authenticatedClient = createAuthenticatedSupabaseClient(token);
    let profile: UserProfile = {
      id: user.id,
      email: user.email ?? "",
      fullName: (user.user_metadata?.full_name as string) || (user.email ? user.email.split("@")[0] : ""),
      createdAt: user.created_at,
    };

    if (authenticatedClient) {
      const { data: profileRow } = await authenticatedClient
        .from("profiles")
        .select("id, email, full_name, created_at, updated_at")
        .eq("id", user.id)
        .maybeSingle();

      if (profileRow) {
        profile = {
          id: profileRow.id,
          email: profileRow.email,
          fullName: profileRow.full_name,
          createdAt: profileRow.created_at,
          updatedAt: profileRow.updated_at,
        };
      }
    }

    return {
      user,
      profile,
      token,
      client: authenticatedClient,
    };
  } catch (err) {
    console.error("Token validation error:", err);
    return null;
  }
}
