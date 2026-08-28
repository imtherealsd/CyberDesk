# CyberDesk
## Product Blueprint & Experience Specification

**Version:** 1.0  
**Product:** CyberDesk — Citizen Cyber Incident Assistance  
**Primary V1 scenario:** Online financial fraud

---

# 1. Product Thesis

Cybercrime reporting is not only a form-filling problem.

The difficult moment happens **before** the form:

- What exactly happened?
- Is this the right category?
- What information matters?
- Which screenshots should I keep?
- What did I click?
- When did the money move?
- What should I do first?
- What will I need to report this?

CyberDesk is designed around that moment.

> **Turn a chaotic incident into an understandable, verified reporting package.**

---

# 2. Experience Principles

### 2.1 Calm under pressure
The interface should feel serious, reassuring and focused — never playful or alarmist.

### 2.2 Progressive disclosure
Ask only what is needed at each stage.

### 2.3 Natural language first
Citizens should not need to know cybercrime terminology.

### 2.4 Explain before asking
When a question matters, explain why.

### 2.5 AI suggestions are reviewable
Nothing becomes a trusted fact without confirmation.

### 2.6 One clear next action
Every major screen should answer:

> **What should I do now?**

### 2.7 No false certainty
Never imply that reporting guarantees recovery, investigation or resolution.

---

# 3. Primary User

## Persona: The overwhelmed citizen

A person who has just experienced an online financial fraud and is likely:

- stressed;
- unfamiliar with cybercrime terminology;
- unsure what evidence matters;
- worried about money;
- using a phone or modest connection;
- looking for immediate clarity rather than another complex portal.

The product must work even if the user knows nothing about phishing, UPI fraud, spoofing or cybercrime categories.

---

# 4. Hero Scenario

### Synthetic case

**Incident:** Bank impersonation + malicious KYC link + financial loss

**Synthetic amount:** ₹35,000

**Citizen narrative:**

> "Someone called saying they were from my bank and that my KYC was going to expire. They sent me a link. I opened it and shortly after I got a message saying ₹35,000 had been debited. I don't know what to do or what I need to report."

This single narrative should drive the majority of the demo.

---

# 5. Screen / State Architecture

The implementation may use fewer routes, but these states must exist conceptually.

## 01 — Entry

Purpose:
- establish trust;
- explain CyberDesk;
- start incident assistance.

Primary CTA:

**Start with what happened**

Secondary:
- How it works
- Prototype / non-official disclosure

---

## 02 — Incident Intake

Prompt:

> **Tell us what happened. You don't need to know the type of cybercrime.**

Input:
- natural-language description.

The user should not begin with a long form.

---

## 03 — AI Interpretation

Display:

**Here's what we understood**

Candidate fields:

- incident type;
- likely method;
- financial impact;
- urgency;
- evidence mentioned;
- missing information.

Every field is visibly marked as a suggestion until confirmed.

---

## 04 — Confirmation

The citizen can:

- confirm;
- correct;
- remove;
- add information.

The product should make correction easier than restarting.

---

## 05 — Immediate Guidance

Show only bounded, actionable guidance relevant to the confirmed scenario.

Guidance must be clearly separated from:

- government action;
- police action;
- bank action;
- legal conclusions.

---

## 06 — Evidence Workspace

The user can add synthetic evidence such as:

- transaction notification;
- suspicious message;
- call details;
- URL;
- screenshot.

The system explains:

> **What this evidence may help establish**

---

## 07 — Evidence Extraction

AI produces candidate fields.

Example:

```text
Candidate amount
₹35,000

Candidate transaction time
14:32 IST

Candidate reference
TXN-DEMO-84A21

Source
Synthetic transaction screenshot
```

Each field has:

**Confirm / Edit / Reject**

---

## 08 — Timeline

Build a chronological view from verified events.

Example:

```text
13:58  Caller claims to be from bank
14:05  KYC link received
14:08  Link opened
14:32  Synthetic debit occurs
14:33  Bank notification received
```

Only verified or clearly labelled inferred events belong in the trusted timeline.

---

## 09 — Complaint Draft

Generate a concise structured draft from verified facts.

The user can:

- edit;
- remove;
- regenerate wording;
- inspect source facts.

The AI must not add new factual claims.

---

## 10 — Review

Final checklist:

- Incident details
- Amount
- Timeline
- Evidence
- Contact details, if included in synthetic demo
- Complaint text

CTA:

**Submit demo report**

---

## 11 — Mock Submission

Show an unmistakable prototype state.

Example:

> **Demo submission completed**
>
> This is a simulated submission for the CyberDesk prototype. No government report was filed.

Generate synthetic:

- case ID;
- acknowledgement;
- timestamp.

---

## 12 — Tracking

Display a synthetic lifecycle:

```text
Submitted
   ↓
Information received
   ↓
Under review
   ↓
Action / follow-up pending
```

Never imply these are real government case states.

---

## 13 — AI Status Explanation

Example:

> **What does "Information received" mean?**

AI explains the synthetic status in simple language and states what the citizen can expect from the prototype.

It must not promise real-world outcomes.

---

# 6. Core Components

### Incident Composer
Natural-language intake.

### Understanding Card
AI interpretation + confidence/uncertainty.

### Fact Verification Row
Confirm / edit / reject.

### Evidence Vault
Organized synthetic evidence.

### Timeline Builder
Chronological verified events.

### Complaint Composer
Editable AI-generated draft.

### Case Tracker
Synthetic lifecycle.

### Explain This
Contextual AI explanation.

---

# 7. Accessibility Requirements

- keyboard navigable;
- strong focus states;
- readable typography;
- meaningful labels;
- semantic form controls;
- responsive mobile layout;
- no critical information conveyed by color alone;
- useful loading/error states;
- low-friction interaction on slower connections.

---

# 8. V1 Definition of Done

V1 is complete only when a reviewer can:

1. describe an incident;
2. see AI interpret it;
3. correct the interpretation;
4. receive relevant next-step guidance;
5. add synthetic evidence;
6. verify extracted facts;
7. see a timeline;
8. review a complaint;
9. complete a mock submission;
10. track the case;
11. ask what the status means.

The journey must feel like **one coherent product**, not a collection of screens.
