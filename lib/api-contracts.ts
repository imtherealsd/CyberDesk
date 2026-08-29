import { z } from "zod";

export const interpretationSchema = z.object({
  incident_type: z.string().max(200).nullable(),
  possible_method: z.string().max(300).nullable(),
  amount: z.number().finite().nonnegative().max(100_000_000).nullable(),
  urgency: z.enum(["low", "medium", "high", "unknown"]),
  mentioned_evidence: z.array(z.string().max(200)).max(20),
  missing_information: z.array(z.string().max(300)).max(20),
  uncertainties: z.array(z.string().max(300)).max(20),
}).strict();

const evidenceCategorySchema = z.enum([
  "transaction",
  "bank_communication",
  "sms",
  "whatsapp_message",
  "email",
  "screenshot",
  "link",
  "caller_contact",
  "other",
]);

const provenanceSchema = z.object({
  origin: z.enum(["openai", "demo_fallback", "citizen", "synthetic"]),
  evidenceId: z.string().max(160),
  sourceReference: z.string().max(200).optional(),
  verifiedAt: z.string().max(80).optional(),
}).strict();

const candidateFieldSchema = z.object({
  id: z.string().max(160).optional(),
  fieldKey: z.string().max(80).optional(),
  label: z.string().trim().min(1).max(100),
  value: z.string().trim().min(1).max(300),
  source: z.string().trim().min(1).max(200),
  evidenceId: z.string().max(160).optional(),
  confidence: z.enum(["low", "medium", "high"]).nullable().optional(),
  verificationStatus: z.enum(["candidate", "confirmed", "rejected"]).optional(),
  provenance: provenanceSchema.optional(),
}).strict();

export const evidencePayloadSchema = z.object({
  id: z.string().trim().min(1).max(160),
  type: z.string().trim().min(1).max(100),
  category: evidenceCategorySchema.optional(),
  filename: z.string().trim().min(1).max(255),
  source: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(500),
  mimeType: z.string().max(100).optional(),
  storageReference: z.string().max(500).nullable().optional(),
  uploadStatus: z.enum(["demo", "uploaded", "local_only", "failed"]).optional(),
  extractionStatus: z.enum(["not_started", "processing", "complete", "fallback", "failed"]).optional(),
  extractionNotes: z.string().max(600).optional(),
  createdAt: z.string().max(80).optional(),
  isDemo: z.boolean().optional(),
  candidateFields: z.array(candidateFieldSchema).max(12),
  verificationStatus: z.enum(["candidate", "confirmed", "rejected"]),
}).strict();

export const evidenceContentSchema = z.object({
  kind: z.enum(["text", "image", "file"]),
  data: z.string().min(1).max(7_500_000),
  mimeType: z.string().max(100).optional(),
}).strict();

const statusEventSchema = z.union([
  z.string().trim().max(300),
  z.object({
    status: z.string().trim().max(80),
    at: z.string().trim().max(100),
    description: z.string().trim().max(300),
  }).strict(),
]);

export const statusExplanationRequestSchema = z.object({
  status: z.enum(["draft", "submitted", "information_received", "under_review"]).optional(),
  status_label: z.string().trim().max(120).optional(),
  case_id: z.string().trim().max(160).optional(),
  last_updated: z.string().trim().max(120).optional(),
  prior_events: z.array(statusEventSchema).max(20).optional(),
  verified_context: z.array(z.string().trim().max(300)).max(20).optional(),
}).strict();

export { candidateFieldSchema, evidenceCategorySchema };
