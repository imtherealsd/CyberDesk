"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { PublicNav } from "../components/PublicNav";
import { PublicFooter } from "../components/PublicFooter";

const TEST_AUTH_ENABLED =
  process.env.NEXT_PUBLIC_CYBERDESK_TEST_AUTH === "1";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { signInWithOtp, testLoginAs, user } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  const errorId = "login-error";
  const successId = "login-success";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError(t.login.invalidEmailError);
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const result = await signInWithOtp(email.trim());
      if (result.error) {
        setError(result.error);
      } else {
        setMessage(
          `A magic sign-in link has been sent to ${email}. Check your inbox and click the link to continue.`
        );
      }
    } catch {
      setError("Could not complete sign-in request. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function handleQuickLogin(testUser: {
    id: string;
    email: string;
    fullName: string;
  }) {
    testLoginAs(testUser);
    // Let the AuthProvider commit the simulated session before the protected
    // route evaluates its redirect guard.
    window.setTimeout(() => router.push("/cases"), 0);
  }

  return (
    <div className="login-page-wrapper">
      <PublicNav />

      <main id="main-content" className="login-container">
        <div className="login-card">
          {/* Brand row */}
          <div className="login-brand-row">
            <span className="brand-mark" aria-hidden="true" style={{ width: 36, height: 36, padding: 8 }}>
              <span />
              <span />
              <span />
            </span>
            <span className="prototype-badge">{t.login.badge}</span>
          </div>

          <h1 className="login-heading">{t.login.title}</h1>
          <p className="login-lead">
            {t.login.lead}
          </p>

          {/* Already signed in notice */}
          {user && (
            <div className="notice" role="status" style={{ marginBottom: "20px" }}>
              <span aria-hidden="true">✓</span>{" "}
              {t.login.signedInAs} <strong>{user.email}</strong>.{" "}
              <Link href="/cases" style={{ color: "var(--teal-dark)", fontWeight: 600, textDecoration: "underline" }}>
                {t.login.goToCases}
              </Link>
            </div>
          )}

          {/* Success message */}
          {message && (
            <div
              className="notice"
              role="status"
              id={successId}
              aria-live="polite"
              style={{ marginBottom: "20px" }}
            >
              <span aria-hidden="true">✉</span> {message}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div
              className="error-box"
              role="alert"
              id={errorId}
              aria-live="assertive"
              style={{ marginBottom: "20px" }}
            >
              <strong>{t.common.accessDenied}</strong>
              <span>{error}</span>
            </div>
          )}

          {/* Magic link form */}
          <form
            className="login-form"
            onSubmit={handleSubmit}
            aria-describedby={error ? errorId : undefined}
          >
            <div className="login-input-group">
              <label htmlFor="login-email" className="login-label">
                {t.login.emailLabel}
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.login.emailPlaceholder}
                className={`login-input${error ? " error" : ""}`}
                aria-describedby={error ? errorId : undefined}
                aria-invalid={!!error}
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="primary-button login-submit-btn"
            >
              {busy ? t.login.submittingBtn : t.login.submitBtn}
            </button>
          </form>

          {/* How it works hint */}
          <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "14px", marginBottom: 0, lineHeight: 1.55 }}>
            {t.login.testUsersDesc}
          </p>

          {/* Test access — only shown in dev/test mode */}
          {TEST_AUTH_ENABLED && (
            <div className="test-access-section">
              <p className="test-access-title">{t.login.testUsersTitle}</p>
              <div className="test-access-buttons">
                <button
                  type="button"
                  className="test-user-btn"
                  onClick={() =>
                    handleQuickLogin({
                      id: "user-alpha-001",
                      email: "citizen.alpha@example.com",
                      fullName: "Citizen Alpha",
                    })
                  }
                >
                  <span>Sign in as Citizen Alpha (User A)</span>
                  <span className="test-user-role">Isolation Test A</span>
                </button>
                <button
                  type="button"
                  className="test-user-btn"
                  onClick={() =>
                    handleQuickLogin({
                      id: "user-beta-002",
                      email: "citizen.beta@example.com",
                      fullName: "Citizen Beta",
                    })
                  }
                >
                  <span>Sign in as Citizen Beta (User B)</span>
                  <span className="test-user-role">Isolation Test B</span>
                </button>
              </div>
              <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "10px", marginBottom: 0, lineHeight: 1.5 }}>
                {t.login.testUsersDesc}
              </p>
            </div>
          )}
        </div>

        <Link href="/" className="login-return-link">
          ← {t.common.brandName}
        </Link>
      </main>

      <PublicFooter />
    </div>
  );
}
