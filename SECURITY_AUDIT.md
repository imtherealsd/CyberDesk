# CyberDesk — Post-Alpha Security & Architecture Audit

**Audit date:** 28 August 2026  
**Scope:** Read-only verification of the repository and connected Supabase project  
**Audit mode:** No production code, tests, migrations, or Supabase state were modified

## Executive summary

The implementation is **not ready for authenticated alpha use** and should not accept real citizen evidence.

The claimed post-alpha architecture is not the architecture currently deployed in Supabase. The live project has only the three demo/evidence migrations applied:

- `realistic_evidence_pipeline`
- `evidence_reference_indexes`
- `evidence_verification_update_policies`

The local ownership migration, `supabase/migrations/202608280004_user_case_ownership.sql`, is not present in the live migration ledger. The live database has no `profiles` or `case_members` tables, no ownership columns, no membership helper, and still enforces `is_demo = true` on `incidents` and all evidence-related tables.

Two critical issues must be addressed before any private alpha exposure:

1. `lib/auth-server.ts` accepts caller-controlled `x-test-user-id` and `x-test-user-email` headers without a production guard. It can register arbitrary mock users and return an authenticated context without a Supabase session.
2. The local ownership migration's case-member INSERT policy allows any authenticated user to add themselves to any case whose UUID they know. It also allows a user to claim the demo case if that migration is applied as written.

The existing synthetic Golden Journey remains suitable for a hackathon demonstration under the forced local/demo configuration. The passing Playwright suite does not prove Auth, RLS, Storage, or cross-user isolation because it runs with `CYBERDESK_FORCE_LOCAL_STORE=1` and synthetic test headers.

**Decision:** Do not proceed to the next private-data feature milestone. Remediate the P0 findings, deploy and verify the ownership migration in a separate environment, then add live Auth/RLS/Storage isolation tests.

## Verification evidence

Inspected:

- All root product and architecture documents, including `00_PROJECT_CONTEXT.md` through `06_NEXT_STEPS.md`, `README.md`, `PROJECT_AUDIT.md`, `IMPLEMENTATION_PLAN.md`, and `ALPHA_ARCHITECTURE.md`.
- `app/` routes and client pages, `lib/` authentication, Supabase, case store, evidence and AI code.
- All local Supabase migrations.
- `package.json`, `playwright.config.ts`, and both Playwright specs.
- Connected Supabase project `gddtzdzktbvwjhrtacax`.

Read-only checks:

- `npx tsc --noEmit` — passed.
- `npx eslint app/ lib/` — passed.
- `npm run build` — passed.
- `npx playwright test` — all 46 desktop/mobile test cases emitted `ok`; the runner did not return its final summary/clean exit during this invocation, so this is not recorded as a clean exit-0 suite result.
- Supabase security advisors — no lints for the currently deployed demo schema.
- Supabase performance advisors — informational unused-index notices only.
- Direct unauthenticated HTTP checks — `/cases`, `/cases/new`, and `/cases/<id>` return HTML `200`; protected APIs return `401`.

## Architecture verification

### Intended architecture

```text
User → Profile → Case membership → Incident
                                  ├─ Evidence → Facts
                                  ├─ Timeline events
                                  └─ Complaints → Complaint events
```

### Actual deployed architecture

```text
Anonymous or authenticated role
        ↓
Shared synthetic incidents selected by is_demo = true
        ├─ Evidence
        ├─ Facts
        ├─ Timeline events
        └─ Complaints / complaint events
```

The local application contains a second, in-memory authenticated case store in `lib/case-store.ts`, but this is not a durable multi-user persistence layer. Playwright forces this path. When a real Supabase client is used, the application expects tables and columns that are absent from the connected project.

There are also two parallel API families:

- Case-scoped authenticated-looking routes under `/api/cases/[id]`.
- Legacy demo routes under `/api/evidence/*` and `/api/reports/submit`, which have no authentication requirement and still write the shared `hero-financial-fraud` demo case.

This dual path is useful for preserving the demo but is not yet a safe alpha boundary.

## Database audit

### Live Supabase schema

The live project contains these case-related tables:

| Entity | Live state | Ownership result |
|---|---|---|
| `profiles` | Absent | No profile relationship to `auth.users` exists live |
| `case_members` | Absent | No live membership or ownership relation exists |
| `incidents` | Present | UUID primary key, but no `created_by`; `demo_key` is still required; `is_demo` is constrained true |
| `evidence` | Present | FK to `incidents` with `ON DELETE CASCADE`; no user ownership |
| `facts` | Present | FK to `incidents` and nullable FK to `evidence`; no user ownership |
| `timeline_events` | Present | FK to `incidents` with cascade; nullable FK to `evidence` with `SET NULL`; no user ownership |
| `complaints` | Present | Unique FK to `incidents` with `ON DELETE CASCADE`; no user ownership |
| `complaint_events` | Present | FK to `complaints` with `ON DELETE CASCADE`; no user ownership |

