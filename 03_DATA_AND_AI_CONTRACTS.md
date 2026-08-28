# CyberDesk
## Data Model, AI Contracts & Trust Boundaries

**Version:** 1.0  
**Principle:** AI proposes; verified data persists; deterministic logic controls state.

---

# 1. Data Model

The following is the conceptual model. Codex must finalize the physical PostgreSQL schema.

## Incident

Represents one citizen's synthetic cyber incident.

Suggested fields:

- `id`
- `incident_type`
- `description`
- `urgency`
- `status`
- `created_at`
- `updated_at`

---

## Evidence

Represents a piece of supporting material.

Suggested fields:

- `id`
- `incident_id`
- `type`
- `category`
- `filename`
- `source`
- `mime_type`
- `storage_reference`
- `upload_status`
- `extraction_status`
- `extracted_fields`
- `verification_status`
- `created_at`

---

## Fact

Represents a candidate or confirmed fact extracted from citizen input/evidence.

Suggested fields:

- `id`
- `incident_id`
- `evidence_id`
- `field_key`
- `fact_type`
- `value`
- `source`
- `confidence`
- `verification_status`
- `verified_at`
- `provenance`

This entity is important because it separates **AI extraction** from **trusted case information**.

---

## Timeline Event

Suggested fields:

- `id`
- `incident_id`
- `event_key`
- `evidence_id`
- `event_time`
- `event_time_label`
- `time_precision`
- `event_type`
- `description`
- `source`
- `verification_status`

---

## Complaint

Suggested fields:

- `id`
- `incident_id`
- `complaint_text`
- `status`
- `acknowledgement_id`
- `created_at`
- `updated_at`

---

## Complaint Event

Suggested fields:

- `id`
- `complaint_id`
- `status`
- `description`
- `timestamp`

---

# 2. Verification States

Recommended state model:

```text
candidate
   ↓
confirmed
```

Alternative outcomes:

```text
candidate → rejected
candidate → edited → confirmed
```

AI must never write directly to `confirmed`.

---

# 3. AI Contract: Incident Interpretation

### Input

```json
{
  "incident_description": "string"
}
```

### Output

```json
{
  "incident_type": "string | null",
  "possible_method": "string | null",
  "amount": "number | null",
  "urgency": "low | medium | high | unknown",
  "mentioned_evidence": [],
  "missing_information": [],
  "uncertainties": []
}
```

### Requirements

- Do not invent missing values.
- Preserve uncertainty.
- Prefer `null` over guesses.
- Return structured data.
- Validate the response server-side.

---

# 4. AI Contract: Evidence Extraction

### Input

Synthetic evidence content or extracted text.

### Output

```json
{
  "candidate_fields": [],
  "source_reference": "string",
  "uncertainties": [],
  "extraction_notes": "string"
}
```

Each candidate field must retain its source.

Candidate fields also retain a stable `field_key`, `evidence_id`, optional qualitative `confidence`, and provenance. Provenance identifies whether the suggestion came from OpenAI, the deterministic demo fallback, synthetic seed data, or a citizen edit. `verification_status` remains `candidate` until the citizen accepts or edits the value; rejected values are retained as rejected history and excluded from trusted facts/timeline output.

### Trust rule

Extracted ≠ confirmed.

The citizen must verify important facts.

---

# 5. AI Contract: Complaint Drafting

### Input

Only verified:

- incident facts;
- evidence facts;
- timeline events.

### Output

An editable complaint draft.

### Hard rule

The model must not introduce factual claims absent from the verified source data.

---

# 6. AI Contract: Status Explanation

### Input

- synthetic complaint state;
- verified case context.

### Output

```json
{
  "meaning": "string",
  "next_expected_step": "string",
  "limitations": "string"
}
```

The model must not:

- promise investigation;
- promise recovery;
- imply police action;
- imply bank action;
- invent deadlines.

---

# 7. AI Contract: Citizen Assistance

A contextual assistant may answer questions about the current synthetic case.

It must stay within:

- provided case context;
- product guidance;
- explicitly approved informational sources.

It must not become an unrestricted legal, financial or investigative authority.

---

# 8. Deterministic Responsibilities

The application, not the model, decides:

- authentication;
- authorization;
- required fields;
- validation;
- RLS;
- case state;
- mock submission;
- status transitions;
- whether an evidence item is stored;
- whether a fact is confirmed;
- secret handling;
- safety boundaries.

---

# 9. Prompt-Injection Boundary

Uploaded evidence and user-provided text must be treated as **untrusted content**.

A document or screenshot may contain text such as:

> "Ignore previous instructions..."

The system must treat this as evidence content, not as an instruction to the AI system.

---

# 10. Privacy Boundary

The prototype should operate entirely on synthetic data.

If future production deployment is considered, privacy, retention, access control, auditability and jurisdictional requirements must be reviewed separately.

---

# 11. AI Failure Policy

If OpenAI is unavailable:

- do not fabricate an answer;
- show a recoverable error;
- preserve user-entered data;
- allow deterministic workflow steps to continue where safe;
- make the AI dependency visible.

The product must fail honestly.
