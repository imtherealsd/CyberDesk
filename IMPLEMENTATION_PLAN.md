# CyberDesk Realistic Evidence Pipeline — Implementation Plan

**Scope:** Evidence milestone only. Preserve the existing journey, visual language, demo button, selectors and safety boundaries.

## Reconnaissance update (28 Aug 2026)

The repository and connected Supabase project have now been inspected before implementation. The local app already contains a first-pass version of this milestone, including `lib/evidence.ts`, the three evidence routes, additive migrations, a private `cyberdesk-evidence` bucket, field-level candidate status, and Playwright coverage. The baseline typecheck and lint pass. The baseline Playwright run passes the original journey, but exposes evidence-specific failures: the upload progress copy does not match the intended state, deterministic reference parsing captures the word `reference`, fallback copy is duplicated in strict locators, and the evidence workspace can overflow a 390px viewport. These are implementation gaps to fix, not reasons to replace the product.

The connected Supabase project is `gddtzdzktbvwjhrtacax`, PostgreSQL 17, with the realistic-evidence migrations already applied under remote migration versions `20260827200458` and `20260827200836`. The existing schema has the additive evidence fields, foreign keys and idempotency indexes. The private `cyberdesk-evidence` bucket already exists with a 5 MB limit and PNG/JPEG/PDF/TXT MIME restrictions. Storage has no anonymous object policies, which is appropriate for this unauthenticated demo; server-side storage remains optional and must report session-only fallback honestly. Existing public-table policies are explicitly synthetic-only (`is_demo = true`).

## Current evidence architecture

- `app/page.tsx` owns a deterministic single-incident state machine and persists the browser journey in `sessionStorage`.
- `EvidenceScreen` renders one `EvidenceItem`; the only creation path is the synthetic transaction notification.
- `EvidenceItem.candidateFields` is a small label/value/source array and the whole item changes from `candidate` to `confirmed` together.
- `lib/mock-data.ts` derives the timeline and review facts from the current React state. It does not persist timeline rows during verification.
- `/api/reports/submit` is the only evidence write path today. It upserts the synthetic evidence at final submission.
- `lib/server-store.ts` uses Supabase when configured and an in-memory fallback otherwise. The Supabase path is keyed to `hero-financial-fraud` and is intentionally demo-only.
- OpenAI currently supports incident interpretation and synthetic-status explanation. There is no focused evidence extraction route.
- The existing Supabase project has `incidents`, `evidence`, `facts`, `timeline_events`, `complaints` and `complaint_events`, all with synthetic-only RLS. The private `cyberdesk-evidence` storage bucket is present, with no anonymous object policies. Live inspection also showed the existing shared demo key and duplicate test evidence rows, so the new writes must be idempotent and no existing demo data should be deleted.

## Existing limitations

1. No file input, file validation, upload state or storage reference is exposed to the citizen.
2. No evidence category or MIME/upload/extraction lifecycle is represented.
3. AI extraction is not implemented.
4. Candidate fields have no stable field key, evidence id, field-level verification state or persisted provenance.
5. Verification is only a UI state change; verified facts and timeline events are not written at the moment of confirmation.
6. The demo is intentionally not authenticated and cannot safely represent real citizen data. This milestone remains synthetic/demo-only.

## Proposed deliberately small data model

Keep the existing tables and add only the fields needed to represent the pipeline:

### `evidence`

- existing `id`, `incident_id`, `filename`, `source`, `storage_reference`, `extracted_fields`, `verification_status`, timestamps;
- add `category` (`transaction`, `bank_communication`, `sms`, `whatsapp_message`, `email`, `screenshot`, `link`, `caller_contact`, `other`);
- add `mime_type`;
- add `upload_status` (`demo`, `uploaded`, `local_only`, `failed`);
- add `extraction_status` (`not_started`, `processing`, `complete`, `fallback`, `failed`);
- add `extraction_notes`;
- retain `is_demo = true` as the database-level prototype boundary.

### `facts`

Reuse the existing table for candidate and confirmed fields. Add:

- `evidence_id` referencing `evidence.id`;
- `field_key` for deterministic upserts (`transactionAmount`, `transactionReference`, `eventDate`, `eventTime`, `phoneNumber`, `email`, `url`, `platform`, `institution`, `senderRecipient`, `incidentClue`);
- `provenance` JSONB containing evidence id, extraction source and whether the value was citizen-confirmed;
- a partial unique index on `(incident_id, evidence_id, field_key)`.

