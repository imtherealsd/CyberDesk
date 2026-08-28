# CyberDesk

CyberDesk is an independent, browser-based prototype for helping citizens understand and prepare after an online financial fraud incident. It is not an official government service, does not connect to the National Cyber Crime Reporting Portal, and does not file real complaints.

## Run locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

The app works through the mock journey without credentials. To enable the real OpenAI-powered interpretation and status explanation, set `OPENAI_API_KEY` in `.env.local`. The key is read only by server routes. Set the Supabase variables to use the synthetic database persistence.

Evidence uploads are limited to PNG, JPG/JPEG, PDF and TXT files up to 5 MB. The evidence workflow records metadata, shows an honest upload/processing state, and returns structured candidate details for citizen verification. Without an OpenAI key, TXT and synthetic evidence use a deliberately limited deterministic demo extractor. Without a Supabase service-role key, uploads remain session-only; the app does not claim that private cloud storage succeeded.

Use synthetic or redacted files only. Never upload passwords, OTPs, PINs, CVV, full card numbers, Aadhaar, PAN or other unnecessary identity information. The evidence bucket is private and the service-role key is server-only; this prototype still uses a synthetic demo incident and is not production-ready for real citizen PII.

For the authenticated alpha workspace, Supabase Auth is the only production-capable identity source. Local Playwright simulation is opt-in only through `CYBERDESK_TEST_AUTH=1`, `NEXT_PUBLIC_CYBERDESK_TEST_AUTH=1`, and `CYBERDESK_FORCE_LOCAL_STORE=1`; never set those flags in a deployed environment. See [SECURITY.md](SECURITY.md) for the ownership, RLS, Storage, and verification boundaries.

## Architecture

- `app/page.tsx` owns the small deterministic citizen journey state machine.
- `app/api/ai/*` contains server-only OpenAI boundaries and returns validated structured results.
- `app/api/evidence/*` handles validation, private-storage metadata, structured extraction and citizen verification.
- `app/api/reports/submit` is the explicit mock submission boundary.
- `lib/server-store.ts` persists synthetic journey data to Supabase when configured and otherwise uses a clearly limited local fallback.
- `supabase/migrations/202608260001_cyberdesk_mock_schema.sql` contains the synthetic schema, grants and RLS policies; the later evidence migrations add the pipeline fields, private bucket and demo-only update policies.

AI suggestions are never treated as confirmed facts, and AI cannot control case status or submission. See the repository context documents for the full product and safety contract.
