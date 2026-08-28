import Link from "next/link";
import { PublicNav } from "@/app/components/PublicNav";
import { PublicFooter } from "@/app/components/PublicFooter";

export const metadata = {
  title: "Safety & Privacy — CyberDesk Citizen Cyber Assistance",
  description: "Learn about CyberDesk's privacy-by-design standards, what secrets to never share, and official reporting boundaries.",
};

export default function SafetyPage() {
  const neverShareItems = [
    { title: "One-Time Passwords (OTPs)", desc: "Never share SMS or WhatsApp OTPs with anyone, including callers claiming to be from banks or police." },
    { title: "UPI PINs & ATM PINs", desc: "You only enter a UPI PIN to SEND money, never to receive a refund or payment." },
    { title: "Card Details & CVV", desc: "Never enter your 16-digit card number, expiry, or 3-digit CVV on unverified links or forms." },
    { title: "Remote Access Apps", desc: "Never install apps like AnyDesk, TeamViewer, or QuickSupport requested by unknown callers." },
    { title: "Aadhaar / Identity Scans", desc: "Do not upload original Aadhaar, PAN, or passport documents to unofficial websites or chat groups." },
  ];

  const canDo = [
    "Help you make sense of confusing messages, calls, and payment alerts.",
    "Structure your screenshots, transaction references (UTR), and chats into an organised incident record.",
    "Attribute the provenance of each fact (Citizen-provided vs. AI suggestion vs. Demo).",
    "Guide you with prioritized immediate actions (contacting your bank, 1930 Helpline).",
  ];

  const cannotDo = [
    "CyberDesk cannot freeze bank accounts or reverse UPI transactions.",
    "CyberDesk cannot file an official police complaint or FIR on your behalf.",
    "CyberDesk is not affiliated with the Government of India, state police, RBI, or I4C.",
    "CyberDesk cannot guarantee the recovery of stolen funds or criminal investigation outcomes.",
  ];

  return (
    <div className="public-page">
      <PublicNav />

      <main id="main-content" className="public-content-container">
        <header className="page-hero">
          <span className="eyebrow">Trust & Security Standards</span>
          <h1 className="page-title">Safety & Privacy</h1>
          <p className="page-lead">
            CyberDesk is designed with strict privacy boundaries. Understand how your information is handled and what secrets you must never share online.
          </p>
        </header>

        {/* What Never to Share Card */}
        <section className="safety-warning-section" aria-label="Critical security reminders">
          <div className="safety-warning-card">
            <div className="warning-header">
              <span className="warning-icon" aria-hidden="true">🛡️</span>
              <div>
                <h2>What you must NEVER share with anyone</h2>
                <p>No legitimate bank official, police officer, or CyberDesk prototype will ever ask you for these details.</p>
              </div>
            </div>
            <div className="warning-grid">
              {neverShareItems.map((item, index) => (
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
            <span className="eyebrow">Clear Product Boundaries</span>
            <h2 className="section-title">What CyberDesk can and cannot do</h2>
            <p className="section-desc">We believe in radical honesty about the capabilities of citizen assistance prototypes.</p>
          </div>

          <div className="boundaries-grid">
            <div className="boundary-card boundary-can">
              <span className="boundary-pill pill-can">What CyberDesk can do</span>
              <ul className="boundary-list">
                {canDo.map((item, idx) => (
                  <li key={idx}>
                    <span className="check-icon" aria-hidden="true">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="boundary-card boundary-cannot">
              <span className="boundary-pill pill-cannot">What CyberDesk cannot do</span>
              <ul className="boundary-list">
                {cannotDo.map((item, idx) => (
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
              <span className="eyebrow">Official Government Resource</span>
              <h2>National Cyber Crime Reporting Portal</h2>
              <p>
                To file an official complaint that can be investigated by state police authorities, please use the official Government of India portal or call the toll-free helpline.
              </p>
            </div>
            <div className="official-reporting-actions">
              <a href="tel:1930" className="safety-helpline-link large-helpline-btn">
                <span className="phone-icon" aria-hidden="true">📞</span>
                <div>
                  <strong>Call 1930</strong>
                  <small>National Cyber Helpline (24x7 Toll-free)</small>
                </div>
              </a>
              <a
                href="https://cybercrime.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="secondary-button"
              >
                Open cybercrime.gov.in <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