The live `incidents` table has one seeded demo row. The live schema inspection confirmed that `is_demo` still has the check constraint `is_demo = true` and `demo_key` remains `NOT NULL`. Thus a real case cannot be inserted into the live schema as the local code expects.

### Local ownership migration review

The local migration is directionally useful but not safe to apply without changes:

- `profiles.id` references `auth.users(id) ON DELETE CASCADE`, which is the correct identity direction.
- `case_members.user_id` references `auth.users(id) ON DELETE CASCADE`; it does not reference `profiles`, although that is not inherently unsafe.
- `case_members.incident_id` references `incidents(id) ON DELETE CASCADE` and has a uniqueness constraint on `(incident_id, user_id)`.
- `created_by` is nullable on incidents, evidence, facts, timeline events, and complaints, and uses `ON DELETE SET NULL`. That does not satisfy “every real case belongs to an authenticated user” as a database invariant.
- `complaint_events` has no `created_by` column. Its ownership is indirect through `complaints`, which is acceptable only if every complaint-event write is protected by a sound complaint/case policy.
- `facts.evidence_id` and `timeline_events.evidence_id` are nullable single-column foreign keys. There is no composite constraint proving that the referenced evidence belongs to the same incident as the fact/event. A member can create a row with `incident_id = A` and `evidence_id` from incident B.
- `event_key` and `field_key` are nullable even though the application relies on them for idempotency. A nullable unique key does not enforce uniqueness for missing values.
- There is no database constraint restricting `created_by` to `auth.uid()`; it is supplied by the API payload assembled in application code.

### Database findings

#### P1-DB-01 — Ownership migration is not deployed

**Location:** Supabase migration ledger; expected local file `supabase/migrations/202608280004_user_case_ownership.sql`.

The live migration ledger contains only three migrations and does not contain `user_case_ownership`. Real case API calls therefore reference missing tables/columns. `createCase()` also attempts to insert `is_demo = false` into a column still constrained to true.

**Impact:** The authenticated alpha is not operational against the connected project. Depending on error handling, users receive generic `500` responses or the application falls back to local memory. This is a deployment and data-integrity blocker rather than a proven live cross-user read.

**Recommended fix:** Apply a reviewed ownership migration to a non-production Supabase environment first, verify its migration ledger, schema, grants, RLS, and rollback plan, then promote it. Do not silently rely on `CYBERDESK_FORCE_LOCAL_STORE` outside a clearly isolated demo environment.

#### P1-DB-02 — Cross-entity evidence references are not case-bound

**Location:** `facts.evidence_id`, `timeline_events.evidence_id` in `202608280001_realistic_evidence_pipeline.sql`.

The foreign keys prove that an evidence ID exists, but not that it belongs to the same incident as the fact or timeline row. This permits inconsistent provenance and cross-case references when a user has access to more than one case or a server-side path is misused.

**Recommended fix:** Enforce case/evidence consistency with composite keys or a trigger/server-only write function. Keep the evidence ID and incident ID derived from the stored evidence row rather than accepting both independently from the client.

#### P2-DB-03 — Ownership fields are nullable and mutable

**Location:** local migration lines 71, 79, 84, 89, and 94.

`created_by` can be null and is not protected against changes. User deletion sets it null. That may be a deliberate retention choice, but it removes the ownership field while the application still describes the row as owned.

**Recommended fix:** Treat membership as the authorization source, make the owner membership non-removable without an ownership transfer flow, and use immutable audit authorship fields where retention requirements allow it.

## RLS audit

### Live policies

RLS is enabled on the six live public case tables and `storage.objects`. The deployed policies are demo-only:

- SELECT: `is_demo = true`.
- INSERT: `is_demo = true`.
- UPDATE: `is_demo = true`.
- No demo DELETE policy is present.

The current RLS is appropriate for a shared synthetic demo only. It does not authorize real users because there are no live ownership tables or policies. The Supabase security advisor’s empty result is therefore not evidence that the claimed alpha RLS is secure; it is checking a smaller demo schema.

### Local ownership-policy review

The local migration uses a `security definer` `is_case_member()` helper with `set search_path = public`, which avoids the recursive RLS issue that a security-invoker helper would create. However, the policies around it are not safe:

#### P0-RLS-01 — Any authenticated user can self-join any known case

**Location:** `supabase/migrations/202608280004_user_case_ownership.sql:122-124`, policy `owners can add case members`.

```sql
with check (user_id = auth.uid() or is_case_member(incident_id))
```