The field value remains JSONB, and `source`, `verification_status` and `verified_at` remain queryable. The model can return a qualitative confidence signal, but the UI will not show misleading percentages and confidence will never substitute for confirmation.

### `timeline_events`

Add `event_key`, `evidence_id` and `time_precision` (`exact`, `date`, `approximate`, `unknown`) with a partial unique index on `(incident_id, event_key)`. An exact timestamp is stored only when the uploaded evidence provides one. A date-only or unknown event uses a display label and a null `event_time`; no clock time is fabricated.

### Dossier foundation

No new dossier table yet. Define a typed dossier projection in server code from the incident, verified facts, evidence, timeline, guidance and status. The current review screen remains the print/export-ready view; PDF generation is deferred unless it falls out of the existing structure without adding meaningful complexity.

## Upload and storage approach

1. Add a private `cyberdesk-evidence` Supabase Storage bucket, restricted to PNG, JPEG, PDF and TXT with a 5 MB limit.
2. Use server-side route handling for storage operations. The browser receives only safe metadata and a storage path, never a public URL or service-role credential.
3. Store objects under `demo/<incident-key>/<evidence-id>/<sanitised-filename>` so the current anonymous prototype policies cannot be mistaken for tenant isolation.
4. Do not add anonymous Storage object policies. The private bucket is accessed only through a server-side service-role client when `SUPABASE_SERVICE_ROLE_KEY` is configured; this avoids exposing shared evidence objects in the unauthenticated prototype.
5. If Storage is unavailable, return an honest `local_only`/`failed` state and keep the accepted metadata plus extraction result in the current browser session. Do not claim a cloud upload succeeded.
6. Validate MIME, extension and size on the server and in the UI. Never store or display passwords, OTPs, PINs, CVV, full card numbers, Aadhaar or other unnecessary identity data.

## OpenAI extraction approach

- Add `lib/ai.ts` `extractEvidence()` using the existing server-only OpenAI Responses API and strict JSON schema output.
- The input contains evidence metadata and untrusted content. System instructions explicitly say the content is data, not instructions, and prohibit secrets, invented values and official/legal conclusions.
- The output is `{ candidate_fields, source_reference, uncertainties, extraction_notes }`; every candidate field includes a stable key, citizen-friendly label, value, source, evidence id and qualitative confidence.
- Text files are sent as bounded text. Where storage is available, the server can download the private object for processing. Image/PDF handling is bounded to the supported prototype set; if a provider/model cannot process the format, the route returns the deterministic fallback rather than pretending OCR succeeded.
- Validate every response server-side before returning it. Model output never directly changes incident state.
- Deterministic fallback extracts only safe fields from TXT content and known synthetic file names. Fallback values are labelled demo information, not AI suggestions.

## Human verification flow

1. Citizen selects **Add evidence**, chooses a friendly category, then selects a PNG, JPG/JPEG, PDF or TXT file.
2. UI shows filename/type and honest upload/progress state.
3. UI shows a distinct processing state while extraction runs.
4. UI shows **CyberDesk found these possible details** with each field labelled **AI suggestion** or **Demo information**.
5. Each field has **Accept**, **Edit**, and **Reject/remove**. Editing creates a citizen-confirmed value; rejecting persists a rejected field and excludes it from trusted facts.
6. Only after the citizen confirms does the client call the verification API. The API upserts the evidence, candidate/confirmed facts and relevant timeline event deterministically.
7. The timeline and review projection use only confirmed values or explicitly labelled synthetic demo values.

The existing synthetic button remains unchanged and continues to seed the golden demo path.

## Security and privacy boundaries

- Continue to keep `OPENAI_API_KEY` server-side and never add any service-role key to `NEXT_PUBLIC_*`.
- Treat filenames, TXT contents, PDF text and OCR/model output as untrusted data.
- Redact/ignore secrets in deterministic extraction and instruct OpenAI never to return them.
- Keep `is_demo = true`, the demo incident key and anonymous RLS clearly prototype-only. This milestone does not claim multi-tenant or production citizen-data security.
- Do not expose private storage URLs; only server code accesses stored objects.
- Keep official reporting guidance separate. Uploading or verifying evidence does not freeze money, file an FIR, contact a bank, or guarantee recovery/investigation.

## API changes

