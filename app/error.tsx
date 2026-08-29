"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { PublicNav } from "@/app/components/PublicNav";
import { PublicFooter } from "@/app/components/PublicFooter";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    // Log sanitized error locally for diagnostics without exposing to citizen
    console.error("Unhandled client application error:", error);
  }, [error]);

  return (
    <div className="not-found-page">
      <PublicNav />

      <main id="main-content" className="not-found-main">
        <div className="not-found-content">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "28px" }}>
            <span className="brand-mark" aria-hidden="true" style={{ width: 48, height: 48, padding: 10 }}>
              <span />
              <span />
              <span />
            </span>
          </div>

          <p className="not-found-code font-mono" aria-hidden="true" style={{ color: "var(--coral)" }}>
            Notice
          </p>
          <h1 className="not-found-title">Something went wrong</h1>
          <p className="not-found-desc">
            CyberDesk encountered an unexpected display issue. Your saved cases and session data remain safe.
          </p>

          <div className="not-found-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => reset()}
            >
              Try Again ↻
            </button>
            <Link href="/" className="secondary-button">
              ← Return Home
            </Link>
            <Link href="/cases" className="secondary-button">
              {t.nav.myCases}
            </Link>
          </div>

          {/* 1930 Helpline Emergency Guidance */}
          <div
            style={{
              marginTop: "48px",
              padding: "16px 20px",
              background: "var(--paper-subtle)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-md)",
              fontSize: "0.875rem",
              color: "var(--muted)",
              lineHeight: 1.55,
            }}
          >
            <strong style={{ color: "var(--ink)" }}>{t.notFound.respondingTitle}</strong>{" "}
            {t.notFound.callText}{" "}
            <a href="tel:1930" style={{ color: "var(--teal-dark)", fontWeight: 700 }}>
              1930
            </a>{" "}
            ({t.notFound.helplineName}) {t.notFound.orVisitText}{" "}
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--teal-dark)", fontWeight: 600 }}
            >
              {t.notFound.portalText}
            </a>{" "}
            {t.notFound.toFileText}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
