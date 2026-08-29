"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { PublicNav } from "@/app/components/PublicNav";
import { PublicFooter } from "@/app/components/PublicFooter";

export default function TermsPage() {
  const { t } = useI18n();

  return (
    <div className="public-page">
      <PublicNav />

      <main id="main-content" className="public-content-container">
        <header className="legal-page-hero">
          <span className="legal-page-eyebrow">{t.terms.eyebrow}</span>
          <h1 className="legal-page-title">{t.terms.title}</h1>
          <p className="legal-page-date">{t.terms.date}</p>
        </header>

        <div className="legal-content">
          <div className="legal-boundary-box">
            <h3>{t.terms.disclaimerTitle}</h3>
            <p>{t.terms.disclaimerDesc}</p>
          </div>

          <section className="legal-section">
            <h2>{t.terms.acceptTitle}</h2>
            <p>{t.terms.acceptDesc}</p>
          </section>

          <section className="legal-section">
            <h2>{t.terms.prototypeNatureTitle}</h2>
            <p>{t.terms.prototypeNatureDesc}</p>
          </section>

          <section className="legal-section">
            <h2>{t.terms.cannotDoTitle}</h2>
            <ul>
              {t.terms.cannotDoItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="legal-section">
            <h2>{t.terms.noWarrantiesTitle}</h2>
            <p>{t.terms.noWarrantiesDesc}</p>
          </section>

          <section className="legal-section">
            <h2>{t.terms.liabilityTitle}</h2>
            <p>{t.terms.liabilityDesc}</p>
          </section>

          <section className="legal-section">
            <h2>{t.footer.colUrgent}</h2>
            <p>
              {t.footer.helplineSubtitle}
            </p>
            <ul>
              <li>
                <strong>{t.footer.helplineTitle}:</strong>{" "}
                <a href="tel:1930" style={{ color: "var(--teal-dark)", fontWeight: 600 }}>1930</a>{" "}
                ({t.footer.tollFree})
              </li>
              <li>
                <strong>Official portal:</strong>{" "}
                <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: "var(--teal-dark)", textDecoration: "underline" }}>
                  cybercrime.gov.in
                </a>
              </li>
            </ul>
          </section>

          <div style={{ marginTop: "48px", paddingTop: "24px", borderTop: "1px solid var(--line)", display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/privacy" className="secondary-button" style={{ fontSize: "0.875rem", padding: "9px 16px" }}>
              {t.footer.linkPrivacy} →
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