The first condition is true for a user inserting themselves, regardless of whether they own or belong to the incident. An attacker who obtains a case UUID can insert `(incident_id, auth.uid(), 'owner')`, then satisfy the membership checks for incidents, evidence, facts, timeline events, and complaints.

The same defect allows an authenticated user to add themselves to the seeded demo incident, claim it, and potentially change its state if the migration is applied.

**Attack scenario:** User B receives or guesses a case UUID from a link, browser history, log, or application response. User B calls the Supabase Data API directly to insert a membership row for their own user ID. The case then becomes readable and writable through the membership-based policies.

**Recommended fix:** Do not allow self-enrollment. Permit membership INSERT only to the case owner or a server-side invitation/acceptance flow. Derive the owner from a trusted server transaction or a database function that binds `user_id` and `created_by` to `auth.uid()`. Explicitly exclude `is_demo = true` rows from all membership writes.

#### P1-RLS-02 — Membership role is not authorization

**Location:** local migration lines 43, 126, 142-147, 162-168, 183-189, 204-210, 225-227, and 245-254.

The schema defines `owner`, `collaborator`, and `viewer`, but the policies check only whether a user is a member. Any member can update or delete case content, submit a complaint, and remove other memberships. The delete policy is named “owners can remove case members” but uses only `is_case_member(incident_id)`.

**Attack scenario:** A viewer added for consultation directly updates a timeline row to `verification_status = 'confirmed'`, alters a complaint, removes the owner membership, or deletes evidence.

**Recommended fix:** Define capability predicates (`is_case_owner`, `can_edit_case`) and apply them consistently to INSERT/UPDATE/DELETE. Make viewers read-only. Protect the owner row and require a controlled ownership-transfer operation.

#### P1-RLS-03 — Direct Data API writes can bypass the AI verification contract

**Location:** local migration policies for incidents, facts, timeline events, and evidence.

Real members are permitted to insert/update rows containing arbitrary `verification_status`, `provenance`, `source`, and status values. The database does not require a confirmed fact to have a citizen verification record, nor does it restrict who can change incident status. The API’s normal flow is not a substitute for a database boundary when the public Supabase key exposes the Data API.

**Recommended fix:** Make candidate/verification writes server-only or use narrowly scoped RPCs. Enforce immutable extraction provenance and a verified-at/verified-by invariant. Restrict incident status transitions to a server-side command with explicit authorization.

#### P1-RLS-04 — Demo rows are still writable by anonymous users

**Location:** local migration lines 131-143 and the original demo migration lines 93-127.

The `is_demo = true` branch intentionally permits anonymous SELECT/INSERT/UPDATE on the shared synthetic dataset. That is acceptable only for an isolated demo dataset and demo-only endpoints. It is not a safe default for a database that also contains real cases.

**Recommended fix:** Put demo data in a separate environment or schema where possible. Otherwise make demo writes use an explicit demo session/token and keep them inaccessible to authenticated real-case APIs.

#### P2-RLS-05 — Public execution of security-definer helpers is not hardened

**Location:** local migration lines 17-31 and 52-65.

The migration does not revoke default EXECUTE privileges from `public` for `handle_new_user()` or `is_case_member()`. `is_case_member()` also accepts an arbitrary `check_user_id`, exposing a membership oracle if it is callable through RPC. `set search_path = public` is good practice, but it does not replace least-privilege execution grants.

**Recommended fix:** Revoke EXECUTE from `public` and grant only to the roles/functions that need it. Remove the arbitrary user-ID parameter from the authorization helper or enforce the current authenticated user inside the function.

### RLS capability matrix

| Resource | Live SELECT | Live INSERT | Live UPDATE | Live DELETE | Intended alpha result |
|---|---|---|---|---|---|
| `incidents` | Demo only | Demo only | Demo only | Denied by policy | Own/member cases only; owner-controlled transitions |
| `case_members` | Table absent | Table absent | Table absent | Table absent | Owner/invite-controlled membership |
| `evidence` | Demo only | Demo only | Demo only | Denied by policy | Case member read; editor/owner write |
| `facts` | Demo only | Demo only | Demo only | Denied by policy | Case member read; server verification writes |
| `timeline_events` | Demo only | Demo only | Demo only | Denied by policy | Case member read; server verified-event writes |
| `complaints` | Demo only | Demo only | Demo only | Denied by policy | Case member read; owner/editor submit |
| `complaint_events` | Demo only | Demo only | No demo update policy | Denied by policy | Case-scoped append-only events |
| `profiles` | Table absent | Table absent | Table absent | Table absent | Self-only profile read/update |
| `storage.objects` | RLS enabled, no policies | No policy | No policy | No policy | Case-scoped access or server-only access |

## Storage audit

### Verified configuration

