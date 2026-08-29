import type { CandidateField, EvidenceCategory, EvidenceItem, EvidenceProvenance } from "./types";

export const EVIDENCE_BUCKET = "cyberdesk-evidence";
export const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;
export const MAX_TEXT_FOR_EXTRACTION = 60_000;

export const EVIDENCE_CATEGORIES: Array<{ value: EvidenceCategory; label: string }> = [
  { value: "transaction", label: "Transaction / payment" },
  { value: "bank_communication", label: "Bank communication" },
  { value: "sms", label: "SMS" },
  { value: "whatsapp_message", label: "WhatsApp / message" },
  { value: "email", label: "Email" },
  { value: "screenshot", label: "Screenshot" },
  { value: "link", label: "Link / URL" },
  { value: "caller_contact", label: "Caller / contact" },
  { value: "other", label: "Other" },
];

const MIME_BY_EXTENSION: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  pdf: "application/pdf",
  txt: "text/plain",
};

const FIELD_KEY_BY_LABEL: Record<string, string> = {
  amount: "transactionAmount",
  "transaction amount": "transactionAmount",
  reference: "transactionReference",
  "transaction reference": "transactionReference",
  "possible date": "eventDate",
  date: "eventDate",
  time: "eventTime",
  "approximate time": "eventTime",
  "phone number": "phoneNumber",
  email: "email",
  url: "url",
  "platform / channel": "platform",
  platform: "platform",
  "institution / bank": "institution",
  institution: "institution",
  "sender / recipient": "senderRecipient",
  "incident clue": "incidentClue",
};

export const SUPPORTED_EVIDENCE_MIME_TYPES = Object.values(MIME_BY_EXTENSION);

