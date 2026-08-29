"use client";

import { useI18n } from "@/lib/i18n";

export interface EntryScreenProps {
  onBegin: () => void;
  onViewCase: () => void;
  busy: boolean;
}

export function EntryScreen({ onBegin, onViewCase, busy }: EntryScreenProps) {
  const { t } = useI18n();

  return (
    <div className="entry-container">
      {/* Editorial Split Hero Section */}
      <section className="entry-hero-split">
        {/* Left Column: Context, Editorial Headline & Primary CTA */}
        <div className="hero-copy-col">
          <div className="hero-context-badge">
            <span className="context-dot" aria-hidden="true" />
            <span>{t.entry.contextBadge}</span>
          </div>

          <h1 className="entry-headline" style={{ whiteSpace: "pre-line" }}>
            {t.entry.headline}
          </h1>

          <p className="entry-lead">
            {t.entry.lead}
          </p>

          <div className="india-context-strip" aria-label="Supported Indian cyber incident channels">
            <span className="strip-label">{t.entry.commonScenariosLabel}</span>
            <div className="strip-chips">
              {t.entry.contextChips.map((chip) => (
                <span key={chip} className="context-chip">
                  {chip}
                </span>
              ))}
            </div>
          </div>

          <div className="entry-cta-section">
            <button
              type="button"
              className="primary-button hero-primary-btn"
              onClick={onBegin}
              id="entry-begin"
            >
              {t.entry.primaryCta} <span aria-hidden="true">→</span>
            </button>

            <button
              type="button"
              className="secondary-button hero-secondary-btn"
              onClick={onViewCase}
              disabled={busy}
              id="entry-demo"
            >
              {busy ? t.entry.secondaryCtaLoading : (
                <>
                  {t.entry.secondaryCta} <span aria-hidden="true">↗</span>
                </>
              )}
            </button>
          </div>

          <div className="hero-civic-note">
            <span className="civic-note-icon">i</span>
            <span>{t.entry.civicNote}</span>
          </div>
        </div>

        {/* Right Column: Realistic Investigative Case Sheet / Incident Dossier Preview */}
        <div className="hero-dossier-col" aria-label="Incident Dossier Record Preview">
          <div className="hero-case-sheet">
            <div className="case-sheet-topbar">
              <div className="case-sheet-title-group">
                <span className="case-sheet-doc-type">{t.entry.dossierPreview.docType}</span>
                <span className="case-sheet-ref">CYB-2026-84A21</span>
              </div>
              <span className="case-sheet-status-pill">{t.entry.dossierPreview.status}</span>
            </div>

            <div className="case-sheet-grid">
              <div className="case-sheet-row">
                <span className="case-field-label">{t.entry.dossierPreview.incidentTypeLabel}</span>
                <span className="case-field-val">{t.entry.dossierPreview.incidentTypeValue}</span>
              </div>

              <div className="case-sheet-row highlight-loss">
                <span className="case-field-label">{t.entry.dossierPreview.lossLabel}</span>
                <span className="case-field-val amount-val">
                  <span className="curr">₹</span>35,000<span className="dec">.00</span>
                </span>
              </div>

              <div className="case-sheet-row-pair">
                <div className="case-sheet-half">
                  <span className="case-field-label">{t.entry.dossierPreview.timeLabel}</span>
                  <span className="case-field-val font-mono">{t.entry.dossierPreview.timeValue}</span>
                </div>
                <div className="case-sheet-half">
                  <span className="case-field-label">{t.entry.dossierPreview.channelLabel}</span>
                  <span className="case-field-val">{t.entry.dossierPreview.channelValue}</span>
                </div>
              </div>

              <div className="case-sheet-row">
                <span className="case-field-label">{t.entry.dossierPreview.utrLabel}</span>
                <div className="case-field-val-with-tag">
                  <span className="font-mono">TXN-DEMO-84A21</span>
                  <span className="badge-verified">{t.entry.dossierPreview.badgeVerified}</span>
                </div>
              </div>

              <div className="case-sheet-row">
                <span className="case-field-label">{t.entry.dossierPreview.suspectLabel}</span>
                <div className="case-field-val-with-tag">
                  <span className="font-mono">+91 98201 44819</span>
                  <span className="badge-citizen">{t.entry.dossierPreview.badgeCitizen}</span>
                </div>
              </div>

              <div className="case-sheet-row-pair">
                <div className="case-sheet-half">
                  <span className="case-field-label">{t.entry.dossierPreview.evidenceLabel}</span>
                  <span className="case-field-val font-mono">{t.entry.dossierPreview.evidenceValue}</span>
                </div>
                <div className="case-sheet-half">
                  <span className="case-field-label">{t.entry.dossierPreview.verificationLabel}</span>
                  <span className="case-field-val">{t.entry.dossierPreview.verificationValue}</span>
                </div>
              </div>

              <div className="case-sheet-action-box">
                <span className="case-field-label">{t.entry.dossierPreview.actionTriageLabel}</span>
                <div className="action-tag-group">
                  <span className="action-tag-urgent">{t.entry.dossierPreview.action1930}</span>
                  <span className="action-tag">{t.entry.dossierPreview.actionBank}</span>
                  <span className="action-tag">{t.entry.dossierPreview.actionPreserve}</span>
                </div>
              </div>
            </div>

            <div className="case-sheet-footer">
              <span>{t.entry.dossierPreview.footerNote}</span>
              <span className="font-mono">{t.entry.dossierPreview.auditHash}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5-Stage Transformation Pipeline */}
      <section className="product-pipeline-section" aria-label="Five-stage incident transformation pipeline">
        <div className="section-header">
          <span className="eyebrow">{t.entry.pipeline.eyebrow}</span>
          <h2 className="section-title font-serif">{t.entry.pipeline.title}</h2>
          <p className="section-desc">
            {t.entry.pipeline.desc}
          </p>
        </div>

        <div className="pipeline-track">
          {t.entry.pipeline.stages.map((stage, idx) => (
            <div className={`pipeline-step-item ${idx === 4 ? "terminal-step" : ""}`} key={stage.num}>
              <div className="step-header-row">
                <span className="step-number">{stage.num}</span>
                <span className="step-action-name">{stage.step}</span>
              </div>
              <span className="step-label-title">{stage.label}</span>
              <p className="step-explanation">{stage.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Case Anatomy Section */}
      <section className="case-anatomy-section" aria-label="Fictional case walkthrough anatomy">
        <div className="section-header">
          <span className="eyebrow">{t.entry.anatomy.eyebrow}</span>
          <h2 className="section-title font-serif">{t.entry.anatomy.title}</h2>
          <p className="section-desc">
            {t.entry.anatomy.desc}
          </p>
        </div>

        <div className="case-anatomy-sheet">
          <div className="anatomy-sheet-header">
            <div>
              <span className="anatomy-case-id font-mono">{t.entry.anatomy.caseId}</span>
              <h3 className="anatomy-headline">{t.entry.anatomy.headline}</h3>
            </div>
            <div className="anatomy-loss-callout">
              <span className="loss-label">{t.entry.anatomy.lossLabel}</span>
              <span className="loss-amount">₹35,000.00</span>
            </div>
          </div>

          <div className="anatomy-body-grid">
            {/* Column 1: Incident & Evidence */}
            <div className="anatomy-col">
              <div className="anatomy-block">
                <span className="anatomy-block-title">{t.entry.anatomy.block1Title}</span>
                <p className="anatomy-narrative">
                  {t.entry.anatomy.block1Desc}
                </p>
              </div>

              <div className="anatomy-block">
                <span className="anatomy-block-title">{t.entry.anatomy.block2Title}</span>
                <ul className="anatomy-list">
                  {t.entry.anatomy.block2Items.map((item, idx) => (
                    <li key={idx}><span className="check">✓</span> {item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Column 2: Verified Facts & Timeline */}
            <div className="anatomy-col">
              <div className="anatomy-block">
                <span className="anatomy-block-title">{t.entry.anatomy.block3Title}</span>
                <ul className="anatomy-list facts-list">
                  <li><span className="check">✓</span> <strong>{t.entry.anatomy.block3Items.amountLabel}</strong> ₹35,000.00</li>
                  <li><span className="check">✓</span> <strong>{t.entry.anatomy.block3Items.utrLabel}</strong> TXN-DEMO-84A21</li>
                  <li><span className="check">✓</span> <strong>{t.entry.anatomy.block3Items.timeLabel}</strong> 14:32 IST</li>
                  <li><span className="check">✓</span> <strong>{t.entry.anatomy.block3Items.channelLabel}</strong> {t.entry.anatomy.block3Items.channelValue}</li>
                </ul>
              </div>

              <div className="anatomy-block">
                <span className="anatomy-block-title">{t.entry.anatomy.block4Title}</span>
                <div className="anatomy-timeline-events">
                  {t.entry.anatomy.timelineEvents.map((evt, idx) => (
                    <div className="timeline-row" key={idx}>
                      <span className="t-time font-mono">{evt.time}</span>
                      <span className="t-desc">{evt.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="anatomy-sheet-actions">
            <span className="actions-header">{t.entry.anatomy.block5Title}</span>
            <div className="actions-badges-row">
              <span className="action-pill-urgent">{t.entry.anatomy.actions[0]}</span>
              <span className="action-pill">{t.entry.anatomy.actions[1]}</span>
              <span className="action-pill">{t.entry.anatomy.actions[2]}</span>
            </div>
          </div>
        </div>
      </section>

      {/* AI Boundary Demonstration: AI Assists. Citizens Decide. */}
      <section className="ai-boundary-section" aria-label="AI boundary and citizen verification model">
        <div className="section-header">
          <span className="eyebrow">{t.entry.aiBoundary.eyebrow}</span>
          <h2 className="section-title font-serif">{t.entry.aiBoundary.title}</h2>
          <p className="section-desc">
            {t.entry.aiBoundary.desc}
          </p>
        </div>

        <div className="ai-boundary-flow">
          <div className="flow-step">
            <div className="flow-step-header">
              <span className="flow-step-num">01</span>
              <span className="flow-step-tag ai-tag">{t.entry.aiBoundary.step1Tag}</span>
            </div>
            <div className="flow-card ai-suggestion-card">
              <span className="flow-card-label">{t.entry.aiBoundary.step1Label}</span>
              <strong className="flow-card-val font-mono">{t.entry.aiBoundary.step1Val}</strong>
              <span className="flow-card-meta">{t.entry.aiBoundary.step1Meta}</span>
            </div>
          </div>

          <div className="flow-arrow" aria-hidden="true">→</div>

          <div className="flow-step">
            <div className="flow-step-header">
              <span className="flow-step-num">02</span>
              <span className="flow-step-tag citizen-tag">{t.entry.aiBoundary.step2Tag}</span>
            </div>
            <div className="flow-card citizen-review-card">
              <span className="flow-card-label">{t.entry.aiBoundary.step2Label}</span>
              <div className="demo-review-buttons">
                <span className="btn-demo-accept">{t.entry.aiBoundary.btnAccept}</span>
                <span className="btn-demo-edit">{t.entry.aiBoundary.btnEdit}</span>
                <span className="btn-demo-reject">{t.entry.aiBoundary.btnReject}</span>
              </div>
              <span className="flow-card-meta">{t.entry.aiBoundary.step2Meta}</span>
            </div>
          </div>

          <div className="flow-arrow" aria-hidden="true">→</div>

          <div className="flow-step">
            <div className="flow-step-header">
              <span className="flow-step-num">03</span>
              <span className="flow-step-tag fact-tag">{t.entry.aiBoundary.step3Tag}</span>
            </div>
            <div className="flow-card verified-fact-card">
              <span className="flow-card-label">{t.entry.aiBoundary.step3Label}</span>
              <strong className="flow-card-val font-mono">{t.entry.aiBoundary.step3Val}</strong>
              <span className="flow-card-meta verified-meta">{t.entry.aiBoundary.step3Meta}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Golden Hour Urgency Block (Strictly Restrained Crimson/Saffron) */}
      <aside className="golden-hour-block" role="complementary" aria-label="Urgent action reminder for cyber fraud victims">
        <div className="golden-hour-content">
          <div className="golden-hour-eyebrow-row">
            <span className="urgent-badge">{t.entry.goldenHour.urgentBadge}</span>
            <span className="golden-hour-eyebrow">{t.entry.goldenHour.eyebrow}</span>
          </div>

          <h2 className="golden-hour-title font-serif">{t.entry.goldenHour.title}</h2>

          <div className="golden-hour-steps-grid">
            <div className="golden-step">
              <span className="g-num font-mono">{t.entry.goldenHour.step1Num}</span>
              <div className="g-text">
                <strong>{t.entry.goldenHour.step1Title}</strong>
                <p>{t.entry.goldenHour.step1Desc}</p>
              </div>
            </div>

            <div className="golden-step">
              <span className="g-num font-mono">{t.entry.goldenHour.step2Num}</span>
              <div className="g-text">
                <strong>{t.entry.goldenHour.step2Title}</strong>
                <p>{t.entry.goldenHour.step2Desc}</p>
              </div>
            </div>

            <div className="golden-step">
              <span className="g-num font-mono">{t.entry.goldenHour.step3Num}</span>
              <div className="g-text">
                <strong>{t.entry.goldenHour.step3Title}</strong>
                <p>{t.entry.goldenHour.step3Desc}</p>
              </div>
            </div>
          </div>

          <div className="golden-hour-actions">
            <a href="tel:1930" className="golden-hour-cta" aria-label="Call 1930, National Cyber Crime Helpline">
              {t.entry.goldenHour.ctaCall}
            </a>
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="golden-hour-secondary"
            >
              {t.entry.goldenHour.ctaPortal} <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </aside>

      {/* What CyberDesk Is / Isn't Section */}
      <section className="civic-boundaries-section" aria-label="What CyberDesk helps with and platform boundaries">
        <div className="section-header">
          <span className="eyebrow">{t.entry.boundaries.eyebrow}</span>
          <h2 className="section-title font-serif">{t.entry.boundaries.title}</h2>
          <p className="section-desc">
            {t.entry.boundaries.desc}
          </p>
        </div>

        <div className="boundaries-grid">
          {/* Column 1: Helps you */}
          <div className="boundary-col boundary-helps">
            <div className="boundary-col-header">
              <span className="boundary-header-tag helps-tag">{t.entry.boundaries.helpsTag}</span>
            </div>
            <ul className="boundary-list">
              {t.entry.boundaries.helpsItems.map((item, idx) => (
                <li key={idx}>
                  <span className="b-check">✓</span> <strong>{item.title}</strong> {item.desc}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Does not */}
          <div className="boundary-col boundary-limits">
            <div className="boundary-col-header">
              <span className="boundary-header-tag limits-tag">{t.entry.boundaries.limitsTag}</span>
            </div>
            <ul className="boundary-list">
              {t.entry.boundaries.limitsItems.map((item, idx) => (
                <li key={idx}>
                  <span className="b-cross">×</span> <strong>{item.title}</strong> {item.desc}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Prototype Disclosure Card */}
      <div className="entry-disclosure-card">
        <span className="disclosure-shield" aria-hidden="true">i</span>
        <p className="entry-disclosure-text">
          {t.entry.disclosure}
        </p>
      </div>
    </div>
  );
}

