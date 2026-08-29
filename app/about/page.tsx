"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { PublicNav } from "@/app/components/PublicNav";
import { PublicFooter } from "@/app/components/PublicFooter";

export default function AboutPage() {
  const { t } = useI18n();

  return (
    <div className="public-page">
      <PublicNav />

      <main id="main-content" className="public-content-container">
        <header className="page-hero">
          <span className="eyebrow">{t.about.eyebrow}</span>
          <h1 className="page-title">{t.about.title}</h1>
          <p className="page-lead">
            {t.about.lead}
          </p>
        </header>

        {/* Editorial Story Section */}
        <section className="about-story-section">
          <div className="about-story-grid">
            <div className="story-card">
              <span className="story-badge">{t.about.citizenRealityBadge}</span>
              <h2>{t.about.citizenRealityTitle}</h2>
              <p>
                {t.about.citizenRealityP1}
              </p>
              <p>
                {t.about.citizenRealityP2}
              </p>
            </div>

            <div className="story-card">
              <span className="story-badge">{t.about.explorationBadge}</span>
              <h2>{t.about.explorationTitle}</h2>
              <p>
                {t.about.explorationP1}
              </p>
              <p>
                {t.about.explorationP2}
              </p>
            </div>
          </div>
        </section>

        {/* Guiding Design Principles */}
        <section className="about-principles-section" aria-label="Core design principles">
          <div className="section-header">
            <span className="eyebrow">{t.about.principlesEyebrow}</span>
            <h2 className="section-title">{t.about.principlesTitle}</h2>
            <p className="section-desc">{t.about.principlesDesc}</p>
          </div>

          <div className="principles-grid">
            {t.about.principles.map((item, idx) => (
              <div className="principle-card" key={idx}>
                <span className="principle-num">0{idx + 1}</span>
                <strong className="principle-title">{item.title}</strong>
                <p className="principle-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Official Reference & CTA */}
        <section className="page-cta-callout">
          <div className="cta-callout-content">
            <h2>{t.about.ctaTitle}</h2>
            <p>{t.about.ctaDesc}</p>
            <div className="cta-callout-actions">
              <Link href="/" className="primary-button">
                {t.about.ctaPrimary} <span aria-hidden="true">→</span>
              </Link>
              <Link href="/how-it-works" className="secondary-button">
                {t.about.ctaSecondary} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}


