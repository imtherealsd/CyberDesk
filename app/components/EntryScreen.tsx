"use client";

import { en } from "@/lib/i18n/en";
import { SourceBadge } from "./SourceBadge";

export interface EntryScreenProps {
  onBegin: () => void;
  onViewCase: () => void;
  busy: boolean;
}

export function EntryScreen({ onBegin, onViewCase, busy }: EntryScreenProps) {
  const productStages = [
    {
      num: "01",
      title: "Understand",
      label: "Make sense of events",
      desc: "Turn confusing calls, messages, payment alerts and panic into a calm, structured summary.",
    },
    {
      num: "02",
      title: "Organise",
      label: "Structured evidence",
      desc: "Assemble screenshots, UPI reference numbers, SMS alerts and chats with clear source badges.",
    },
    {
      num: "03",
      title: "Follow",
      label: "Honest timeline",
      desc: "Order what happened chronologically without fabricating precision or fake timestamps.",
    },
    {
      num: "04",
      title: "Act",
      label: "Prepared next steps",
      desc: "Know what to do first — bank debit freeze, National Cyber Crime Helpline (1930), and official reporting.",
    },
  ];

  const indiaContextChips = [
    "UPI",
    "Banking",
    "WhatsApp",
    "SMS",
    "Cards",
    "Online shopping",
    "KYC",
    "Digital Arrest",
  ];

  const trustGuarantees = [
    {
      icon: "🤖",
      title: "AI suggestions are never facts",
      desc: "AI assists with reading confusing messages, but its outputs are always labeled as suggestions and require your explicit review.",
    },
    {
      icon: "✓",
      title: "You confirm what enters the record",
      desc: "Nothing is locked into your incident timeline or report without your review. You can edit, accept, or discard any detail at any time.",
    },
    {
      icon: "⚖️",
      title: "Clear civic boundaries",
      desc: "CyberDesk prepares and organises your information. It does not file official police FIRs or claim official government affiliation.",
    },
    {
      icon: "🔒",
      title: "Private & encrypted by design",
      desc: "Your authenticated workspaces and uploaded evidence are strictly protected with Row-Level Security and private storage.",
    },
  ];

  return (
    <div className="entry-container">
      {/* Editorial Hero Section */}
      <section className="entry-hero">
        <div className="hero-context-badge">
          <span className="context-dot" aria-hidden="true" />
          <span>Built around the way digital incidents happen in India</span>
        </div>

        <h1 className="entry-headline">
          Cyber incidents are confusing.<br />
          Getting organised shouldn’t be.
        </h1>

        <p className="entry-lead">
          Something went wrong online? CyberDesk helps citizens understand what happened, organise fragmented evidence, and identify useful next steps before approaching banks or authorities.
        </p>

        <div className="india-context-strip" aria-label="Supported Indian channels and scenarios">
          <span className="strip-label">Supported channels:</span>
          <div className="strip-chips">
            {indiaContextChips.map((chip) => (
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
            Start with what happened <span aria-hidden="true">→</span>
          </button>

          <button
            type="button"
            className="secondary-button hero-secondary-btn"
            onClick={onViewCase}
            disabled={busy}
            id="entry-demo"
          >
            {busy ? "Loading demo case…" : (
              <>
                See a demo case <span aria-hidden="true">↗</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Golden Hour Urgency Block */}
      <aside className="golden-hour-block" role="complementary" aria-label="Urgent action reminder for cyber fraud victims">
        <div className="golden-hour-icon" aria-hidden="true">⏱</div>
        <div className="golden-hour-content">
          <span className="golden-hour-eyebrow">Time-sensitive · Act immediately</span>
          <span className="golden-hour-title">Lost money to online fraud? Every minute matters.</span>
          <p className="golden-hour-desc">
            Indian banks can attempt to freeze unauthorised transactions within the first hour of reporting.
            Contact your bank and call the National Cyber Crime Helpline — do this before you organise your evidence.
          </p>
          <div className="golden-hour-actions">
            <a href="tel:1930" className="golden-hour-cta" aria-label="Call 1930, National Cyber Crime Helpline">
              📞 Call 1930 (Toll-free)
            </a>
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="golden-hour-secondary"
            >
              cybercrime.gov.in <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </aside>

      {/* Evidence Transformation Section */}
      <section className="transformation-section" aria-label="How CyberDesk transforms fragmented evidence into a clear dossier">
        <div className="section-header" style={{ marginBottom: 0 }}>
          <span className="eyebrow">Evidence Transformation</span>
          <h2 className="section-title">From chaotic evidence to a bank-ready record.</h2>
          <p className="section-desc">
            When cyber incidents happen, citizens are left with scattered payment alerts, chat screenshots, unknown phone numbers, and panic. CyberDesk structures these fragments into verifiable facts.
          </p>
        </div>

        <div className="transformation-grid">
          <div className="transformation-col">
            <div className="transformation-card-messy">
              <strong style={{ fontSize: "0.9rem", color: "var(--ink)" }}>Fragmented citizen artifacts</strong>
              <div className="messy-items-list">
                <span className="messy-item">📱 WhatsApp chat screenshots &amp; audio files</span>
                <span className="messy-item">💳 SMS debit alert with 12-digit UTR snippet</span>
                <span className="messy-item">📞 Unknown caller numbers &amp; impersonation claims</span>
                <span className="messy-item">🔗 Suspicious APK or phishing URL links</span>
              </div>
            </div>
          </div>

          <div className="transformation-arrow" aria-hidden="true">
            <span>CyberDesk Pipeline</span>
            →
          </div>

          <div className="transformation-col">
            <div className="transformation-card-structured">
              <strong style={{ fontSize: "0.9rem", color: "var(--verified-dark)" }}>Structured incident dossier</strong>
              <div className="structured-items-list">
                <span className="structured-item">✓ Confirmed UTR reference number</span>
                <span className="structured-item">✓ Timestamped event sequence &amp; channel tags</span>
                <span className="structured-item">✓ Explicit provenance badges (Citizen vs AI)</span>
                <span className="structured-item">✓ Printable dossier ready for bank or 1930</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Four-Stage Product Model Section */}
      <section className="product-model-section" aria-label="Four-stage product model">
        <div className="section-header">
          <span className="eyebrow">The CyberDesk Method</span>
          <h2 className="section-title">From a confusing incident to a clear record.</h2>
          <p className="section-desc">
            When an online incident occurs, people have scattered messages, SMS, links, and memories. CyberDesk brings these pieces together into one coherent case record.
          </p>
        </div>

        <div className="model-grid">
          {productStages.map((stage) => (
            <div className="stage-card" key={stage.num}>
              <span className="stage-num">{stage.num}</span>
              <span className="stage-label">{stage.label}</span>
              <strong className="stage-title">{stage.title}</strong>
              <p className="stage-desc">{stage.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Visual Representation of the Incident Record */}
      <section className="incident-record-preview-section" aria-label="Incident Record Preview">
        <div className="preview-card">
          <div className="preview-card-header">
            <div className="preview-header-meta">
              <span className="dossier-tag">Preview Incident Dossier</span>
              <span className="dossier-id">CYB-DEMO-84A21</span>
              <span className="preview-badge-status">Under review · Synthetic</span>
            </div>
            <div className="preview-provenance-tags">
              <SourceBadge source="citizen" />
              <SourceBadge source="ai" />
              <SourceBadge source="synthetic" />
            </div>
          </div>

          <div className="preview-card-body">
            <div className="preview-col">
              <span className="preview-field-label">Incident Classification</span>
              <strong className="preview-field-val">Bank Impersonation &amp; Fake KYC Link</strong>
              <p className="preview-field-sub">Caller claimed KYC expiry, sent link resulting in ₹35,000 debit alert.</p>
            </div>
            <div className="preview-col">
              <span className="preview-field-label">Verified Facts</span>
              <div className="preview-facts-list">
                <span>✓ Amount: ₹35,000 (Reported debit)</span>
                <span>✓ UTR: TXN-DEMO-84A21</span>
                <span>✓ Channel: WhatsApp / SMS</span>
              </div>
            </div>
            <div className="preview-col">
              <span className="preview-field-label">Official Next Step Guidance</span>
              <strong className="preview-action-val">Helpline 1930 &amp; Bank Freeze</strong>
              <p className="preview-field-sub">Notify bank immediately with transaction reference; report on cybercrime.gov.in.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5 Civic-Tech Trust Guarantees */}
      <section className="trust-guarantees-section" aria-label="Civic-tech trust principles">
        <div className="section-header">
          <span className="eyebrow">Trust &amp; Transparency</span>
          <h2 className="section-title">Built with citizen-first guarantees.</h2>
          <p className="section-desc">
            CyberDesk is designed to be a safe, honest, and reliable tool for people navigating high-stress cyber incidents.
          </p>
        </div>

        <div className="trust-guarantees-grid">
          {trustGuarantees.map((item) => (
            <div key={item.title} className="trust-guarantee-card">
              <span className="trust-card-icon" aria-hidden="true">{item.icon}</span>
              <h3 className="trust-card-title">{item.title}</h3>
              <p className="trust-card-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Prototype Disclosure Card */}
      <div className="entry-disclosure-card">
        <span className="disclosure-shield" aria-hidden="true">ℹ</span>
        <p className="entry-disclosure-text">
          {en.entry.disclosure}
        </p>
      </div>
    </div>
  );
}
