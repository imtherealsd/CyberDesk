# CyberDesk — Civic Incident Desk

> **Understand what happened. Know what to do next.**  
> An India-focused Civic Incident Desk prototype that helps citizens turn confusing cyber incidents into structured, evidence-backed Incident Dossiers.

[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_0_Errors-blue.svg)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Playwright-86_Run-success.svg)](https://playwright.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5_App_Router-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase_RLS-336791.svg)](https://supabase.com/)
[![Gemini](https://img.shields.io/badge/Gemini_API-Structured_JSON_Schemas-4285F4.svg)](https://ai.google.dev/)

---

## 1. What is CyberDesk?

When a citizen in India falls victim to online financial fraud, identity impersonation, extortion, or phishing, the immediate aftermath is high-stress and disorienting. Citizens often do not know what details matter (UTR numbers, SMS timestamps, caller handles), struggle to assemble evidence, and miss the critical **Golden Hour** (the immediate window to freeze stolen funds via the **1930** national helpline).

**CyberDesk** acts as an intelligent, independent assistance layer. It guides the citizen step-by-step to:
1. Record their story in plain language.
2. Receive immediate emergency triage guidance (calling 1930, contacting bank freeze desks).
3. Securely upload raw evidence (screenshots, SMS transcripts, bank notifications, PDFs).
4. Review AI-extracted **candidate fields** (amounts, reference codes, timestamps, phone numbers).
5. Explicitly **verify, edit, or reject** each field (human-in-the-loop).
6. Generate a structured chronological **Timeline** and formal **Incident Dossier**.
7. Print or export the Dossier for presentation to banks and law enforcement.

---

## 2. Core Product Principles & AI Trust Boundary

CyberDesk implements an uncompromising **AI Trust Boundary**:

```
Raw Citizen Input → AI Candidate Suggestion → Citizen Review (Accept/Edit/Reject) → Verified Fact → Incident Dossier
```

- **AI output is never automatically a verified fact.**
- All AI suggestions are marked as `candidate` until explicitly confirmed by the citizen.
- Sensitive credentials (OTPs, banking PINs, card CVVs, Aadhaar, PAN and account-like numeric values) are filtered before candidate presentation; valid Indian phone numbers remain usable.
- All Gemini API calls enforce structured JSON output schemas with zero retention of citizen evidence.
- Full provenance metadata (`origin: gemini | openai | demo_fallback | citizen | synthetic`, timestamp) is attached to every verified fact.

---

## 3. Civic & Safety Boundaries

CyberDesk is transparent and honest about its boundaries:
- **Independent Assistance Tool**: It is NOT an official police FIR portal and does NOT directly file reports with `cybercrime.gov.in`.
- **No Live Government System Interference**: Uses only documented public hotlines (**1930**) and portal links.
- **No Real PII Requirement**: Works completely with synthetic or redacted evidence.
- **No Deceptive Branding**: Uses original Civic Incident Desk editorial design without government logos or seals.

---

## 4. Key Features

- **Dual-Mode Experience**:
  - **Civic Demo Journey (`/`)**: A complete 9-step interactive walkthrough with instant deterministic fallbacks when AI is offline.
  - **Authenticated Workspace (`/cases`)**: Multi-case management backed by Supabase Auth, PostgreSQL with Row-Level Security, server-authorized private writes, and private evidence storage. The server-side service-role key is required for cloud-case persistence.
- **Multilingual Support**: Fully localized in **5 major Indian languages**:
  - English (`en`), हिंदी — Hindi (`hi`), বাংলা — Bengali (`bn`), தமிழ் — Tamil (`ta`), తెలుగు — Telugu (`te`).
- **Mobile-First Responsive Design**: Optimized and tested for 390px, 412px, 768px, and desktop viewports.
- **Print-Ready Incident Dossier**: Clean `@media print` layout ready for PDF export or physical printing.

---

## 5. Technology Stack

- **Framework**: Next.js 15.5.24 (App Router, React 19, Server Components)
- **Language**: TypeScript 5.8.3 (Strict Mode)
- **Database & Storage**: Supabase (PostgreSQL with Row-Level Security & Private Buckets)
- **AI Integration**: Google Gemini API (`@google/genai` / `gemini-2.5-flash` with strict JSON Schema enforcement)
- **Validation**: Zod (Strict schema parsing on all API endpoints)
- **Testing**: Playwright (86 desktop/mobile test runs covering authorization, journeys, and localization; 2 production-only checks are skipped without a separate production URL)
- **Styling**: Vanilla CSS (Zero heavy UI libraries, custom Civic Editorial design system)

---

## 6. Quick Start & Local Setup

### Prerequisites
- Node.js 20+
- npm

### Installation
```bash
# 1. Clone repository
git clone https://github.com/your-username/cyberdesk.git
cd cyberdesk

# 2. Install dependencies
npm install

# 3. Configure environment
copy .env.example .env.local

# 4. Start development server
npm run dev
```

Visit `http://localhost:3000` to access the application.

---

## 7. Environment Variables

| Variable | Description | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | Required for cloud authentication; omit only for the isolated local/test store |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase Public Anon Key | Required with the project URL for cloud authentication |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key (Server-only) | Required for authenticated cloud-case writes and private storage |
| `GEMINI_API_KEY` | Google Gemini API Key (Server-only) | Optional (Deterministic fallback active) |
| `GEMINI_MODEL` | Gemini Model (Default: `gemini-2.5-flash`) | Optional |
| `CYBERDESK_TEST_AUTH` | Local Test User Authentication (`1` or `0`) | Dev/Test only |
| `NEXT_PUBLIC_CYBERDESK_TEST_AUTH` | Local browser test-session UI (`1` or `0`) | Dev/Test only |
| `CYBERDESK_FORCE_LOCAL_STORE` | Force the isolated in-memory case store (`1` or `0`) | Dev/Test only |

> **Note**: If `GEMINI_API_KEY` is not provided, CyberDesk uses its deterministic extraction fallback. The public synthetic demo works offline. The authenticated cloud workspace additionally requires Supabase Auth configuration and the server-only `SUPABASE_SERVICE_ROLE_KEY`; the Playwright harness supplies the three local test flags explicitly.

---

## 8. Verification & Testing

```bash
# Run TypeScript Typecheck
npm run typecheck

# Run Production Build
npm run build

# Run Playwright End-to-End Test Suite
npm run test:e2e
```

### Verified Test Baseline:
- **TypeScript**: 0 errors
- **Production Build**: 23/23 routes compiled cleanly
- **Playwright Tests**: 84 passed, 2 skipped (production-only headers check, when run with the repository's local test harness)

---

## 9. System Documentation

For detailed technical specifications, database schema, and security policies, see:
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Comprehensive System Architecture & Data Flows
- [SECURITY.md](SECURITY.md) — Security Model, RLS Policies, and IDOR Prevention

---

## 10. License

MIT License. Designed for civic benefit and ethical public assistance.
