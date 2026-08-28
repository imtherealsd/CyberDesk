# CyberDesk
## Architecture, Tooling & Agent Ownership

**Version:** 1.0  
**Architecture principle:** deterministic systems + bounded AI + human verification

---

# 1. Target Architecture

```text
Browser
   │
   ▼
Next.js / TypeScript application
   │
   ├── UI state & deterministic workflow
   │
   ├── Server/API layer
   │      ├── OpenAI
   │      └── Supabase
   │
   └── Validation / safety boundaries
             │
             ▼
      Supabase PostgreSQL
             │
             ├── incidents
             ├── evidence
             ├── facts
             ├── timeline events
             ├── complaints
             └── status events
```

Deployment target:

**Vercel**

Testing:

**Playwright**

Source control:

**GitHub**

Design exploration:

**Stitch**

---

# 2. Agent Strategy

The team intends to use:

- **Antigravity:** approximately 70–80% of visible UI/UX implementation.
- **Codex:** engineering spine, integration, AI, data, security, testing and deployment.

This is an ownership model, not a literal percentage of lines of code.

---

# 3. Antigravity Ownership

Antigravity should primarily own:

- page composition;
- visual design;
- component implementation;
- responsive layouts;
- interaction polish;
- accessibility;
- loading/error/empty states;
- microcopy implementation;
- visual consistency;
- citizen-facing experience.

Antigravity should work against approved contracts rather than inventing backend behavior.

---

# 4. Codex Ownership

Codex should own:

- technical architecture;
- database schema;
- Supabase configuration;
- RLS;
- API/server boundaries;
- OpenAI integration;
- structured AI output validation;
- deterministic state transitions;
- security;
- secrets;
- persistence;
- Playwright tests;
- Vercel integration;
- final engineering audit.

---

# 5. Shared Ownership

Both agents may contribute to:

- interaction decisions;
- copy;
- product logic discussions;
- bug fixing;
- final polish.

When ownership conflicts, **the project source-of-truth documents and explicit team decisions take precedence**.

---

# 6. Current MCP / Tooling Baseline

The current setup includes:

| Tool | Purpose | Status |
|---|---|---|
| GitHub | Source control / repository workflows | Connected |
| Supabase MCP | Database, storage, backend development | Connected |
| Playwright MCP | Browser testing | Enabled |
| Vercel MCP | Deployment / hosting workflows | Connected |
| Stitch | Design exploration / UI generation | Available |
| Node REPL | Browser/runtime support | Available |

Installed agent skills:

- `supabase`
- `supabase-postgres-best-practices`
- `find-skills`

### Rule

Do not add tools merely because they exist.

Every tool must have a concrete role in CyberDesk.

---

# 7. Security Architecture

## Secrets

OpenAI credentials must remain server-side.

Never:

```text
NEXT_PUBLIC_OPENAI_API_KEY
```

Never commit secrets to Git.

Use environment variables / platform secrets.

---

## AI boundary

```text
Citizen input
     ↓
Server validation
     ↓
OpenAI
     ↓
Structured output validation
     ↓
Human confirmation
     ↓
Trusted case fact
```

The model never directly controls:

- database permissions;
- authentication;
- case status transitions;
- submission state;
- secret handling.

---

# 8. Data Flow

### Incident interpretation

```text
free text
  ↓
server
  ↓
OpenAI structured output
  ↓
validation
  ↓
candidate facts
  ↓
citizen confirmation
  ↓
persist verified facts
```

### Complaint generation

```text
verified facts
  ↓
server
  ↓
OpenAI
  ↓
draft
  ↓
citizen review/edit
  ↓
mock submission
```

---

# 9. Testing Strategy

The critical path must be tested end-to-end:

```text
Start
 → describe incident
 → AI interpretation
 → confirm
 → evidence
 → verify facts
 → timeline
 → complaint
 → mock submit
 → tracking
 → status explanation
```

Testing must include:

- happy path;
- invalid input;
- AI failure;
- upload failure;
- persistence failure;
- network delay;
- refresh/resume;
- unauthorized access;
- unsafe or malformed input.

---

# 10. Architecture Gate

Before implementation begins, Codex must produce and receive approval for:

1. final schema;
2. API contracts;
3. AI contracts;
4. state machine;
5. RLS/security approach;
6. project structure.

Only then should broad implementation begin.
