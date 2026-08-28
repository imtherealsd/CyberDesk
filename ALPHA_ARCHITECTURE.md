# CyberDesk Alpha Architecture

**Status:** Proposed architecture following repository and Supabase reconnaissance. The authenticated alpha is not yet implemented.

## Boundary

CyberDesk remains an independent incident-preparation product. It does not file an FIR, access government systems, freeze money, reverse transactions or guarantee an investigation outcome. The existing synthetic demo is a separate product path from authenticated citizen cases.

## Identity and ownership

Supabase Auth supplies the authenticated user identity. `profiles` is a minimal one-to-one profile record keyed by `auth.users.id`; it stores no incident details or unnecessary identity information.

`public.incidents` remains the physical case table during this migration and is treated as the canonical case/workspace entity. Each non-demo incident has at least one `case_members` row:

```text
auth.users
    │
    └── profiles

case_members ── user_id ── auth.users
      │
      └── case_id ── incidents (canonical case/workspace)
                           │
                           ├── evidence
                           ├── facts / verified facts
                           ├── timeline_events
                           └── complaints / dossier metadata
```

`incidents.id` is a Supabase UUID and is the only identity used in authenticated URLs and APIs. `demo_key = 'hero-financial-fraud'` remains nullable legacy metadata for the seeded demo only.

## Case lifecycle

```text
authenticated user
        ↓
create UUID case + owner membership
        ↓
case-specific workspace route
        ↓
evidence → candidate extraction → citizen verification
        ↓
verified facts → provenance-labelled timeline → dossier projection
```

The current `/` state machine remains the compatibility/demo route while `/workspace` and `/workspace/[caseId]` are introduced.

## RLS model

- Anonymous users can access only explicitly synthetic demo rows.
- Authenticated users can access only rows whose case has a matching `case_members.user_id = auth.uid()` membership.
- `owner` can create and manage the case; `editor` can work on case evidence and timeline; `viewer` is read-only.
- Every `UPDATE` policy includes both an ownership `USING` predicate and a membership-preserving `WITH CHECK` predicate.
- A case id from the URL is never sufficient authorization; every server route rechecks the authenticated user and membership.
- No RLS policy uses `raw_user_meta_data` or other user-editable claims.

## Storage ownership

Authenticated evidence objects use:

```text
cases/<case-uuid>/<evidence-uuid>/<sanitised-filename>
```

The bucket remains private. Storage object policies resolve the case UUID from the path and require case membership. Any service-role upload is server-only and is allowed only after the API verifies the bearer session and case membership. Public URLs are never returned.

The existing `demo/...` objects and demo metadata remain separate and are not treated as citizen-owned evidence.

## AI and provenance

The existing evidence pipeline is retained:

```text
uploaded evidence
        ↓
bounded OpenAI/deterministic extraction
        ↓
candidate fields + evidence id + source provenance
        ↓
citizen accepts, edits or rejects
        ↓
verified facts and timeline rows
```

AI output remains `candidate`. Only explicit citizen confirmation becomes a trusted fact. Every fact retains evidence linkage, extraction origin, source reference and verification time. AI cannot set case status, bypass RLS or submit a report.

## Demo versus real-case separation

| Concern | Synthetic demo | Authenticated alpha case |
|---|---|---|
| Identity | legacy demo key and visible demo labels | Supabase Auth user UUID |
| Case id | seeded UUID plus `CYB-DEMO-84A21` display id | generated UUID in route/API |
| RLS | explicit `is_demo = true` policy | `case_members` membership policy |
| Storage | optional server-only demo path | private case-owned path |
| Fallback | shared demo fallback allowed | fail closed; never use demo fallback |
| Government action | none; clearly simulated | none; clearly informational/preparatory |

## Remaining alpha limitations

- Email magic-link delivery and redirect configuration must be enabled in the Supabase project.
- Authenticated routes require server request verification and should use private, uncached responses.
- Production readiness still requires retention/deletion workflows, audit logging, abuse/rate limiting, privacy review, monitoring and a dedicated test environment.
- Real citizen evidence remains out of scope until the authenticated RLS and Storage test matrix passes.