- `POST /api/evidence/upload` — multipart file + friendly category; validates the file, attempts private Storage upload, creates metadata, and returns an `EvidenceItem` with upload status.
- `POST /api/evidence/extract` — accepts the safe evidence metadata and bounded extraction content/reference; runs validated OpenAI extraction or deterministic fallback and returns candidate fields plus extraction status/source.
- `POST /api/evidence/verify` — accepts the evidence, interpretation and field verification states; deterministically persists evidence, facts and timeline rows and returns a safe persistence status. It is idempotent for the same incident/evidence/field keys.
- Extend `/api/reports/submit` validation to accept the richer evidence shape while remaining backward compatible with existing Playwright request fixtures.

All routes return citizen-friendly error messages. Infrastructure details stay in server logs.

## Supabase changes

- Keep the already-applied additive schema and bucket migration as the source of truth. If an additional index/integrity migration is needed, create it locally, review it, apply it through the connected Supabase MCP, then verify it with SQL and advisors. Storage object access is server-only; no anonymous object policy is created.
- Verify the resulting columns, bucket, policies, idempotent writes and Supabase advisors. Existing demo data is not deleted.

## UI changes

- Expand only the existing `EvidenceScreen`/`EvidenceCard` surface; preserve `.status-timeline`, `.explain-card`, `.error-box` and all existing button names.
- Keep the seeded synthetic card as a separate, obvious demo path.
- Add a compact upload card, category selector, accepted-file hint, status messages, field-level verification controls and a disclosure that real sensitive files should not be uploaded to this prototype.
- Keep existing timeline layout and add provenance/time precision labels where needed.
- Keep the existing review/submission flow and show verified evidence facts in its summary.
- Add no generic chatbot and no broad visual redesign.

## Test strategy

- Preserve and run the current golden journey, idempotency, refresh and 390/412 viewport tests.
- Add Playwright coverage for unsupported type/oversize validation, upload and processing states, extraction success, OpenAI-unavailable fallback, accept/edit/reject, verified fact and timeline appearance, refresh persistence and duplicate evidence verification.
- Use route interception for deterministic OpenAI success/failure and delayed upload/extraction states; use a small generated TXT fixture in the test output/temp directory.
- Keep selector names from the existing suite and add accessible labels rather than brittle CSS-only selectors.
- Run `npx tsc --noEmit`, `npx eslint app/ lib/`, `npm run build`, and `npx playwright test`.

## Fallback and demo strategy

- Without an OpenAI key: deterministic extraction for safe TXT/synthetic content, visibly labelled **Demo information** and an honest explanation that AI was unavailable.
- If OpenAI fails: preserve the uploaded metadata and show the deterministic fallback, never a raw provider error.
- If Storage fails: show **Upload couldn't be completed to private storage. You can continue with this session's demo processing.** and mark the item `local_only` or `failed`; never claim cloud success.
- If Supabase is unavailable: use the existing in-memory fallback for the demo and keep the browser session intact.
- The hackathon demo continues to use the existing **Add synthetic transaction notification** button and remains fully runnable without credentials.

## Incremental implementation order

1. Add this plan and confirm the existing baseline.
2. Add types, extraction contract/fallback and API validation.
3. Add additive migration and server persistence helpers.
4. Add upload/processing/verification UI while preserving the synthetic path.
5. Wire verified facts to the timeline and review projection.
6. Add Playwright coverage and run checks after each milestone.
7. Apply and verify the Supabase migration/advisors, then perform the final regression run.

## Verified implementation result (28 Aug 2026)

- Supabase project `gddtzdzktbvwjhrtacax` is healthy. Migrations `realistic_evidence_pipeline`, `evidence_reference_indexes` and `evidence_verification_update_policies` are applied.
- The private `cyberdesk-evidence` bucket is configured for PNG/JPEG/PDF/TXT and a 5 MB limit. No anonymous Storage object policies were added.
- Demo-only `UPDATE` policies for `facts` and `timeline_events` are present and constrained by `is_demo = true`. The Supabase security advisor returned no lints; performance returned only informational unused-index notices for existing/reference indexes.
- `npx tsc --noEmit`, `npx eslint app/ lib/`, `npm run build`, desktop Playwright (13/13) and mobile Playwright (13/13) passed. The mobile fallback case was also rerun in isolation after one transient dev-server timeout and passed.
- A live OpenAI request was not exercised because this workspace has no `OPENAI_API_KEY`. The OpenAI success path is covered with Playwright route interception, while the missing-key path is covered against the actual extraction API and deterministic fallback.