export function getExtension(filename: string) {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export function getNormalisedMimeType(filename: string, mimeType: string) {
  const extensionMime = MIME_BY_EXTENSION[getExtension(filename)];
  const reportedMime = mimeType.trim().toLowerCase();
  return !reportedMime || reportedMime === "application/octet-stream"
    ? extensionMime || reportedMime
    : reportedMime;
}

export function isSupportedEvidenceFile(filename: string, mimeType: string) {
  const extensionMime = MIME_BY_EXTENSION[getExtension(filename)];
  const reportedMime = mimeType.trim().toLowerCase();
  if (!extensionMime) return false;
  return !reportedMime || reportedMime === extensionMime || reportedMime === "application/octet-stream";
}

export function getCategoryLabel(category: EvidenceCategory) {
  return EVIDENCE_CATEGORIES.find((item) => item.value === category)?.label ?? "Other";
}

export function sanitiseFilename(filename: string) {
  const extension = getExtension(filename);
  const base = filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${base || "evidence"}.${extension || "bin"}`;
}

export function normaliseFieldKey(fieldKey: string | undefined, label: string) {
  return fieldKey || FIELD_KEY_BY_LABEL[label.trim().toLowerCase()] || label.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function compactDigits(value: string) {
  return value.replace(/[\s()-]/g, "");
}

function isIndianPhoneNumber(value: string) {
  return /^(?:\+91|91)?[6-9]\d{9}$/.test(compactDigits(value));
}

function containsSensitiveNumericPattern(value: string) {
  const numericRuns = value.match(/\d(?:[\d\s-]*\d)?/g) ?? [];
  return numericRuns.some((run) => {
    const digits = run.replace(/[\s-]/g, "");
    return digits.length >= 12 && digits.length <= 19;
  });
}

function isLikelyNonSensitiveTransactionReference(fieldKey: string, label: string, value: string) {
  const referenceContext = `${fieldKey} ${label}`;
  const trimmed = value.trim();
  return /(?:transaction|reference|utr|txn|order)/i.test(referenceContext)
    && /^[A-Z0-9][A-Z0-9_-]{5,}$/i.test(trimmed)
    && /[A-Z]/i.test(trimmed);
}

export function isRestrictedEvidenceValue(fieldKey: string, label: string, value: string) {
  const combined = `${fieldKey} ${label} ${value}`;
  if (/\b(otp|one[- ]time password|pin|cvv|password|passcode|aadhaar|pan)\b/i.test(combined)) return true;
  if (/\b(card|credit|debit|visa|mastercard|rupay)\b/i.test(combined) && /\d/.test(value)) return true;
  if (/^[A-Z]{5}\d{4}[A-Z]$/i.test(value.trim())) return true;
  if (fieldKey === "phoneNumber" && isIndianPhoneNumber(value)) return false;
  if (containsSensitiveNumericPattern(value) && !isLikelyNonSensitiveTransactionReference(fieldKey, label, value)) return true;
  return false;
}

/**
 * Redacts credential-like values from free-text sent to AI or persisted as
 * narrative text. Valid Indian phone numbers are deliberately preserved.
 */
export function redactSensitiveText(value: string) {
  const phoneValues: string[] = [];
  let redacted = value.replace(
    /(?<!\d)(?:\+91[\s-]?)?[6-9](?:[\s-]?\d){9}(?!\d)/g,
    (phone) => {
      const token = "__CYBERDESK_PHONE_" + phoneValues.length + "__";
      phoneValues.push(phone);
      return token;
    }
  );

  redacted = redacted.replace(
    /(\b(?:otp|one[- ]time password|pin|cvv|password|passcode|aadhaar|pan)\b(?:\s+(?:number|code|value|is))?\s*[:=-]?\s*)([^\s,.;]{3,40})/gi,
    "$1[redacted]"
  );
  redacted = redacted.replace(/\b[A-Z]{5}\d{4}[A-Z]\b/gi, "[redacted PAN]");
  redacted = redacted.replace(/(?<!\d)(?:\d[\s-]?){12,19}(?!\d)/g, "[redacted sensitive number]");

  return redacted.replace(/__CYBERDESK_PHONE_(\d+)__/g, (_match, index: string) => phoneValues[Number(index)] ?? "[redacted phone]");
}

function provenanceForSource(source: string, evidenceId: string): EvidenceProvenance {
  const lower = source.toLowerCase();
  const origin = lower.includes("openai") || lower.includes("ai suggestion")
    ? "openai"
    : lower.includes("fallback") || lower.includes("deterministic")
    ? "demo_fallback"
    : lower.includes("synthetic") || lower.includes("demo")
    ? "synthetic"
    : "citizen";
  return { origin, evidenceId, sourceReference: source };
}

export function normaliseCandidateField(
  field: CandidateField,
  evidenceId: string,
  index: number
): CandidateField {
  return {
    ...field,
    id: field.id ?? `${evidenceId}-${normaliseFieldKey(field.fieldKey, field.label) || index}`,
    fieldKey: normaliseFieldKey(field.fieldKey, field.label),
    evidenceId,
    value: field.value.trim(),
    verificationStatus: field.verificationStatus ?? "candidate",
    confidence: field.confidence ?? null,
    provenance: field.provenance
      ? { ...field.provenance, evidenceId }
      : provenanceForSource(field.source, evidenceId),
  };
}

export function normaliseEvidence(value: EvidenceItem): EvidenceItem {
  const candidateFields = value.candidateFields
    .map((field, index) => normaliseCandidateField(field, value.id, index))
    .filter((field) => !isRestrictedEvidenceValue(field.fieldKey ?? "", field.label, field.value));
  const uniqueCandidateFields = Array.from(
    new Map(candidateFields.map((field) => [field.fieldKey ?? field.id, field])).values()
  );
  return {
    ...value,
    isDemo: value.isDemo ?? true,
    category: value.category ?? "other",
    description: redactSensitiveText(value.description),
    mimeType: value.mimeType ? getNormalisedMimeType(value.filename, value.mimeType) : "text/plain",
    storageReference: value.storageReference ?? null,
    uploadStatus: value.uploadStatus ?? (value.source.toLowerCase().includes("uploaded") ? "local_only" : "demo"),
    extractionStatus: value.extractionStatus ?? "complete",
    createdAt: value.createdAt ?? new Date().toISOString(),
    candidateFields: uniqueCandidateFields,
  };
}

export class EvidenceReviewError extends Error {}

/**
 * Accept only citizen decisions for fields returned by the authoritative
 * extraction. Evidence identity, provenance and field semantics remain
 * server-owned; the client may only change a field value while confirming it.
 */
export function reconcileEvidenceReview(
  authoritativeEvidence: EvidenceItem,
  submittedEvidence: EvidenceItem
): EvidenceItem {
  const authoritative = normaliseEvidence(authoritativeEvidence);
  const submittedById = new Map<string, CandidateField>();

  for (const submittedField of submittedEvidence.candidateFields) {
    if (!submittedField.id || submittedById.has(submittedField.id)) {
      throw new EvidenceReviewError("Evidence fields did not match the saved extraction.");
    }
    const authoritativeField = authoritative.candidateFields.find((field) => field.id === submittedField.id);
    if (!authoritativeField) {
      throw new EvidenceReviewError("Evidence fields did not match the saved extraction.");
    }
    if (
      (submittedField.fieldKey && submittedField.fieldKey !== authoritativeField.fieldKey) ||
      submittedField.label !== authoritativeField.label ||
      submittedField.source !== authoritativeField.source ||
      (submittedField.evidenceId && submittedField.evidenceId !== authoritative.id)
    ) {
      throw new EvidenceReviewError("Evidence fields cannot be changed outside citizen review.");
    }
    if (isRestrictedEvidenceValue(
      authoritativeField.fieldKey ?? "",
      authoritativeField.label,
      submittedField.value.trim()
    )) {
      throw new EvidenceReviewError("That detail cannot be saved because it may contain sensitive credentials or account numbers.");
    }
    submittedById.set(submittedField.id, submittedField);
  }

  const verifiedAt = new Date().toISOString();
  const candidateFields = authoritative.candidateFields.map((authoritativeField) => {
    const submittedField = submittedById.get(authoritativeField.id ?? "");
    const status = submittedField?.verificationStatus ?? authoritativeField.verificationStatus ?? "candidate";

    if (status === "confirmed") {
      return {
        ...authoritativeField,
        value: submittedField?.value.trim() || authoritativeField.value,
        verificationStatus: "confirmed" as const,
        provenance: {
          ...(authoritativeField.provenance ?? {}),
          origin: "citizen" as const,
          evidenceId: authoritative.id,
          verifiedAt,
        },
      };
    }

    if (status === "rejected") {
      return {
        ...authoritativeField,
        verificationStatus: "rejected" as const,
        provenance: authoritativeField.provenance
          ? { ...authoritativeField.provenance, evidenceId: authoritative.id, verifiedAt: undefined }
          : undefined,
      };
    }

    if (submittedField && submittedField.value.trim() !== authoritativeField.value) {
      throw new EvidenceReviewError("Edited evidence details must be confirmed by the citizen.");
    }

    return {
      ...authoritativeField,
      verificationStatus: "candidate" as const,
    };
  });

  return {
    ...authoritative,
    candidateFields,
    verificationStatus: "confirmed",
    isDemo: false,
  };
}
