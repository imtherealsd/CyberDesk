import Link from "next/link";
import { PublicNav } from "@/app/components/PublicNav";
import { PublicFooter } from "@/app/components/PublicFooter";

export const metadata = {
  title: "Privacy Policy — CyberDesk",
  description:
    "How CyberDesk handles your information, what data is collected, and your privacy rights as a user of this independent prototype.",
};

export default function PrivacyPage() {
  return (
    <div className="public-page">
      <PublicNav />

      <main id="main-content" className="public-content-container">
        <header className="legal-page-hero">
          <span className="legal-page-eyebrow">Legal &amp; Transparency</span>
          <h1 className="legal-page-title">Privacy Policy</h1>
          <p className="legal-page-date">Last updated: August 2026 · Version 0.1 (Alpha Prototype)</p>
        </header>

        <div className="legal-content">
          <div className="legal-boundary-box">
            <h3>Prototype Boundary</h3>
            <p>
              CyberDesk is an independent prototype and is not affiliated with the Government of India, state police,
              the Reserve Bank of India (RBI), the Indian Cyber Crime Coordination Centre (I4C), or any other
              official body. This privacy policy covers only the CyberDesk prototype.
            </p>
          </div>

          <section className="legal-section">
            <h2>What Information We Collect</h2>
            <p>
              <strong>In the public demo journey:</strong> CyberDesk does not collect personal information. All
              information entered during the synthetic demo journey (incident descriptions, uploaded files, and
              extracted fields) is fictional and for demonstration purposes only. No real personal data
              should be entered into the demo.
            </p>
            <p>
              <strong>In the authenticated workspace (alpha):</strong> If you create an account using
              the passwordless sign-in (magic link), we collect your email address via Supabase Auth. Case
              information, evidence metadata, and verified facts you enter are stored in a private, encrypted
              Supabase database and are accessible only to you and collaborators you explicitly add.
            </p>
            <p>
              <strong>We do not collect:</strong>
            </p>
            <ul>
              <li>Aadhaar, PAN, or any government identity documents</li>
              <li>Bank credentials, UPI PINs, OTPs, or card numbers</li>
              <li>Real police complaint or FIR numbers</li>
              <li>Payment information</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>How We Store Your Information</h2>
            <p>
              Authenticated user data is stored in Supabase (PostgreSQL) with Row-Level Security (RLS) policies
              that ensure your cases are only accessible by you. Evidence files are stored in a private,
              access-controlled Supabase Storage bucket. No public URLs are generated for your evidence.
            </p>
            <p>
              Demo/synthetic data uses a shared key and is not private. Do not enter real personal information
              during the demo journey.
            </p>
          </section>

          <section className="legal-section">
            <h2>AI Processing</h2>
            <p>
              CyberDesk uses OpenAI&apos;s API to interpret incident descriptions and extract candidate fields from
              evidence. This processing occurs server-side only. Your inputs may be processed by OpenAI subject
              to their{" "}
              <a
                href="https://openai.com/policies/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--teal-dark)", textDecoration: "underline" }}
              >
                privacy policy
              </a>
              .
            </p>
            <p>
              AI outputs are always labeled as suggestions and require your explicit confirmation before
              becoming verified facts. CyberDesk does not train AI models on your data.
            </p>
          </section>

          <section className="legal-section">
            <h2>Cookies &amp; Local Storage</h2>
            <p>
              CyberDesk uses <code>sessionStorage</code> to preserve your progress through the demo journey
              within a single browser session. This data is not sent to our servers and is cleared when you
              close your browser tab. We do not use advertising or tracking cookies.
            </p>
          </section>

          <section className="legal-section">
            <h2>Third-Party Services</h2>
            <ul>
              <li>
                <strong>Supabase</strong> — Authentication and database. See{" "}
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "var(--teal-dark)", textDecoration: "underline" }}>Supabase Privacy Policy</a>.
              </li>
              <li>
                <strong>OpenAI</strong> — AI interpretation and extraction. See{" "}
                <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: "var(--teal-dark)", textDecoration: "underline" }}>OpenAI Privacy Policy</a>.
              </li>
              <li>
                <strong>Google Fonts</strong> — Typography. Font loading may be subject to Google&apos;s privacy terms.
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>Your Rights</h2>
            <p>
              As this is an alpha prototype, formal data subject rights requests are handled manually.
              If you would like your account or data deleted, please contact us and we will process
              the request promptly.
            </p>
            <p>
              This prototype is not intended to be used for real citizen incidents until production
              controls (rate limiting, audit logging, data retention, and real-Auth adversarial testing)
              are in place.
            </p>
          </section>

          <section className="legal-section">
            <h2>Contact</h2>
            <p>
              For privacy concerns or data requests relating to this prototype, you can reach the
              project through the GitHub repository or contact information listed there.
            </p>
          </section>

          <div style={{ marginTop: "48px", paddingTop: "24px", borderTop: "1px solid var(--line)", display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/terms" className="secondary-button" style={{ fontSize: "0.875rem", padding: "9px 16px" }}>
              Terms of use →
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
