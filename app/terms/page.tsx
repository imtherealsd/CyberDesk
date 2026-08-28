import Link from "next/link";
import { PublicNav } from "@/app/components/PublicNav";
import { PublicFooter } from "@/app/components/PublicFooter";

export const metadata = {
  title: "Terms of Use — CyberDesk",
  description:
    "Terms and conditions for using the CyberDesk independent prototype for cyber incident organisation and preparation.",
};

export default function TermsPage() {
  return (
    <div className="public-page">
      <PublicNav />

      <main id="main-content" className="public-content-container">
        <header className="legal-page-hero">
          <span className="legal-page-eyebrow">Legal &amp; Transparency</span>
          <h1 className="legal-page-title">Terms of Use</h1>
          <p className="legal-page-date">Last updated: August 2026 · Version 0.1 (Alpha Prototype)</p>
        </header>

        <div className="legal-content">
          <div className="legal-boundary-box">
            <h3>Critical Prototype Disclaimer</h3>
            <p>
              CyberDesk is an independent prototype. It is not affiliated with the Government of India,
              state police, the Reserve Bank of India (RBI), CERT-In, the Indian Cyber Crime Coordination
              Centre (I4C), or any other official body. Using CyberDesk does not constitute filing an official
              complaint (FIR) or government report of any kind.
            </p>
          </div>

          <section className="legal-section">
            <h2>What CyberDesk Is</h2>
            <p>
              CyberDesk is a citizen-first software prototype that helps you understand what happened during
              a digital incident, organise your evidence, and prepare a clear summary you can use when
              speaking to your bank, official cybercrime helpline, or police.
            </p>
            <p>
              CyberDesk is designed to help with understanding and preparation — it is not a legal service,
              a government interface, or an investigative tool.
            </p>
          </section>

          <section className="legal-section">
            <h2>What CyberDesk Cannot Do</h2>
            <ul>
              <li>
                <strong>File official complaints:</strong> CyberDesk cannot file FIRs, cybercrime complaints,
                or police reports on your behalf. For official reporting, call <strong>1930</strong> or visit
                {" "}<strong>cybercrime.gov.in</strong>.
              </li>
              <li>
                <strong>Freeze accounts or reverse transactions:</strong> CyberDesk has no connection to banks,
                NPCI, or UPI systems. To report UPI fraud and request a freeze, contact your bank&apos;s fraud
                helpline immediately.
              </li>
              <li>
                <strong>Guarantee any legal outcome:</strong> CyberDesk does not provide legal advice.
                The incident summaries and dossiers it helps you create are organisational aids, not legal documents.
              </li>
              <li>
                <strong>Represent you to any authority:</strong> CyberDesk is a tool for personal use.
                It does not interact with banks, police, or government systems on your behalf.
              </li>
              <li>
                <strong>Verify real-world facts:</strong> AI interpretations are suggestions only and must
                be confirmed by you. All AI outputs are clearly labeled and are not legal facts.
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>Your Responsibility as a User</h2>
            <p>By using CyberDesk, you agree to:</p>
            <ul>
              <li>Not enter real government identity numbers (Aadhaar, PAN) into the demo journey</li>
              <li>Not share your OTPs, UPI PIN, card numbers, or banking credentials with anyone, including CyberDesk</li>
              <li>Not use CyberDesk as a substitute for official complaint filing or legal advice</li>
              <li>Report suspected cybercrime to official channels (1930, cybercrime.gov.in, local police)</li>
              <li>Not attempt to reverse-engineer, misuse, or attack the prototype systems</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>Alpha Prototype Status</h2>
            <p>
              CyberDesk is in active development as a public interest prototype. Features, interfaces, and
              data structures may change without notice. The prototype is provided <em>as-is</em> for
              exploration and citizen experience research.
            </p>
            <p>
              CyberDesk makes no warranties, express or implied, regarding the accuracy, completeness,
              or fitness for any particular purpose of its outputs. Use at your own discretion, and always
              seek official channels for time-sensitive incidents.
            </p>
          </section>

          <section className="legal-section">
            <h2>Official Indian Cybercrime Reporting</h2>
            <p>
              For real cybercrime incidents, please use these official channels immediately:
            </p>
            <ul>
              <li>
                <strong>National Cyber Crime Helpline:</strong>{" "}
                <a href="tel:1930" style={{ color: "var(--teal-dark)", fontWeight: 600 }}>1930</a>{" "}
                (available 24/7, toll-free)
              </li>
              <li>
                <strong>Online complaint portal:</strong>{" "}
                <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: "var(--teal-dark)", textDecoration: "underline" }}>
                  cybercrime.gov.in
                </a>
              </li>
              <li>
                <strong>For financial fraud:</strong> Contact your bank&apos;s fraud helpline immediately to request
                a transaction hold.
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>Intellectual Property</h2>
            <p>
              The CyberDesk prototype concept, design, and code are the property of the project creators.
              The India-first citizen UX approach and design system are original works created for this prototype.
              Do not reproduce or claim the design as your own without permission.
            </p>
          </section>

          <section className="legal-section">
            <h2>Changes to These Terms</h2>
            <p>
              As CyberDesk evolves from prototype to a public-interest product, these terms will be updated
              to reflect new capabilities, data handling, and legal requirements. The &ldquo;Last updated&rdquo; date
              at the top of this page will reflect when changes were made.
            </p>
          </section>

          <div style={{ marginTop: "48px", paddingTop: "24px", borderTop: "1px solid var(--line)", display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/privacy" className="secondary-button" style={{ fontSize: "0.875rem", padding: "9px 16px" }}>
              Privacy policy →
            </Link>
            <Link href="/safety" className="secondary-button" style={{ fontSize: "0.875rem", padding: "9px 16px" }}>
              Safety &amp; privacy →
            </Link>
            <Link href="/" className="secondary-button" style={{ fontSize: "0.875rem", padding: "9px 16px" }}>
              ← Return home
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