The live `cyberdesk-evidence` bucket is:

- private (`public = false`);
- limited to 5,242,880 bytes;
- restricted to `image/png`, `image/jpeg`, `application/pdf`, and `text/plain` at bucket configuration level;
- backed by an empty `storage.objects` policy set.

With no object policies, anonymous and authenticated clients cannot use the bucket directly under RLS. The application instead uses a server-side service-role client in `app/api/cases/[id]/evidence/upload/route.ts` and the legacy demo upload route.

### Storage findings

#### P1-STORAGE-01 — Storage authorization depends entirely on the API gate

**Location:** `app/api/cases/[id]/evidence/upload/route.ts:37-68`; `lib/supabase.ts:60-73`.

The upload route checks membership, then uploads with service-role credentials, which bypass RLS. This can be acceptable as a deliberate server-only design, but there is no Storage-layer case-membership policy as defense in depth. The design is also not verifiable against the live alpha because `case_members` is absent.

**Attack scenario:** Any bypass in the route’s authentication or membership check gives the caller service-role-backed write access to an arbitrary `cases/<caseId>/...` path.

**Recommended fix:** First fix authentication and membership. Then either add carefully reviewed Storage policies that resolve the case UUID from the path, or keep service-role access strictly server-only with a centralized authorization wrapper and integration tests for User A → User B paths. Never expose the service-role key or return public URLs.

#### P2-STORAGE-02 — File content is not verified by magic bytes

**Location:** `lib/evidence.ts:53-66`; both upload routes.

The server validates extension and the browser-reported MIME type, but does not inspect file signatures. A renamed or polyglot file can be stored with a trusted content type. The bucket’s MIME configuration is not a replacement for content inspection, particularly because the server uses service-role upload.

**Recommended fix:** Add bounded signature checks and malware/content scanning before any provider processing. Keep files non-executable and never render untrusted HTML/SVG as evidence.

#### P2-STORAGE-03 — Case IDs are not validated before path construction

**Location:** `app/api/cases/[id]/evidence/upload/route.ts:31,57-60`.

The route interpolates the dynamic route parameter into a storage path without validating it as a UUID. The filename is sanitized, but the case ID is not. Next.js routing limits common slash traversal, yet a UUID allowlist is the correct invariant for this endpoint.

**Recommended fix:** Validate `caseId` as a UUID before authorization and path construction; use a server-generated evidence UUID and a fixed path builder.

## API authorization audit

| Endpoint | Auth check | Case/membership check | Result |
|---|---:|---:|---|
| `GET /api/cases` | Yes, `getAuthenticatedUser()` | Query intends RLS/member filtering | Undermined by spoofable test headers; live ownership tables absent |
| `POST /api/cases` | Yes | Creation delegated to case store | Uses service role for two independent writes; live schema rejects alpha columns |
| `GET /api/cases/[id]` | Yes | Store checks membership | Returns 404 for no detail; route parameter is not UUID-validated |
| `POST /api/cases/[id]/evidence/upload` | Yes | Explicit pre-check | Returns 403 for non-members; uses service role after the check |
| `POST /api/cases/[id]/evidence/extract` | Yes | Explicit pre-check | Client-supplied evidence payload is persisted; no server lookup/correlation |
| `POST /api/cases/[id]/evidence/verify` | Yes | Explicit pre-check | Client can submit confirmed/provenance fields; stale timeline is not removed |
| `POST /api/cases/[id]/reports/submit` | Yes | Explicit pre-check | Any recognized member can submit; status transitions are not role-gated |
| `/api/evidence/*` | No | None | Legacy shared demo mutation endpoints |
| `/api/reports/submit` | No | None | Legacy shared demo submission endpoint |
| `/api/demo-case` | No | Fixed demo read | Public by design |
| `/api/ai/*` | No | No case data access | Public AI utilities; no rate limit |

#### P0-API-01 — Authentication check can be bypassed before authorization

This is the primary API issue. `getAuthenticatedUser()` accepts synthetic headers before it attempts to validate a bearer token. The detailed finding is in the Authentication section below. Because all case-scoped routes trust this function, the downstream membership checks do not establish a real user boundary.

#### P1-API-02 — Legacy demo writes are callable by authenticated users

**Location:** `app/api/evidence/upload/route.ts`, `app/api/evidence/extract/route.ts`, `app/api/evidence/verify/route.ts`, and `app/api/reports/submit/route.ts`.

These routes have no authentication and write the fixed `hero-financial-fraud` demo key via `lib/server-store.ts:7,46-56,245-286`. A signed-in user can call them directly, add evidence to the shared demo, alter its synthetic complaint, and affect the shared demo state. This does not expose a real case today, but it violates the stated requirement that real users must not modify or claim the demo case.

