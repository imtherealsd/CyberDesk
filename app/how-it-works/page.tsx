import Link from "next/link";
import { PublicNav } from "@/app/components/PublicNav";
import { PublicFooter } from "@/app/components/PublicFooter";

export const metadata = {
  title: "How CyberDesk Works — Citizen Cyber Incident Assistance",
  description: "Learn how CyberDesk helps citizens turn confusing cyber incidents into structured, verifiable records.",
};

export default function HowItWorksPage() {
  const steps = [
    {
      num: "01",
      title: "Understand what happened",
      subtitle: "Plain-language incident intake",
      body: "You do not need to know cybercrime laws or legal classifications. Tell the story in your own words, select simple situation categories (like 'Money was taken' or 'Someone contacted me'), and CyberDesk helps identify the probable incident type, method, and urgency.",
      details: [
        "No complex legal jargon required",
        "Deterministic or AI-assisted suggestion clearly labeled",
        "Full citizen control to edit and correct any detail",
      ],
    },
    {
      num: "02",
      title: "Organise the evidence that matters",
      subtitle: "Incident record & provenance tracking",
      body: "Fragmented screenshots, SMS alerts, UPI transaction references, and WhatsApp messages are structured into verifiable evidence fields. Each detail clearly displays its provenance — whether you reported it, an AI suggested it, or it was provided as demo data.",
      details: [
        "Categorized fields: Payment, Conversation, Contact, Screenshot",
        "Field importance hints explain why each detail matters",
        "AI suggestions are never presented as verified facts",
      ],
    },
    {
      num: "03",
      title: "Follow an honest timeline",
      subtitle: "Chronological sequence without fake precision",
      body: "CyberDesk orders the chain of events into a human-readable timeline. We do not invent exact timestamps when they are not known; instead, events are marked as 'Reported time', 'Approximate time', or 'Synthetic demo'.",
      details: [
        "Human-readable event progression",
        "Inline correction of event titles and details",
        "Clear visual distinction between citizen facts and demo data",
      ],
    },
    {
      num: "04",
      title: "Prepare next steps & official reporting",
      subtitle: "Actionable guidance and helpline references",
      body: "Know exactly what immediate actions to take — such as requesting a bank transaction freeze with your UTR reference, dialing the 1930 National Cyber Crime Helpline, or filing an official complaint on cybercrime.gov.in.",
      details: [
        "Immediate steps prioritized by urgency",
        "Direct access to official 1930 Helpline and portal links",
        "Clear explanation of prototype boundaries",
      ],
    },
  ];

  return (
    <div className="public-page">
      <PublicNav />

      <main id="main-content" className="public-content-container">
        <header className="page-hero">
          <span className="eyebrow">Product Guide</span>
          <h1 className="page-title">How CyberDesk Works</h1>
          <p className="page-lead">
            A structured, step-by-step approach to turning a confusing online incident into a clear, organised record ready for banks and authorities.
          </p>
        </header>

        <section className="steps-flow-section" aria-label="Step by step methodology">
          {steps.map((step) => (
            <div className="flow-step-card" key={step.num}>
              <div className="flow-step-sidebar">
                <span className="flow-step-num">{step.num}</span>
                <span className="flow-step-line" aria-hidden="true" />
              </div>
              <div className="flow-step-main">
                <span className="flow-step-subtitle">{step.subtitle}</span>
                <h2 className="flow-step-title">{step.title}</h2>
                <p className="flow-step-body">{step.body}</p>
                <ul className="flow-step-features">
                  {step.details.map((detail, idx) => (
                    <li key={idx}>✓ {detail}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </section>

        {/* CTA Callout */}
        <section className="page-cta-callout">
          <div className="cta-callout-content">
            <h2>Ready to experience the prototype?</h2>
            <p>Walk through a realistic synthetic incident scenario to see how CyberDesk organises evidence and next steps.</p>
            <div className="cta-callout-actions">
              <Link href="/" className="primary-button">
                Start an incident <span aria-hidden="true">→</span>
              </Link>
              <Link href="/safety" className="secondary-button">
                Read Safety & Privacy <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
