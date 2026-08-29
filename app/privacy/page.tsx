"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { PublicNav } from "@/app/components/PublicNav";
import { PublicFooter } from "@/app/components/PublicFooter";

export default function PrivacyPage() {
  const { t } = useI18n();

  return (
    <div className="public-page">
      <PublicNav />

      <main id="main-content" className="public-content-container">
        <header className="legal-page-hero">
          <span className="legal-page-eyebrow">{t.privacy.eyebrow}</span>
          <h1 className="legal-page-title">{t.privacy.title}</h1>
          <p className="legal-page-date">{t.privacy.date}</p>
        </header>

        <div className="legal-content">
          <div className="legal-boundary-box">
            <h3>{t.privacy.boundaryTitle}</h3>
            <p>{t.privacy.boundaryDesc}</p>
          </div>

          <section className="legal-section">
            <h2>{t.privacy.collectTitle}</h2>
            <p>{t.privacy.collectDemo}</p>
            <p>{t.privacy.collectAuth}</p>
            <p>
              <strong>{t.privacy.collectDoNotTitle}</strong>
            </p>
            <ul>
              {t.privacy.collectDoNotItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="legal-section">
            <h2>{t.privacy.storeTitle}</h2>
            <p>{t.privacy.storeP1}</p>
            <p>{t.privacy.storeP2}</p>
          </section>

          <section className="legal-section">
            <h2>{t.privacy.aiTitle}</h2>
            <p>{t.privacy.aiP1}</p>
            <p>{t.privacy.aiP2}</p>
          </section>

          <section className="legal-section">
            <h2>{t.privacy.cookiesTitle}</h2>
            <p>{t.privacy.cookiesP1}</p>
          </section>

          <div style={{ marginTop: "48px", paddingTop: "24px", borderTop: "1px solid var(--line)", display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/terms" className="secondary-button" style={{ fontSize: "0.875rem", padding: "9px 16px" }}>
              {t.footer.linkTerms} →
            </Link>
            <Link href="/safety" className="secondary-button" style={{ fontSize: "0.875rem", padding: "9px 16px" }}>
              {t.footer.linkSafety} →
            </Link>
            <Link href="/" className="secondary-button" style={{ fontSize: "0.875rem", padding: "9px 16px" }}>
              ← {t.common.brandName}
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}