**Recommended fix:** Gate legacy routes to an explicit unauthenticated/demo-only mode, use a separate demo store/environment, or make them read-only and move demo mutation behind a dedicated demo session.

#### P1-API-03 — Non-member 403 responses create a case-existence oracle

**Location:** all new evidence/report routes, for example `app/api/cases/[id]/evidence/upload/route.ts:37-40`.

The route returns `403 Forbidden: You are not a member of this case` after a failed membership check. A caller can distinguish a known existing case from a nonexistent case if the membership helper returns different outcomes or timing. The detail route returns a generic 404, but the API family is inconsistent.

**Recommended fix:** Return the same generic 404 for nonexistent and unauthorized case IDs on all case-scoped endpoints. Log the internal reason server-side.

#### P1-API-04 — Verification API trusts client-authored provenance and status

**Location:** `app/api/cases/[id]/evidence/verify/route.ts:28-43`; `lib/case-store.ts:562-645`.

The endpoint accepts an entire evidence object from the client. It does not load the stored candidate extraction, compare field values, or ensure that a field was actually returned by the server extraction operation. A caller can label a manually invented field as an AI suggestion or submit a confirmed field without a preceding candidate record. This is not a cross-user read, but it breaks provenance integrity and the “AI suggests, citizen verifies, CyberDesk records” contract.

**Recommended fix:** Persist extraction server-side, accept only field decisions and corrected values by stable evidence/field ID, derive provenance server-side, and reject unknown fields. Keep manually added facts explicitly citizen-originated.

#### P1-API-05 — Storage failure is reported as secure success in the case UI

**Location:** `app/cases/[id]/page.tsx:145-153`.

The upload API can return `uploadStatus = failed` or `local_only`, but the client immediately sets `Evidence file securely stored` without checking that status. This can cause a citizen to believe a private copy exists when it does not.

**Recommended fix:** Render the API’s explicit storage state and continue only with a message that distinguishes cloud storage from session-only processing.

#### P1-API-06 — Verified timeline rows remain after all source fields are rejected

**Location:** `lib/case-store.ts:622-643`.

The live path upserts a timeline event when a confirmed amount/reference/date/time exists, but does nothing when a previously confirmed evidence item is later submitted with all those fields rejected. The prior “confirmed” event therefore remains in the timeline.

**Recommended fix:** Reconcile facts and timeline rows transactionally: upsert current confirmed facts, mark/remove stale facts, and delete or mark stale evidence-derived timeline events when no confirmed source fields remain.

#### P2-API-07 — No UUID validation or consistent request limits at the case boundary

The case ID is not schema-validated, and the extraction content schema permits up to 7,500,000 characters. There is no visible per-user rate limit on upload, extraction, AI interpretation, or magic-link requests.

**Recommended fix:** Validate UUIDs, enforce request/body and provider-cost budgets, add abuse/rate limiting, and use request IDs without logging evidence contents.

## Authentication audit

### Positive controls

- Supabase browser client uses persistent sessions and token refresh in `lib/supabase.ts:8-21`.
- Magic-link sign-in uses Supabase `signInWithOtp()`.
- Supabase access tokens are validated with `auth.getUser(token)` when the normal bearer path is used.
- OpenAI and service-role credentials are not stored in `NEXT_PUBLIC_*` variables.
- The callback uses a fixed `/cases` destination rather than a user-controlled post-login path.

### P0-AUTH-01 — Arbitrary test headers are accepted as production authentication

**Location:** `lib/auth-server.ts:57-77` and `lib/auth-server.ts:105-119`; client producer `lib/auth-context.tsx:219-230`.

`getAuthenticatedUser()` checks `x-test-user-id` and `x-test-user-email` before bearer-token validation. If the email is unknown, it calls `registerMockUser()` and creates a user from caller input. The header branch is not guarded by `NODE_ENV`, a private test secret, localhost, or `CYBERDESK_FORCE_LOCAL_STORE`. The mock user seed also runs unconditionally at `lib/auth-server.ts:47-51`.

**Attack scenario:** An unauthenticated Internet caller sends:

```http
x-test-user-email: attacker@example.com
```

The API returns an `AuthContext` without a Supabase session. With the local fallback path, the caller can create and access cases under the fabricated identity. Supplying `x-test-user-id: user-alpha-001` or `user-beta-002` impersonates the seeded demo test users. This defeats every downstream API authorization check.

**Recommended fix:** Remove test-header authentication from application runtime. If offline tests require it, isolate it behind a test-only server build or a private test secret that is impossible to enable in production. In production accept only a validated Supabase JWT/session. Add a deployment assertion that refuses to boot if test-auth mode is enabled outside local test execution.

### P1-AUTH-02 — Client-only session storage is the application’s primary browser persistence

