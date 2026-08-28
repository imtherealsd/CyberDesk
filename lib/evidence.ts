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

export function isRestrictedEvidenceValue(fieldKey: string, label: string, value: string) {
  const combined = `${fieldKey} ${label} ${value}`;
  const compact = value.replace(/[\s-]/g, "");
  if (/\b(otp|one[- ]time password|pin|cvv|password|passcode|aadhaar|pan)\b/i.test(combined)) return true;
  if (/\b(card|credit|debit|visa|mastercard|rupay)\b/i.test(combined) && /\d/.test(value)) return true;
  if (fieldKey !== "phoneNumber" && /^\d{12,19}$/.test(compact)) return true;
  if (!(["transactionReference", "phoneNumber"].includes(fieldKey)) && /\b\d{12,19}\b/.test(compact)) return true;
  return false;
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
    mimeType: value.mimeType ? getNormalisedMimeType(value.filename, value.mimeType) : "text/plain",
    storageReference: value.storageReference ?? null,
    uploadStatus: value.uploadStatus ?? (value.source.toLowerCase().includes("uploaded") ? "local_only" : "demo"),
    extractionStatus: value.extractionStatus ?? "complete",
    createdAt: value.createdAt ?? new Date().toISOString(),
    candidateFields: uniqueCandidateFields,
  };
}
