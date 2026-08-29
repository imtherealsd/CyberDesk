"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { PublicNav } from "@/app/components/PublicNav";
import { PublicFooter } from "@/app/components/PublicFooter";

export default function HowItWorksPage() {
  const { t } = useI18n();

  return (
    <div className="public-page">
      <PublicNav />

      <main id="main-content" className="public-content-container">
        <header className="page-hero">
          <span className="eyebrow">{t.howItWorks.eyebrow}</span>
          <h1 className="page-title">{t.howItWorks.title}</h1>
          <p className="page-lead">
            {t.howItWorks.lead}
          </p>
        </header>

        <section className="steps-flow-section" aria-label="Step by step methodology">
          {t.howItWorks.steps.map((step) => (
            <div className="flow-step-card" key={step.num}>
              <div className="flow-step-sidebar">
                <span className="flow-step-num font-mono">{step.num}</span>
                <span className="flow-step-line" aria-hidden="true" />
              </div>
              <div className="flow-step-main">
                <span className="flow-step-subtitle">{step.subtitle}</span>
                <h2 className="flow-step-title">{step.title}</h2>
                <p className="flow-step-body">{step.body}</p>
                <ul className="flow-step-features">
                  {step.details.map((detail, idx) => (
                    <li key={idx}>✓ {detail}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </section>

        {/* CTA Callout */}
        <section className="page-cta-callout">
          <div className="cta-callout-content">
            <h2>{t.howItWorks.ctaTitle}</h2>
            <p>{t.howItWorks.ctaDesc}</p>
            <div className="cta-callout-actions">
              <Link href="/" className="primary-button">
                {t.howItWorks.ctaButton} <span aria-hidden="true">→</span>
              </Link>
              <Link href="/safety" className="secondary-button">
                {t.footer.linkSafety} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}