**Location:** `lib/auth-context.tsx:29-73,135-164,205-217`; `lib/supabase.ts:13-19`.

Real Supabase sessions are persisted in browser `localStorage`, while simulated sessions are persisted in `sessionStorage`. The protected pages are client components and there is no middleware or server-side route guard. A browser with an XSS foothold can read the local session material, and direct page requests receive the protected shell before client-side redirection.

**Recommended fix:** Use the Supabase SSR cookie pattern for server-visible sessions, add middleware/server authorization for private routes, and add a CSP/XSS review. Keep test sessions entirely outside production code paths.

### P2-AUTH-03 — Sign-in redirect URL is not allowlisted

**Location:** `app/api/auth/sign-in/route.ts:5-8,28-32`; `lib/auth-context.tsx:168-188`.

The API accepts an arbitrary `redirectTo` string and passes it as `emailRedirectTo`. Supabase project redirect configuration may limit the final result, but the application route does not enforce same-origin `/auth/callback` behavior itself.

**Recommended fix:** Ignore arbitrary redirect URLs or allow only same-origin URLs with an exact callback path and controlled state parameter.

### P2-AUTH-04 — Logout is client-first and errors are ignored

**Location:** `lib/auth-context.tsx:205-217`.

The client clears local state before calling `supabase.auth.signOut()` and ignores sign-out errors. Existing access tokens can remain usable until expiry depending on the configured sign-out scope and token lifecycle.

**Recommended fix:** Use a server-aware logout flow, clear cookies/storage, handle failure visibly, and confirm the server no longer accepts the session. Do not treat UI state clearing as revocation proof.

## Demo isolation audit

The demo identity remains hardcoded in `lib/server-store.ts:7` as `hero-financial-fraud`, and the original migration seeds it as `is_demo = true`. The demo journey on `/` remains unauthenticated and visibly synthetic, which preserves the intended hackathon path.

However:

- The legacy demo API family can be called from an authenticated browser or directly by any caller.
- If the local ownership migration is applied unchanged, the flawed case-member INSERT policy lets a user add themselves to a demo incident.
- The local migration permits member-based incident UPDATE and does not include a hard exclusion preventing a demo row from entering a real-member workflow after a membership is attached.
- `tests/authorization.spec.ts` does not attempt to mutate the demo through the legacy API while signed in.

**Result:** Demo data is structurally labelled, but not operationally isolated from authenticated mutation.

## AI and provenance audit

### Controls that are present

- `lib/ai.ts:20`, `52`, and `224` explicitly describe incident/evidence input as untrusted content and instruct the model not to follow embedded instructions.
- OpenAI Responses API calls use `store: false` and structured JSON schema output.
- Zod validates extraction response fields and limits field count/value sizes.
- Restricted values such as OTPs, PINs, CVV, passwords, Aadhaar/PAN and likely full card numbers are filtered by `lib/evidence.ts:86-93`.
- OpenAI failure produces a deterministic, visibly labelled fallback.
- Extracted fields default to `candidate`; the UI provides accept/edit/remove controls.

### Findings

#### P1-AI-01 — The server does not establish provenance from stored extraction state

The verification endpoint accepts client-provided field status/source/provenance. The model cannot directly mutate the database, but a client can impersonate model provenance and promote arbitrary values through the same endpoint.

This is primarily an integrity issue; it becomes a security issue if downstream users or investigators rely on provenance labels as evidence of how a fact was produced.

**Recommended fix:** Store extraction results server-side, bind every decision to the stored candidate row, and create a separate immutable verification record containing `verified_by`, `verified_at`, prior value, and corrected value.

#### P1-AI-02 — Candidate fact persistence is broader than the verified timeline contract

`saveCaseVerifiedEvidence()` writes all candidate fields, including rejected and still-candidate fields, into `facts`. The UI filters confirmed facts, but the database contains mixed-status facts and the timeline reconciliation does not remove stale confirmed events.

**Recommended fix:** Keep candidate extraction separate from confirmed facts, or make every consumer filter status at the query boundary and reconcile transitions transactionally.

#### P2-AI-03 — Image/PDF uploads are not actually supplied to the case extraction call

`app/cases/[id]/page.tsx:155-167` sends text content only for TXT files. For PNG/JPG/PDF, the extraction request contains metadata without the file bytes or a server-side download of the private object. The AI route therefore cannot perform meaningful visual/PDF extraction for those formats even when OpenAI is configured.

**Recommended fix:** Have the server retrieve the private object after authorization and pass a bounded, provider-supported representation to the extraction function. Document the provider retention and privacy implications.

#### P2-AI-04 — Public AI routes have no visible abuse controls

