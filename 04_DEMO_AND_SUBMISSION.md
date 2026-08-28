# CyberDesk
## Demonstration, Submission & Evaluation Strategy

**Version:** 1.0  
**Objective:** Make the product's value obvious within two minutes.

---

# 1. Demo Narrative

The demo should feel like one continuous citizen story:

> **"I lost money. I don't know what happened. CyberDesk helps me turn the incident into something I can understand, verify and prepare for reporting."**

---

# 2. Minute One — Citizen Experience

## 00:00–00:10
Open CyberDesk.

Say:

> "I just lost ₹35,000 after someone impersonated my bank."

---

## 00:10–00:20
Describe the incident naturally.

Show that no cybercrime terminology is required.

---

## 00:20–00:35
AI interprets the incident.

Highlight:

- likely method;
- financial impact;
- urgency;
- missing information.

---

## 00:35–00:45
Citizen confirms/corrects the interpretation.

This demonstrates the human-in-the-loop trust model.

---

## 00:45–01:00
Show immediate next-step guidance.

Keep it short and contextual.

---

## 01:00–01:15
Add synthetic evidence.

AI extracts candidate transaction details.

Citizen verifies them.

---

## 01:15–01:30
Timeline appears.

Show how scattered events become an organized sequence.

---

## 01:30–01:45
Complaint draft is generated from verified facts.

Citizen reviews/edits it.

---

## 01:45–01:55
Complete mock submission.

Show:

- synthetic case ID;
- mock acknowledgement;
- clear simulation disclosure.

---

## 01:55–02:00
Show status and ask:

> "What does this mean?"

AI explains the synthetic status.

---

# 3. Minute Two — Build Story

Explain four things:

### Problem
The citizen experience is fragmented and cognitively demanding.

### Intervention
CyberDesk converts an unstructured incident into a verified reporting package.

### AI
OpenAI interprets, extracts, drafts and explains — but never silently becomes the source of truth.

### Engineering
Supabase provides mock persistence; deterministic application logic controls workflow; Playwright verifies the critical path; Vercel hosts the browser experience.

---

# 4. Honesty Statement

The demo should explicitly state:

> **This is an independent prototype. Data, identities, evidence and submissions shown here are synthetic. No government complaint is filed by this demo.**

This is a strength, not a weakness.

---

# 5. What Judges Should Notice

The product should make these points obvious:

- The citizen does not need technical vocabulary.
- AI performs meaningful work.
- AI output is reviewable.
- Evidence becomes structured information.
- Verified information drives the complaint.
- The workflow is end-to-end.
- The prototype does not pretend to be a government system.
- Failure and limitations are handled honestly.

---

# 6. Submission Checklist

Before submission:

- [ ] public browser URL works without access requests;
- [ ] demo credentials work, if authentication exists;
- [ ] no secrets in repository;
- [ ] no real personal data;
- [ ] mock behavior is labelled;
- [ ] official-government relationship is clearly disclosed;
- [ ] critical journey works on a clean browser session;
- [ ] mobile/responsive layout works;
- [ ] 2-minute demo is within the limit;
- [ ] 250-word summary is exactly 250 words if the form requires exact length;
- [ ] final repository is reproducible.

---

# 7. Evaluation Alignment

| Criterion | CyberDesk evidence |
|---|---|
| Problem | Clear citizen pain point |
| Working build | Complete golden journey |
| Usability | Natural-language intake + progressive disclosure |
| Product thinking | Human verification + focused V1 |
| End-to-end thinking | Intake → evidence → timeline → complaint → tracking |
| Honesty | Explicit mock/synthetic boundaries |

---

# 8. Demo Rule

Do not spend the two minutes explaining architecture before the reviewer sees the product.

**Show the citizen problem first. Explain the engineering second.**
