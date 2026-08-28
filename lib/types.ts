export type JourneyStep =
  | "entry"
  | "intake"
  | "understanding"
  | "guidance"
  | "evidence"
  | "timeline"
  | "report"
  | "submitted"
  | "tracking";

export type Urgency = "low" | "medium" | "high" | "unknown";

export type CaseStatus = "draft" | "submitted" | "information_received" | "under_review";

export type CaseMemberRole = "owner" | "collaborator" | "viewer";

export type UserProfile = {
  id: string;
  email: string;
  fullName?: string;
  createdAt: string;
  updatedAt?: string;
};

export type CaseMember = {
  id: string;
  incidentId: string;
  userId: string;
  role: CaseMemberRole;
  createdAt: string;
  email?: string;
  fullName?: string;
};

export type CaseSummary = {
  id: string;
  incidentType: string | null;
  description: string;
  urgency: Urgency;
  status: CaseStatus;
  statusLabel: string;
  isDemo: boolean;
  role: CaseMemberRole;
  createdAt: string;
  updatedAt: string;
  evidenceCount: number;
  verifiedFactCount: number;
  caseReference?: string;
};

export type CaseDetail = {
  id: string;
  incidentType: string | null;
  description: string;
  urgency: Urgency;
  status: CaseStatus;
  statusLabel: string;
  isDemo: boolean;
  role: CaseMemberRole;
  createdAt: string;
  updatedAt: string;
  interpretation: Interpretation | null;
  evidence: EvidenceItem[];
  facts: CandidateField[];
  timeline: TimelineEvent[];
  complaintText: string;
  acknowledgementId?: string;
  members: CaseMember[];
};

export type CreateCaseInput = {
  incidentType?: string;
  description: string;
  urgency?: Urgency;
  interpretation?: Interpretation | null;
};

export type EvidenceCategory =
  | "transaction"
  | "bank_communication"
  | "sms"
  | "whatsapp_message"
  | "email"
  | "screenshot"
  | "link"
  | "caller_contact"
  | "other";

export type UploadStatus = "demo" | "uploaded" | "local_only" | "failed";

export type ExtractionStatus =
  | "not_started"
  | "processing"
  | "complete"
  | "fallback"
  | "failed";

export type FieldVerificationStatus = "candidate" | "confirmed" | "rejected";

export type EvidenceProvenance = {
  origin: "openai" | "demo_fallback" | "citizen" | "synthetic";
  evidenceId: string;
  sourceReference?: string;
  verifiedAt?: string;
};

export type CandidateField = {
  id?: string;
  fieldKey?: string;
  label: string;
  value: string;
  source: string;
  evidenceId?: string;
  confidence?: "low" | "medium" | "high" | null;
  verificationStatus?: FieldVerificationStatus;
  provenance?: EvidenceProvenance;
};

export type Interpretation = {
  incident_type: string | null;
  possible_method: string | null;
  amount: number | null;
  urgency: Urgency;
  mentioned_evidence: string[];
  missing_information: string[];
  uncertainties: string[];
};

export type EvidenceItem = {
  id: string;
  type: string;
  category?: EvidenceCategory;
  filename: string;
  source: string;
  description: string;
  mimeType?: string;
  storageReference?: string | null;
  uploadStatus?: UploadStatus;
  extractionStatus?: ExtractionStatus;
  extractionNotes?: string;
  createdAt?: string;
  isDemo?: boolean;
  candidateFields: CandidateField[];
  verificationStatus: FieldVerificationStatus;
};

export type EvidenceExtraction = {
  candidateFields: CandidateField[];
  sourceReference: string;
  uncertainties: string[];
  extractionNotes: string;
  source: "openai" | "demo_fallback";
};

export type TimelineEvent = {
  eventKey?: string;
  evidenceId?: string;
  time: string;
  /** Display label for the time column. Use "Time not reported" for citizen events with no exact time, or "Synthetic demo" for demo-generated times. */
  timeLabel?: string;
  timePrecision?: "exact" | "date" | "approximate" | "unknown";
  title: string;
  detail: string;
  source: string;
};

export type StatusExplanation = {
  meaning: string;
  next_expected_step: string;
  limitations: string;
  source: "openai" | "demo_fallback";
  fallback_reason?: string;
};

export type DemoCase = {
  incidentId: string;
  complaintId?: string;
  caseId?: string;
  status: "draft" | "submitted" | "information_received" | "under_review";
  statusLabel: string;
  updatedAt: string;
};

export type IncidentDossier = {
  incidentSummary: string;
  verifiedFacts: string[];
  evidence: EvidenceItem[];
  timeline: TimelineEvent[];
  actions: string[];
  caseStatus: DemoCase["status"];
  disclosure: string;
};
