import Link from "next/link";
import { PublicNav } from "@/app/components/PublicNav";
import { PublicFooter } from "@/app/components/PublicFooter";

export const metadata = {
  title: "Citizen Cyber Resources & Guidance — CyberDesk",
  description: "Situation-based emergency resources for UPI fraud, bank impersonation, WhatsApp takeovers, and digital arrest scams in India.",
};

export default function ResourcesPage() {
  const resourceCategories = [
    {
      id: "financial",
      badge: "Financial Fraud",
      title: "UPI, Banking & Payment Fraud",
      desc: "Immediate steps when money has been debited without authorization or via fake payment links.",
      items: [
        {
          title: "Unauthorized UPI Debit",
          action: "Locate the 12-digit UTR number in your UPI app immediately. Call your bank’s 24/7 fraud helpline and dial 1930.",
        },
        {
          title: "Fake KYC Expiry SMS / Call",
          action: "Never open links sent via SMS claiming your PAN or bank KYC is expiring. Banks never send APK files or third-party links.",
        },
        {
          title: "Investment & Telegram Trading Scams",
          action: "Stop sending funds immediately. Take screenshots of all group chats, admin numbers, and recipient bank account details.",
        },
      ],
    },
    {
      id: "account",
      badge: "Account & Identity",
      title: "Account Takeover & Identity Compromise",
      desc: "Actions to regain control when social media, WhatsApp, or email accounts are hijacked.",
      items: [
        {
          title: "WhatsApp Account Takeover",
          action: "Reinstall WhatsApp, enter your phone number, and verify with SMS OTP. Set up Two-Step Verification with a custom PIN.",
        },
        {
          title: "Sudden Loss of Mobile Network (SIM Swap)",
          action: "If your phone suddenly loses signal and you haven’t requested a SIM change, contact your telecom operator immediately.",
        },
        {
          title: "Compromised Email Password",
          action: "Change your master email password immediately, enable two-factor authentication, and check email forwarding rules.",
        },
      ],
    },
    {
      id: "messaging",
      badge: "Messaging & Scams",
      title: "Messaging, SMS & Fake Helpline Scams",
      desc: "How to identify common deceptive messaging patterns across India.",
      items: [
        {
          title: "Fake Customer Care on Google Search",
          action: "Search engines often list fraudulent numbers for airlines, courier firms, and banks. Always use the verified app.",
        },
        {
          title: "Part-Time Job / Daily Task Scams",
          action: "Offers paying ₹2,000–₹5,000 for liking videos or writing reviews are advance-fee scams. Never pay 'security deposits'.",
        },
        {
          title: "Electricity Bill Disconnection SMS",
          action: "State electricity boards never send SMS from personal 10-digit mobile numbers threatening immediate disconnection.",
        },
      ],
    },
    {
      id: "urgent",
      badge: "Urgent Response",
      title: "Digital Arrest & High-Pressure Extortion",
      desc: "What to do if someone claims to be police, customs, or CBI on a video call.",
      items: [
        {
          title: "Recognize 'Digital Arrest' Extortion",
          action: "Indian law enforcement agencies NEVER arrest citizens over Skype or WhatsApp video calls, nor do they demand money transfers.",
        },
        {
          title: "Disconnect Immediately",
          action: "Hang up the call immediately. Do not stay on video. Contact your local police station or dial 1930.",
        },
        {
          title: "The Golden Hour Window",
          action: "For financial fraud, reporting to 1930 within 2–3 hours provides the highest likelihood of blocking funds in beneficiary accounts.",
        },
      ],
    },
  ];

  return (
    <div className="public-page">
      <PublicNav />

      <main id="main-content" className="public-content-container">
        <header className="page-hero">
          <span className="eyebrow">Citizen Knowledge Base</span>
          <h1 className="page-title">Resources & Guidance</h1>
          <p className="page-lead">
            Situation-based guidance for common cyber incidents occurring in India. Learn what immediate actions to take for each situation.
          </p>
        </header>

        {/* Emergency Helpline Banner */}
        <section className="emergency-quick-banner" aria-label="Emergency helpline">
          <div className="emergency-banner-content">
            <span className="emergency-badge">Immediate Action</span>
            <div>
              <strong>Reporting financial cyber fraud in India?</strong>
              <p>Call the National Cyber Crime Helpline at <strong>1930</strong> or file a report at <strong>cybercrime.gov.in</strong>.</p>
            </div>
            <a href="tel:1930" className="primary-button emergency-call-btn">
              <span>Call 1930</span> <span aria-hidden="true">📞</span>
            </a>
          </div>
        </section>

        {/* Resource Categories Grid */}
        <section className="resource-categories-section" aria-label="Incident categories guide">
          <div className="resource-category-grid">
            {resourceCategories.map((cat) => (
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
            <h2>Need to organise your own incident?</h2>
            <p>Use CyberDesk to structure your facts, timestamps, and evidence into a clean incident dossier.</p>
            <div className="cta-callout-actions">
              <Link href="/" className="primary-button">
                Start an incident <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
