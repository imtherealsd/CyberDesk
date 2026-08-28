# CyberDesk
## Product Context & North-Star Specification

> **Working identity:** CyberDesk  
> **Positioning:** Citizen Cyber Incident Assistance  
> **Core promise:** *Understand what happened. Know what to do next.*

**Document status:** Foundation / v1.0  
**Audience:** Product, design, engineering, AI, QA, hackathon reviewers  
**Source of truth:** This document set governs the prototype unless an explicit decision record supersedes it.

---

## 1. Executive Summary

CyberDesk is an independent, browser-based citizen assistance experience for people dealing with cyber incidents in India.

It is **not** a replacement for the Government of India's National Cyber Crime Reporting Portal (NCRP), and it must never present itself as one.

The product addresses a specific mismatch:

> A citizen experiences a cyber incident as a messy, stressful sequence of calls, messages, links, screenshots and transactions; a formal reporting process needs structured, accurate information.

CyberDesk bridges that gap.

It helps a citizen move from:

**confusion → understanding → immediate next steps → evidence → verified facts → timeline → complaint draft → mock submission → status understanding**

The product's defining principle is:

> **AI extracts and organizes. The citizen verifies. Deterministic software controls the system.**

---

## 2. Product Boundary

### CyberDesk is

- A citizen-facing assistance layer.
- A structured incident-preparation experience.
- An evidence-organization and verification workflow.
- A complaint-drafting assistant based on verified facts.
- A transparent prototype demonstrating a better public-service interaction.

### CyberDesk is not

- An official government service.
- NCRP 2.0.
- A police or law-enforcement system.
- A bank or UPI system.
- A money-recovery service.
- A real complaint-submission gateway.
- A legal-advice service.
- A generic AI chatbot.
- A surveillance or investigative platform.

All government-facing actions in the prototype are **mock/synthetic** unless explicitly documented otherwise.

---

## 3. V1 Product Focus

The first release intentionally focuses on one high-value scenario:

### Online financial fraud

Primary synthetic scenario:

1. A citizen receives a call from someone impersonating a bank representative.
2. The caller claims KYC is expiring.
3. The citizen receives/opens a malicious link.
4. The citizen loses a synthetic ₹35,000.
5. A transaction notification arrives.
6. The citizen is unsure what happened and what information is needed for reporting.

This scenario is deliberately narrow so the team can deliver one complete, credible citizen journey rather than many incomplete categories.

---

## 4. Golden Citizen Journey

```text
INCIDENT
   ↓
Describe what happened
   ↓
UNDERSTAND
AI interprets the narrative
   ↓
CONFIRM
Citizen verifies/corrects AI interpretation
   ↓
SECURE
Show bounded, contextual next-step guidance
   ↓
EVIDENCE
Collect and organize relevant evidence
   ↓
VERIFY
Citizen confirms extracted facts
   ↓
TIMELINE
Build a chronological incident record
   ↓
REPORT
Generate an editable complaint draft
   ↓
SUBMIT
Perform clearly labelled mock submission
   ↓
TRACK
Show synthetic case status
   ↓
EXPLAIN
AI explains the status in plain language
```

---

## 5. AI Philosophy

AI is a **load-bearing product capability**, not decoration.

### AI may

- Interpret citizen language.
- Classify an incident provisionally.
- Identify candidate facts.
- Extract candidate evidence fields.
- Highlight missing information.
- Organize verified information.
- Draft complaint language from verified facts.
- Explain synthetic status information in plain language.

### AI must not

- Invent facts.
- Convert guesses into confirmed case data.
- Fabricate official actions.
- Claim police/bank intervention.
- Claim money has been recovered or frozen.
- Make definitive legal conclusions.
- Submit anything silently.
- Handle secrets or credentials.
- Decide database permissions or system state.

Every AI-derived factual field must carry an explicit verification state.

---

## 6. Human-in-the-Loop Principle

CyberDesk distinguishes between:

- **AI suggestion**
- **Citizen-confirmed fact**
- **System-generated state**

These are not interchangeable.

Example:

```text
AI: "The incident appears to involve phishing."
             ↓
Citizen: confirms
             ↓
System: stores verified incident method = phishing
```

This distinction is central to product trust.

---

## 7. Prototype Data Policy

All prototype data must be synthetic.

Never use:

- Aadhaar numbers
- PAN details
- real OTPs
- passwords
- bank credentials
- real card numbers
- real citizen PII
- real transaction references
- real complaint identifiers
- private screenshots
- real victim evidence

Synthetic data should be realistic enough to demonstrate the experience but clearly fictional.

---

## 8. Official-Service Relationship

CyberDesk should reference official reporting channels only as external destinations or guidance.

The UI must clearly communicate:

> **CyberDesk is an independent prototype and is not an official government service.**

Do not use government logos, seals, visual identity or wording in a way that implies endorsement, partnership or official status.

---

## 9. Hackathon Product Requirements

The prototype must:

- open directly in a browser;
- work with mock data and a mock backend;
- provide instant test access if authentication is used;
- demonstrate a complete citizen journey;
- use an OpenAI model meaningfully;
- disclose mocked behavior;
- prioritize usability over visual spectacle;
- remain responsive and accessible;
- avoid real sensitive data;
- support a concise two-minute demonstration.

---

## 10. North-Star Test

Before adding any feature, ask:

> **Does this materially reduce citizen effort, confusion, error, or uncertainty?**

If the answer is no, defer it.

---

## 11. Definition of Success

A first-time reviewer should understand within seconds:

1. what CyberDesk is;
2. who it helps;
3. what is different;
4. where AI contributes;
5. what is verified by the citizen;
6. what is mocked;
7. what happens next.

The prototype succeeds when the entire golden journey works convincingly from beginning to end.
