# CyberDesk
## Execution Roadmap & Approval Gates

**Version:** 1.0  
**Current phase:** Foundation / architecture validation

---

# 1. Current State

Completed:

- product name: **CyberDesk**
- product positioning defined;
- hero scenario selected;
- citizen journey defined;
- AI responsibilities defined;
- mock/synthetic boundary defined;
- engineering ownership defined;
- MCP/tooling baseline established;
- project context documentation established.

Not yet approved:

- final database schema;
- final API contracts;
- final application structure;
- implementation scope;
- UI system.

---

# 2. Phase 0 — Architecture Reconnaissance

## Owner: Codex

### Objective

Understand the project before writing production code.

Codex must:

1. read all project context files;
2. inspect the current repository;
3. inspect Supabase read-only;
4. validate the proposed architecture;
5. identify contradictions;
6. propose the final schema;
7. propose API boundaries;
8. define AI contracts;
9. define the deterministic state machine;
10. identify security risks.

### Gate

**No database modifications. No broad application implementation.**

Codex produces an architecture proposal and waits for approval.

---

# 3. Phase 1 — Engineering Foundation

## Owner: Codex

After approval:

- initialize Next.js/TypeScript if required;
- establish project structure;
- configure environment variables;
- create database migrations;
- establish RLS;
- create synthetic seed data;
- define API/server boundaries;
- create validation utilities;
- establish error handling.

### Exit condition

The technical foundation is runnable locally.

---

# 4. Phase 2 — Experience Build

## Owner: Antigravity

Implement the citizen-facing experience:

- entry;
- intake;
- AI interpretation state;
- confirmation;
- guidance;
- evidence workspace;
- verification;
- timeline;
- complaint review;
- mock submission;
- tracking;
- status explanation.

The UI must consume agreed contracts rather than invent backend behavior.

---

# 5. Phase 3 — AI Integration

## Owner: Codex

Implement:

- incident interpretation;
- evidence extraction;
- complaint drafting;
- status explanation;
- structured output validation;
- failure handling;
- prompt-injection boundaries.

### Exit condition

AI is genuinely load-bearing in the golden journey.

---

# 6. Phase 4 — Integration

## Owners: Codex + Antigravity

Connect:

```text
UI
 ↓
API
 ↓
OpenAI / Supabase
 ↓
validated state
 ↓
UI
```

Verify:

- loading states;
- errors;
- persistence;
- refresh/resume;
- responsive behavior;
- accessibility.

---

# 7. Phase 5 — QA & Security

## Owner: Codex

Use Playwright for the complete critical path.

Test:

- happy path;
- invalid input;
- AI timeout/failure;
- upload failure;
- persistence failure;
- refresh;
- authorization;
- malformed content;
- prompt injection;
- mobile viewport.

Perform a final:

- secret scan;
- dependency review;
- RLS review;
- mock-data audit;
- government-branding audit.

---

# 8. Phase 6 — Deployment

## Owner: Codex

Deploy through Vercel.

Verify from a clean browser:

- URL opens;
- no authentication surprises;
- demo path works;
- API routes work;
- Supabase persistence works;
- AI works;
- errors are recoverable.

---

# 9. Phase 7 — Demo Readiness

Run the exact two-minute demo.

The reviewer should be able to experience:

```text
incident
 → understanding
 → verification
 → guidance
 → evidence
 → timeline
 → complaint
 → mock submission
 → tracking
 → explanation
```

---

# 10. Approval Gates

## GATE A — Architecture
Approve before database/app implementation.

## GATE B — Golden Journey
Approve before adding secondary features.

## GATE C — AI Trust
Approve before using AI-derived facts in persistent state.

## GATE D — Demo
Approve only after the clean-browser journey works end-to-end.

---

# 11. Immediate Next Action

### Start with Codex.

The next gate is a controlled live-auth security verification using two disposable Supabase users. Exercise cross-user access against PostgREST, every case API, and the private evidence bucket, then resolve the remaining SECURITY DEFINER advisor warnings before onboarding any real citizen data.

Do not treat the local mock-user Playwright harness as proof of live RLS isolation. Keep using synthetic or redacted data until that gate and the operational controls in `SECURITY.md` are complete.
