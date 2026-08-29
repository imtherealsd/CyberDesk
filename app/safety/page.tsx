"use client";

import { useI18n } from "@/lib/i18n";
import { PublicNav } from "@/app/components/PublicNav";
import { PublicFooter } from "@/app/components/PublicFooter";

export default function SafetyPage() {
  const { t } = useI18n();

  return (
    <div className="public-page">
      <PublicNav />

      <main id="main-content" className="public-content-container">
        <header className="page-hero">
          <span className="eyebrow">{t.safety.eyebrow}</span>
          <h1 className="page-title">{t.safety.title}</h1>
          <p className="page-lead">
            {t.safety.lead}
          </p>
        </header>

        {/* What Never to Share Card */}
        <section className="safety-warning-section" aria-label="Critical security reminders">
          <div className="safety-warning-card">
            <div className="warning-header">
              <span className="warning-icon" aria-hidden="true">🛡️</span>
              <div>
                <h2>{t.safety.warningTitle}</h2>
                <p>{t.safety.warningDesc}</p>
              </div>
            </div>
            <div className="warning-grid">
              {t.safety.neverShareItems.map((item, index) => (
                <div className="warning-item" key={index}>
                  <strong>✕ {item.title}</strong>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Clear Boundaries: Can vs Cannot */}
        <section className="boundaries-section" aria-label="Platform capabilities and boundaries">
          <div className="section-header">
            <span className="eyebrow">{t.safety.boundariesEyebrow}</span>
            <h2 className="section-title">{t.safety.boundariesTitle}</h2>
            <p className="section-desc">{t.safety.boundariesDesc}</p>
          </div>

          <div className="boundaries-grid">
            <div className="boundary-card boundary-can">
              <span className="boundary-pill pill-can">{t.safety.canDoTitle}</span>
              <ul className="boundary-list">
                {t.safety.canDoItems.map((item, idx) => (
                  <li key={idx}>
                    <span className="check-icon" aria-hidden="true">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="boundary-card boundary-cannot">
              <span className="boundary-pill pill-cannot">{t.safety.cannotDoTitle}</span>
              <ul className="boundary-list">
                {t.safety.cannotDoItems.map((item, idx) => (
                  <li key={idx}>
                    <span className="cross-icon" aria-hidden="true">✕</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Official Reporting Card */}
        <section className="official-reporting-section" aria-label="Official government helplines">
          <div className="official-reporting-card">
            <div className="official-reporting-info">
              <span className="eyebrow">{t.footer.colUrgent}</span>
              <h2>{t.footer.helplineTitle}</h2>
              <p>
                {t.footer.helplineSubtitle}
              </p>
            </div>
            <div className="official-reporting-actions">
              <a href="tel:1930" className="safety-helpline-link large-helpline-btn">
                <span className="phone-icon" aria-hidden="true">📞</span>
                <div>
                  <strong>{t.footer.tollFree}</strong>
                  <small>24x7 Toll-Free</small>
                </div>
              </a>
              <a
                href="https://cybercrime.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="secondary-button"
              >
                cybercrime.gov.in <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}


