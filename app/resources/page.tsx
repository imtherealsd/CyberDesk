"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { PublicNav } from "@/app/components/PublicNav";
import { PublicFooter } from "@/app/components/PublicFooter";

export default function ResourcesPage() {
  const { t } = useI18n();

  return (
    <div className="public-page">
      <PublicNav />

      <main id="main-content" className="public-content-container">
        <header className="page-hero">
          <span className="eyebrow">{t.resources.eyebrow}</span>
          <h1 className="page-title">{t.resources.title}</h1>
          <p className="page-lead">
            {t.resources.lead}
          </p>
        </header>

        {/* Emergency Helpline Banner */}
        <section className="emergency-quick-banner" aria-label="Emergency helpline">
          <div className="emergency-banner-content">
            <span className="emergency-badge">{t.footer.colUrgent}</span>
            <div>
              <strong>{t.footer.helplineTitle}</strong>
              <p>{t.footer.helplineSubtitle}</p>
            </div>
            <a href="tel:1930" className="primary-button emergency-call-btn">
              <span>{t.footer.tollFree}</span> <span aria-hidden="true">📞</span>
            </a>
          </div>
        </section>

        {/* Resource Categories Grid */}
        <section className="resource-categories-section" aria-label="Incident categories guide">
          <div className="resource-category-grid">
            {t.resources.categories.map((cat) => (
              <div className="resource-category-card" key={cat.id}>
                <div className="res-cat-header">
                  <span className="res-cat-badge">{cat.badge}</span>
                  <h2 className="res-cat-title">{cat.title}</h2>
                  <p className="res-cat-desc">{cat.desc}</p>
                </div>

                <div className="res-items-list">
                  {cat.items.map((item, i) => (
                    <div className="res-item" key={i}>
                      <strong className="res-item-title">{item.title}</strong>
                      <p className="res-item-action">{item.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="page-cta-callout">
          <div className="cta-callout-content">
            <h2>{t.about.ctaTitle}</h2>
            <p>{t.about.ctaDesc}</p>
            <div className="cta-callout-actions">
              <Link href="/" className="primary-button">
                {t.about.ctaPrimary} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}


