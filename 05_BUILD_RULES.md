# CyberDesk
## Engineering, Product & AI Guardrails

**Version:** 1.0  
**Priority:** Non-negotiable project rules

---

# A. Product Rules

### RULE 01 — Build the citizen journey, not a portal clone.
CyberDesk must feel like a focused assistance experience.

### RULE 02 — One excellent journey beats ten incomplete features.
V1 is the online financial-fraud scenario.

### RULE 03 — Every feature must reduce effort, confusion, error or uncertainty.
Otherwise defer it.

### RULE 04 — Do not build decorative complexity.
No 3D showcase or animation whose only purpose is visual spectacle.

---

# B. AI Rules

### RULE 05 — AI must be load-bearing.
It must perform meaningful work in the core journey.

### RULE 06 — AI output is provisional until verified.
Candidate facts are never automatically trusted facts.

### RULE 07 — AI must not fabricate.
Missing information must remain missing.

### RULE 08 — AI must not control system state.
Workflow transitions are deterministic.

### RULE 09 — AI must not silently submit.
The citizen always controls submission.

### RULE 10 — AI must not claim authority.
CyberDesk is not police, government, a bank or legal counsel.

---

# C. Data & Privacy Rules

### RULE 11 — Prototype data is synthetic.
No real citizen information.

### RULE 12 — Never collect real secrets.
No real passwords, OTPs, banking credentials, Aadhaar or PAN.

### RULE 13 — Protect API keys.
Server-side only. Never expose OpenAI credentials in browser code.

### RULE 14 — Uploaded content is untrusted.
Evidence can contain malicious or prompt-injection text.

---

# D. Government / Trust Rules

### RULE 15 — Never imply official status.
Do not present CyberDesk as an official government product.

### RULE 16 — Never fabricate government actions.
No fake police investigation, bank freeze, recovery or official acknowledgement.

### RULE 17 — Clearly label simulation.
Mock submission, case IDs and status must be visibly synthetic.

---

# E. Engineering Rules

### RULE 18 — Deterministic state machine.
The application controls state transitions.

### RULE 19 — Validate structured AI output.
Never blindly trust model output.

### RULE 20 — Preserve user input during failures.
AI/network failures must not erase citizen-entered information.

### RULE 21 — Test the critical path.
Playwright must cover the golden journey before submission.

### RULE 22 — Keep the architecture simple.
Prefer understandable, maintainable code over unnecessary abstractions.

---

# F. UX Rules

### RULE 23 — Plain language first.
Avoid technical/legal terminology unless explained.

### RULE 24 — One meaningful action per step.
Reduce cognitive load.

### RULE 25 — Always show what happens next.
The user should never wonder what to click.

### RULE 26 — Accessibility is part of product quality.
Responsive, keyboard-friendly, readable and resilient.

---

# G. Scope Rules

### RULE 27 — No generic chatbot.
The assistant must be contextual to the user's current case.

### RULE 28 — No admin dashboard in V1.
Judges evaluate the citizen experience.

### RULE 29 — No real external government integration.
The prototype must remain safely mocked.

### RULE 30 — If a feature does not strengthen the hero journey, defer it.
