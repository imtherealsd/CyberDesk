# CyberDesk Security Hardening

Updated: 29 August 2026

CyberDesk is an independent incident-organization tool. It is not an official Government of India portal, an FIR filing system, a police investigation system, a bank reversal service, or a replacement for cybercrime.gov.in. The target of this milestone is a secure authenticated alpha foundation, not production readiness.

## Authentication model

- Real server identity comes only from a validated Supabase Auth bearer token or the supported Supabase access-token cookie.
- `auth.uid()` is the database identity used by RLS.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and is isolated in `lib/supabase-server.ts`.
- Missing Supabase configuration or malformed sessions fail closed for protected APIs.
- Passwordless sign-in uses Supabase Auth. If Supabase is unavailable, the public sign-in API returns an honest unavailable response.

### Test authentication

The in-memory test users, simulated browser session, mock bearer tokens, and `x-test-user-*` headers exist only when all of the following are true:

```text
NODE_ENV != production
CYBERDESK_TEST_AUTH=1
CYBERDESK_FORCE_LOCAL_STORE=1
```

The browser additionally requires `NEXT_PUBLIC_CYBERDESK_TEST_AUTH=1`. The Playwright web server supplies these flags explicitly. Production code does not accept these headers or tokens, and the login page does not show quick test access without the client-side flag. Never set these flags in an alpha or production deployment.

## Ownership model

```text
auth.users
  -> profiles
  -> case_members (owner/collaborator/viewer)
  -> incidents (canonical case; UUID identity)
       -> evidence -> facts
       -> timeline_events
       -> complaints -> complaint_events
```

Real incidents have `is_demo = false`, `demo_key = null`, and `created_by` bound to the authenticated user. An after-insert trigger creates the owner membership. Child records carry the case foreign key and, where applicable, the authenticated creator. Case identity fields cannot be changed after creation.

The ownership migrations are `user_case_ownership`, `storage_case_policies`, and `trust_boundary_hardening`. No duplicate `cases` table was introduced.

## RLS model

RLS is enabled on `profiles`, `case_members`, `incidents`, `evidence`, `facts`, `timeline_events`, `complaints`, and `complaint_events`.

- Anonymous access is limited to the synthetic demo rows and required demo writes.
- Authenticated real-case reads require membership through a server-side SECURITY DEFINER helper that uses the current `auth.uid()`; real mutations are server-only after API membership and role checks.
- Only owners can add/remove case members and delete real case records. A user cannot self-join an arbitrary incident UUID.
- Private API writes use the server-only service-role client only after the request has passed authentication, case membership, and capability checks.
- Demo/real identity flags are protected by database triggers and RLS checks.
- `complaint_events` has no authenticated update/delete grant.

The Supabase security advisor currently reports warnings for the intentionally callable SECURITY DEFINER helpers used to avoid recursive RLS. They are stable, fixed-identity authorization predicates with a locked `search_path`; they do not accept a user identity argument. This remains a review item before production, not an ignored authorization failure.

## Storage model

The `cyberdesk-evidence` bucket is private, has a 5 MB limit, and allows only `image/png`, `image/jpeg`, `application/pdf`, and `text/plain`.

Case objects use:

```text
cases/<incident UUID>/<evidence UUID>/<sanitised filename>
```

Authenticated Storage object policies require the exact path shape, an evidence UUID, the matching evidence row, and membership in the incident UUID. Viewers can read matching objects, while direct object writes require owner/collaborator capability. Anonymous storage policies do not exist. Application uploads use the server-only service-role client only after the case API has authorized the request; no public or unnecessary signed URL is produced. Filename input is sanitized and the application validates extension, normalized MIME type, and size before upload.

## API authorization

- `GET/POST /api/cases` requires authentication.
- `/api/cases/[id]` and all case evidence/report routes require authentication, UUID validation, and case membership before case-scoped work; evidence/report mutations additionally require owner or collaborator capability.
- Inaccessible or malformed case IDs return a generic 404 where enumeration resistance is useful.
- Legacy `/api/evidence/*` and `/api/reports/submit` remain public only for the synthetic demo journey. They reject authenticated requests so they cannot be used as a private-case bypass.
- `/api/demo-case` is read-only public demo access.
- AI interpretation/status routes do not accept private case identifiers and do not authorize case mutations.

## AI and provenance

Uploaded content is untrusted input. Google Gemini API extraction is server-side, schema-validated, and treated as a candidate suggestion. The model cannot set case status or silently create a verified fact. Citizen accept/edit/remove/restore actions are required before verified facts are persisted and used in the verified timeline. Fallback extraction is deterministic and visibly labelled. Secrets are never sent to the client bundle.

## Demo versus real data

`hero-financial-fraud` is synthetic only: `is_demo = true`, with no owner. It remains available without authentication. Real UUID incidents cannot use that demo key, cannot be claimed by a user, and are not returned by the real-case list. The local test store is also gated behind explicit test flags and is not a production fallback.

## Verification performed

- The ownership, storage, and trust-boundary migrations were reviewed as repository source; applying them to a live Supabase project is an operator/deployment step outside this local verification.
- The migration source defines a private bucket, 5 MB limit, MIME restrictions, case/evidence path checks, and the RLS/grant changes described above.
- TypeScript, production build, and Playwright regression/security tests pass locally; two production-auth tests are intentionally skipped unless a separately started production URL is supplied.
- Local tests exercise unauthenticated denial, same-user access, cross-user API denial under the isolated test harness, malformed-ID 404s, legacy demo endpoint isolation, demo journey, candidate/rejected fact exclusion, fabricated-field rejection, sensitive-number filtering, redirect validation, and failed-extraction UI messaging.

The current environment does not provide two real Supabase Auth user sessions for a non-simulated cross-user integration run. Therefore live JWT-to-JWT RLS and Storage cross-user attempts remain required before alpha onboarding. Do not treat the local mock test headers as evidence of live RLS enforcement. The migration-defined real-case mutation boundary also requires `SUPABASE_SERVICE_ROLE_KEY` in the deployment.

## Known limitations / next gate

1. Run the documented real-Auth adversarial matrix with two disposable Supabase users and direct PostgREST/Storage requests.
2. Move authorization predicates to a non-exposed private schema or otherwise resolve the Supabase SECURITY DEFINER advisor warnings.
3. Add rate limiting, audit logging, retention/deletion policy, malware scanning, content sniffing, and operational secret rotation before real citizen PII.
4. Keep collaboration management limited to owner-controlled membership operations; the current UI does not expose collaboration invitations.

### Alpha readiness status

Secure authenticated alpha foundation: **CONDITIONAL PASS**.

The application bypass and self-join policy are fixed, migration-defined RLS/storage boundaries are present, and local regression coverage passes. Proceed only with disposable/synthetic data until live two-user Auth/Storage adversarial verification and the remaining production controls are complete.
