"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "./supabase";
import type { UserProfile } from "./types";
import type { Session, User } from "@supabase/supabase-js";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  signInWithOtp: (email: string, redirectTo?: string) => Promise<{ error: string | null; success: boolean }>;
  signOut: () => Promise<void>;
  authFetch: (url: string, init?: RequestInit) => Promise<Response>;
  testLoginAs: (testUser: { id: string; email: string; fullName?: string }) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const LOCAL_TEST_USER_KEY = "cyberdesk_test_auth_user";
const TEST_AUTH_ENABLED =
  process.env.NEXT_PUBLIC_CYBERDESK_TEST_AUTH === "1";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync Supabase Auth or restore test user session
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      // 1. Check local simulated test user first (useful for offline/playwright tests)
      if (TEST_AUTH_ENABLED && typeof window !== "undefined") {
        const testUserJson = sessionStorage.getItem(LOCAL_TEST_USER_KEY);
        if (testUserJson) {
          try {
            const parsed = JSON.parse(testUserJson);
            if (parsed && parsed.id && parsed.email) {
              const simulatedUser: User = {
                id: parsed.id,
                app_metadata: { provider: "email" },
                user_metadata: { full_name: parsed.fullName },
                aud: "authenticated",
                confirmation_sent_at: new Date().toISOString(),
                confirmed_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                email: parsed.email,
                email_confirmed_at: new Date().toISOString(),
                last_sign_in_at: new Date().toISOString(),
                phone: "",
                role: "authenticated",
                updated_at: new Date().toISOString(),
              };
              const simulatedProfile: UserProfile = {
                id: parsed.id,
                email: parsed.email,
                fullName: parsed.fullName || parsed.email.split("@")[0],
                createdAt: new Date().toISOString(),
              };
              if (mounted) {
                setUser(simulatedUser);
                setProfile(simulatedProfile);
                setIsLoading(false);
              }
              return;
            }
          } catch (e) {
            console.warn("Failed to parse test user from session storage", e);
          }
        }
      }

      // 2. Check Supabase Browser Client
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (initialSession?.user && mounted) {
          setSession(initialSession);
          setUser(initialSession.user);
          setProfile({
            id: initialSession.user.id,
            email: initialSession.user.email ?? "",
            fullName: (initialSession.user.user_metadata?.full_name as string) || initialSession.user.email?.split("@")[0] || "",
            createdAt: initialSession.user.created_at,
          });
        }
      } catch (err) {
        console.warn("Supabase auth session check failed:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, newSession) => {
          if (!mounted) return;
          setSession(newSession);
          if (newSession?.user) {
            setUser(newSession.user);
            setProfile({
              id: newSession.user.id,
              email: newSession.user.email ?? "",
              fullName: (newSession.user.user_metadata?.full_name as string) || newSession.user.email?.split("@")[0] || "",
              createdAt: newSession.user.created_at,
            });
            sessionStorage.removeItem(LOCAL_TEST_USER_KEY);
          } else {
            // Only clear user if no local test user is set
            if (!sessionStorage.getItem(LOCAL_TEST_USER_KEY)) {
              setUser(null);
              setProfile(null);
            }
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const testLoginAs = useCallback(
    (testUser: { id: string; email: string; fullName?: string }) => {
      if (!TEST_AUTH_ENABLED) return;

      const simulatedUser: User = {
        id: testUser.id,
        app_metadata: { provider: "email" },
        user_metadata: { full_name: testUser.fullName },
        aud: "authenticated",
        confirmation_sent_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        email: testUser.email,
        email_confirmed_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        phone: "",
        role: "authenticated",
        updated_at: new Date().toISOString(),
      };
      const simulatedProfile: UserProfile = {
        id: testUser.id,
        email: testUser.email,
        fullName: testUser.fullName || testUser.email.split("@")[0],
        createdAt: new Date().toISOString(),
      };

      if (typeof window !== "undefined") {
        sessionStorage.setItem(LOCAL_TEST_USER_KEY, JSON.stringify(testUser));
      }
      setUser(simulatedUser);
      setProfile(simulatedProfile);
    },
    []
  );

  const signInWithOtp = useCallback(
    async (email: string, redirectTo?: string) => {
      const supabase = getSupabaseBrowserClient();
      const redirectUrl =
        redirectTo ||
        (typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : "/auth/callback");

      if (!supabase && TEST_AUTH_ENABLED) {
        // Fallback for local simulation mode
        testLoginAs({ id: `user-${Date.now().toString(36)}`, email });
        return { error: null, success: true };
      }

      if (!supabase) {
        return { error: "Passwordless sign-in is unavailable right now. Please try again later.", success: false };
      }

      try {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });

        if (error) {
          return { error: error.message, success: false };
        }
        return { error: null, success: true };
      } catch (err) {
        return {
          error: err instanceof Error ? err.message : "Failed to send magic link",
          success: false,
        };
      }
    },
    [testLoginAs]
  );

  const signOut = useCallback(async () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(LOCAL_TEST_USER_KEY);
    }
    setUser(null);
    setProfile(null);
    setSession(null);

    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
  }, []);

  const authFetch = useCallback(
    async (url: string, init: RequestInit = {}) => {
      const headers = new Headers(init.headers || {});

      if (session?.access_token) {
        headers.set("Authorization", `Bearer ${session.access_token}`);
      } else if (user && TEST_AUTH_ENABLED) {
        // Pass simulated user headers when running in test / local mode
        headers.set("x-test-user-id", user.id);
        if (user.email) headers.set("x-test-user-email", user.email);
        headers.set("Authorization", `Bearer mock-token-${user.id}`);
      }

      return fetch(url, {
        ...init,
        headers,
      });
    },
    [session, user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        signInWithOtp,
        signOut,
        authFetch,
        testLoginAs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