`/api/ai/interpret` and `/api/ai/explain-status` are public and accept bounded caller input. They do not access private case data, but an attacker can generate provider cost and submit prompt-injection content repeatedly.

**Recommended fix:** Rate-limit by IP/session, cap provider spend, validate status context, and keep private-case explanations on authenticated case routes.

## Data privacy audit

### Stored data categories

| Category | Current/proposed data | Assessment |
|---|---|---|
| Identity | Supabase email; proposed profile email/name; mock test identities | Email/name are more than the demo needs and need retention/access controls |
| Incident | Description, type, urgency, status | Potentially sensitive narrative; currently demo-only in live DB |
| Evidence metadata | Filename, type/category, MIME, storage path, statuses | Filename and path can reveal sensitive context |
| Extracted facts | Amounts, references, dates, phone/email/URL/institution/sender | High sensitivity; must remain candidate/verified and case-scoped |
| Timeline | Event descriptions and evidence provenance | High sensitivity when real cases exist |
| Complaints | Narrative and acknowledgement metadata | High sensitivity; no official submission is performed |
| Uploaded files | Private bucket objects when configured | Real PII should remain out of this prototype until auth/storage tests pass |

### Positive privacy boundaries

- Repository documentation prohibits passwords, OTPs, PINs, CVV, full card numbers, Aadhaar and PAN.
- There is no `NEXT_PUBLIC_OPENAI_API_KEY` or service-role key in the environment file.
- No service-role key value was found in the built client; the publishable Supabase client configuration is expected to be public.
- Storage is private and no public signed URL is returned.
- OpenAI calls use `store: false`.

### Risks

- A real uploaded TXT/image/PDF can be sent to OpenAI by the eventual extraction path. This needs an explicit user disclosure, provider/data-processing review, and retention decision.
- Browser localStorage holds Supabase session material, increasing the impact of any XSS.
- The callback renders `err.message` in the error UI (`app/auth/callback/page.tsx:41-57`), which can expose provider internals to users.
- Console logging of provider/storage/auth errors needs a production redaction review. Evidence contents are not intentionally logged in the inspected code, but error objects should still be treated as potentially sensitive.
- There is no retention, deletion, export, account deletion, or incident purge workflow.
- File signatures are not checked and no malware scanning is present.

No code currently requests passwords, OTPs, PINs, CVV, full card numbers, Aadhaar, or PAN as incident fields. This is a good boundary, but it is enforced mostly by UI/schema/filter logic rather than a complete persistence policy.

## Routing audit

### Public routes

`/`, `/about`, `/how-it-works`, `/resources`, `/safety`, `/login`, and `/auth/callback` are public. The root experience and legacy demo routes intentionally support an unauthenticated synthetic journey.

### Private routes

`/cases`, `/cases/new`, and `/cases/[id]` are protected only by client-side `AuthProvider` state and API calls. There is no `middleware.ts` and no server-side page guard.

I directly requested the three private paths without authentication; each returned HTTP `200` and the protected HTML shell. The client later redirects or displays access denied, and the APIs return `401`, so no case payload was observed in the HTML. This is still weaker than a protected route boundary and can leak private-page existence/metadata through caching, timing, or future server-rendered changes.

Case IDs are UUIDs generated by `crypto.randomUUID()`, which makes enumeration difficult. They are not schema-validated at the route boundary, and the first eight characters are shown in the workspace UI.

## Test audit

There are 23 logical tests run across desktop and mobile projects, producing the reported 46 test cases:

- `tests/journey.spec.ts`: 13 logical tests, including Golden Journey, evidence validation, fallback, field controls, refresh and 390/412 viewport checks.
- `tests/authorization.spec.ts`: 10 logical tests, mainly API denial checks and one UI access-denied check.

### What the tests prove

- The local deterministic journey still works.
- Synthetic evidence UI validation and field controls work under mocked/network-intercepted responses.
- Local in-memory User A/User B case checks deny the tested cross-user paths.
- Unauthenticated requests to the tested case APIs return 401 in forced local mode.

### What is untested or not actually proven

- Real Supabase magic-link delivery, callback exchange, session persistence, and logout.
- Live RLS policies and `auth.uid()` behavior.
- Storage object upload/download/delete isolation.
- A direct User A → User B Data API request.
- Two durable cases for one real user.
- Evidence and timeline ownership across two live cases.
- Demo mutation attempts by an authenticated user.
- The local ownership migration being applied to the connected project.
- 403/404 uniformity and case-existence leakage.
- Viewer versus collaborator versus owner capabilities.
- Role/member management and owner protection.
- Malformed UUIDs and storage-path abuse.
- Real OpenAI structured success; the evidence success test intercepts the route rather than calling OpenAI.
- AI prompt-injection fixtures and provider-cost/rate-limit behavior.
- Upload failure messaging in the authenticated case page.
- Rejection after a previously confirmed timeline event.
- Retention, deletion, privacy, and log redaction.

