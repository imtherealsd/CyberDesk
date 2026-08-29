"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { PublicNav } from "@/app/components/PublicNav";
import { PublicFooter } from "@/app/components/PublicFooter";

export default function NotFound() {
  const { t } = useI18n();

  return (
    <div className="not-found-page">
      <PublicNav />

      <main id="main-content" className="not-found-main">
        <div className="not-found-content">
          {/* Brand mark */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "28px" }}>
            <span className="brand-mark" aria-hidden="true" style={{ width: 48, height: 48, padding: 10 }}>
              <span />
              <span />
              <span />
            </span>
          </div>

          <p className="not-found-code font-mono" aria-hidden="true">404</p>
          <h1 className="not-found-title">{t.notFound.title}</h1>
          <p className="not-found-desc">
            {t.notFound.desc}
          </p>

          <div className="not-found-actions">
            <Link href="/" className="primary-button">
              ← {t.notFound.returnHome}
            </Link>
            <Link href="/cases" className="secondary-button">
              {t.notFound.myCases}
            </Link>
            <Link href="/how-it-works" className="secondary-button">
              {t.notFound.howItWorks}
            </Link>
          </div>

          {/* 1930 reminder */}
          <div style={{
            marginTop: "48px",
            padding: "16px 20px",
            background: "var(--paper-subtle)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-md)",
            fontSize: "0.875rem",
            color: "var(--muted)",
            lineHeight: 1.55,
          }}>
            <strong style={{ color: "var(--ink)" }}>{t.notFound.respondingTitle}</strong>{" "}
            {t.notFound.callText}{" "}
            <a href="tel:1930" style={{ color: "var(--teal-dark)", fontWeight: 700 }}>1930</a>
            {" "}({t.notFound.helplineName}) {t.notFound.orVisitText}{" "}
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--teal-dark)", fontWeight: 600 }}
            >
              {t.notFound.portalText}
            </a>
            {" "}{t.notFound.toFileText}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}


