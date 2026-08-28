import Link from "next/link";
import { PublicNav } from "@/app/components/PublicNav";
import { PublicFooter } from "@/app/components/PublicFooter";

export const metadata = {
  title: "About CyberDesk — Citizen Cyber Incident Assistance",
  description: "Exploring how digital incidents in India can be understood, structured, and resolved with greater citizen clarity.",
};

export default function AboutPage() {
  const principles = [
    {
      title: "Radical Boundary Transparency",
      desc: "We never pretend to be a police department, bank, or government portal. CyberDesk is an independent prototype concept exploring better citizen experiences.",
    },
    {
      title: "Strict Provenance by Design",
      desc: "Information origin is always attributed. AI suggestions are clearly labeled and never masquerade as verified real-world facts.",
    },
    {
      title: "Built for Indian Digital Life",
      desc: "Centred around how incidents actually happen in India — UPI payments, WhatsApp conversations, banking SMS, and phone impersonation.",
    },
    {
      title: "Calm, Accessible Public-Service Design",
      desc: "Clean editorial layouts, high-contrast typography, and generous whitespace that reduce panic during high-stress situations.",
    },
  ];

  return (
    <div className="public-page">
      <PublicNav />

      <main id="main-content" className="public-content-container">
        <header className="page-hero">
          <span className="eyebrow">About the Project</span>
          <h1 className="page-title">The Information Problem in Cyber Incidents</h1>
          <p className="page-lead">
            When a person experiences online fraud in India, their biggest obstacle isn’t just financial loss — it’s overwhelming confusion and fragmented information.
          </p>
        </header>

        {/* Editorial Story Section */}
        <section className="about-story-section">
          <div className="about-story-grid">
            <div className="story-card">
              <span className="story-badge">The Citizen Reality</span>
              <h2>Adrenaline, panic, and scattered evidence</h2>
              <p>
                In the minutes after an unauthorized debit or deceptive call, victims are overwhelmed. They have a bank SMS with a transaction ID, a WhatsApp chat with a stranger, a suspicious link in their browser history, and a racing pulse.
              </p>
              <p>
                When they visit a police station or bank branch, explaining this chaotic sequence clearly is extremely difficult. Crucial evidence like UTR numbers, timestamps, and caller IDs are often lost or forgotten.
              </p>
            </div>

            <div className="story-card">
              <span className="story-badge">The Exploration</span>
              <h2>How CyberDesk bridges the gap</h2>
              <p>
                CyberDesk explores how intelligent, citizen-first design can help people transform fragmented pieces into a calm, coherent incident record.
              </p>
              <p>
                By providing plain-language questions, organizing candidate evidence fields, and drafting clear chronological summaries, CyberDesk helps ordinary citizens present verifiable facts to official responders.
              </p>
            </div>
          </div>
        </section>

        {/* Guiding Design Principles */}
        <section className="about-principles-section" aria-label="Core design principles">
          <div className="section-header">
            <span className="eyebrow">Design Principles</span>
            <h2 className="section-title">What guides CyberDesk</h2>
            <p className="section-desc">Principles borrowed from India’s Digital Public Infrastructure (DPI) and modern security design.</p>
          </div>

          <div className="principles-grid">
            {principles.map((item, idx) => (
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
            <h2>Explore the CyberDesk Prototype</h2>
            <p>Experience the prototype workflow from initial intake to structured incident tracking.</p>
            <div className="cta-callout-actions">
              <Link href="/" className="primary-button">
                Start an incident <span aria-hidden="true">→</span>
              </Link>
              <Link href="/how-it-works" className="secondary-button">
                See how it works <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