The authorization tests use headers such as `x-test-user-id` and `Bearer mock-token-*`, and `playwright.config.ts` forces `CYBERDESK_FORCE_LOCAL_STORE=1`. These are appropriate fixtures for a demo harness but cannot be counted as Auth/RLS isolation evidence.

## P0/P1/P2/P3 backlog

### P0 — must fix before any authenticated alpha exposure

1. **Remove the authentication bypass** (`lib/auth-server.ts:57-103`; `lib/auth-context.tsx:29-73,219-230`). Accept only validated Supabase sessions in deployed builds.
2. **Fix the membership insertion policy before applying the ownership migration** (`202608280004_user_case_ownership.sql:122-124`). No self-join; owner/invitation/server-controlled membership only. Explicitly isolate demo incidents.

### P1 — serious blockers for alpha

1. Deploy and verify the ownership migration; current Supabase is demo-only.
2. Gate or remove legacy unauthenticated demo mutation routes.
3. Enforce role capabilities and protect the owner membership.
4. Prevent direct client-authored verification/provenance and status writes.
5. Make evidence/fact/timeline relationships case-consistent.
6. Make case creation transactional and fail if owner membership creation fails (`lib/case-store.ts:379-415`).
7. Return uniform 404 responses for unauthorized/nonexistent case IDs.
8. Correct the storage-failure UI message.
9. Reconcile stale facts/timeline rows when a citizen rejects previously confirmed data.
10. Add a server-only, case-authorized Storage access strategy with integration tests.

### P2 — important hardening

1. Add SSR cookie sessions and server/middleware route protection.
2. Allowlist authentication redirect URLs.
3. Validate UUIDs and file signatures; add malware scanning before provider processing.
4. Add rate limits and provider-cost budgets to Auth, upload, extraction, and public AI routes.
5. Add retention, deletion, redaction, and account-data export decisions.
6. Avoid bundling the service-role helper into the client graph; split browser/server Supabase modules.
7. Implement actual authorized image/PDF extraction or state clearly that the prototype extracts TXT only.

### P3 — future maturity

1. Immutable audit log for verification changes.
2. Formal dossier versioning and export.
3. Invitation/member-management UX.
4. Dedicated staging project and migration/rollback automation.
5. Monitoring, incident response, dependency scanning, and privacy review.

## Scores

| Area | Score | Reason |
|---|---:|---|
| Authentication | 2/10 | Real Supabase primitives exist, but arbitrary test headers can produce auth contexts |
| Authorization | 1/10 | Live ownership is absent; intended membership INSERT is privilege-escalating |
| RLS | 2/10 | Current demo RLS works only for demo rows; alpha RLS is not deployed and is flawed locally |
| Storage security | 5/10 | Private bucket, 5 MB and MIME limits; no object policies and service-role access depends on API auth |
| API security | 3/10 | New routes have gates, but auth is bypassable and legacy demo writes are public |
| AI safety | 6/10 | Structured output, untrusted-content instructions and filtering exist; provenance/state reconciliation is incomplete |
| Privacy | 5/10 | Strong documentation and no obvious secret-field collection; no retention/deletion, XSS/session and provider risks remain |
| Data model | 4/10 | Good conceptual entities and FKs; live schema is demo-only and local ownership invariants are incomplete |
| Testing | 3/10 | 46 cases pass in a mock harness; no live Auth/RLS/Storage isolation proof |
| Architecture | 4/10 | Modular and incremental, but dual stores, client/server mixing, schema drift and non-transactional writes remain |

**Overall:** 3/10 for authenticated alpha security; 6/10 for the synthetic hackathon demo experience.

### Readiness assessment

- **Hackathon readiness:** Yes, for the clearly synthetic Golden Journey with no real citizen data.
- **Alpha readiness:** No. P0 auth bypass and absent live ownership schema are blockers.
- **Production readiness:** No. RLS/Storage/Auth verification, privacy lifecycle, rate limiting, auditability, and deployment controls are incomplete.

## Recommended next milestone

Make the next milestone a **security remediation and live-isolation gate**, not another product feature:

1. Remove runtime test authentication and add a separate test-only authentication harness.
2. Correct and deploy the ownership schema to a staging Supabase project.
3. Implement owner/editor/viewer capabilities and demo isolation.
4. Add transactional case creation and server-derived provenance.
5. Add live Supabase Auth/RLS/Storage tests, including direct User A → User B attempts.
6. Re-run the audit against the staging project and require a clean, exit-0 test run.

Until that gate passes, keep the product in synthetic/demo mode and explicitly prohibit real citizen evidence or PII.

