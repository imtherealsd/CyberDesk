"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const [status, setStatus] = useState("Verifying your secure sign-in link…");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function handleAuth() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        router.push("/cases");
        return;
      }

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session) {
          setStatus("Sign-in confirmed. Redirecting to your cases…");
          router.replace("/cases");
        } else {
          // Listen for state change (e.g. hash fragment processing)
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
            if (newSession) {
              subscription.unsubscribe();
              router.replace("/cases");
            }
          });

          // Timeout fallback
          setTimeout(() => {
            router.replace("/cases");
          }, 3000);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Authentication link verification failed.");
      }
    }

    handleAuth();
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--paper)" }}>
      <div className="card" style={{ maxWidth: "420px", padding: "32px", textAlign: "center" }}>
        <h2 style={{ fontSize: "1.2rem", margin: "0 0 12px" }}>CyberDesk Authentication</h2>
        {error ? (
          <div className="error-box" role="alert">
            <strong>Authentication Error</strong>
            <span>{error}</span>
          </div>
        ) : (
          <p style={{ color: "var(--muted)", margin: 0 }}>{status}</p>
        )}
      </div>
    </div>
  );
}
