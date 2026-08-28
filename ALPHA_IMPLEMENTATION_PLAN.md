# CyberDesk Multi-user Alpha — Implementation Plan

**Status:** Proposed after read-only reconnaissance; no alpha schema or application changes applied yet.

## Verified current state

- The public experience and 26-test Golden Journey live in `app/page.tsx` as a single-case state machine persisted to `sessionStorage`.
- `lib/server-store.ts` persists every cloud case through the hardcoded `DEMO_KEY = "hero-financial-fraud"`; its fallback store is also one shared demo case.
- Supabase currently has `incidents`, `evidence`, `facts`, `timeline_events`, `complaints` and `complaint_events`. Every exposed table is RLS-enabled, but the policies permit anonymous access when `is_demo = true`.
- The existing evidence pipeline is reusable: evidence metadata, extraction, provenance, verification and timeline derivation already have stable contracts and routes.
- Supabase Auth is not yet used. Supabase Storage is private and currently server-only for the synthetic bucket.

## Proposed smallest safe model

Reuse `public.incidents` as the physical case table during the transition; its UUID `id` becomes the case/workspace identifier. Do not add a duplicate `cases` table.

Add:

- `profiles(id references auth.users)` with no unnecessary personal fields;
- `case_members(case_id, user_id, role)` with `owner`, `editor`, `viewer` roles and an owner row for every authenticated case.

Keep `incident_id` as the existing case foreign key on evidence, facts, timeline events and complaints. This preserves relationships without duplicating `case_id` columns. Make `demo_key` nullable and retain it only for the isolated seeded demo. New authenticated cases use generated UUIDs and `is_demo = false`.

## Auth and request model

- Use Supabase Auth passwordless email magic links through the browser client; the email is authentication identity, never incident content.
- Persist the Supabase session in the browser and provide sign-in, sign-out and session restoration.
- Authenticated API requests carry the Supabase access token; server routes resolve the user with Supabase Auth and never trust a client-supplied user id.
- Keep `/` and the seeded demo unauthenticated and explicitly synthetic. Authenticated case APIs must never fall back to the shared demo case.

## Routing rollout

1. Preserve `/` and all existing Golden Journey selectors unchanged.
2. Add `/workspace` as an authenticated “My cases” shell.
3. Add `/workspace/[caseId]` as the authenticated case shell with incremental links for understanding, evidence, timeline, review and tracking.
4. Move screens one at a time only after the shell and case API are proven. The existing demo state machine remains the compatibility path during the rollout.

## API/server changes

- Add authenticated case APIs for create, list, read and update of the caller’s cases.
- Split `server-store` into explicit demo and authenticated paths. A missing session returns `401`; it must not select `hero-financial-fraud`.
- Add case ownership checks to evidence upload, extraction, verification, report submission and case tracking.
- Reuse the current evidence extraction and verification logic; pass the authenticated case id through the persistence boundary.
- Keep OpenAI server-only and preserve candidate provenance and citizen verification rules.

## Supabase migration and RLS

Create one reviewed migration that:

1. adds `profiles` and `case_members`;
2. relaxes the legacy demo-only `is_demo` check so new owned rows can be non-demo while existing rows remain synthetic;
3. makes `incidents.demo_key` nullable and adds ownership indexes;
4. replaces broad demo policies with separate public demo policies and authenticated membership policies;
5. applies membership checks to incidents, evidence, facts, timeline events, complaints and complaint events;
6. adds private Storage policies for `cases/<case-uuid>/<evidence-uuid>/...` paths;
7. keeps the existing demo row readable only through its explicit demo policy.

Policies will use `auth.uid()` and `case_members`; no authorization decision will use editable user metadata. Storage service-role access, if retained for server uploads, will remain server-only and behind an authenticated membership check.

## Test strategy

- Run the existing 26 Playwright tests unchanged first and after every routing change.
- Add alpha coverage for public access, sign-in/session restoration, case creation, two cases for one user, cross-user case/evidence/timeline denial, refresh, demo isolation, logout and protected-route behavior.
- Prefer a disposable authenticated Supabase test fixture or a dedicated test project. Do not add a production backdoor or weaken RLS to make tests pass.
- Add direct API authorization tests for missing/invalid bearer tokens and attempted IDOR access.

## Rollback and safety

- The first migration is additive/reversible at the application level and does not delete demo data.
- Existing `/` demo APIs remain unchanged until authenticated replacements are verified.
- Do not accept real citizen evidence in this alpha until Auth, RLS and Storage tests pass against an authenticated user.

## Decision gate before implementation

The implementation depends on two explicit choices:

1. **Reuse `incidents` as the canonical case table** rather than introducing a parallel `cases` table. This is the smallest migration and preserves every existing foreign key and demo selector.
2. **Use passwordless email magic links** rather than passwords, phone OTP collection or a custom account system. This keeps Auth simple without treating incident secrets as identity data.

If these choices are accepted, implementation can proceed incrementally without changing the Golden Journey.
