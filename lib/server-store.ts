import { statusLabel } from "./case-status";
import { getSupabaseClient } from "./supabase";
import { demoNarrative, timelineEvents } from "./mock-data";
import { normaliseEvidence, normaliseFieldKey, redactSensitiveText } from "./evidence";
import type { CandidateField, DemoCase, EvidenceItem, Interpretation } from "./types";

const DEMO_KEY = "hero-financial-fraud";

const fallbackCase: DemoCase = {
  incidentId: "incident-demo-001",
  complaintId: "complaint-demo-001",
  caseId: "CYB-DEMO-84A21",
  status: "under_review",
  statusLabel: statusLabel("under_review"),
  updatedAt: "2026-08-26T09:18:00.000Z",
};

let fallbackComplaintText = "Synthetic demo complaint for the CyberDesk tracking experience.";
const fallbackEvidence = new Map<string, EvidenceItem>();

function getFallbackCase(): DemoCase {
  return { ...fallbackCase };
}

function saveToFallback(input: { complaintText: string }): DemoCase {
  fallbackComplaintText = redactSensitiveText(input.complaintText);
  return getFallbackCase();
}

function isDemoStatus(value: string): value is DemoCase["status"] {
  return ["draft", "submitted", "information_received", "under_review"].includes(value);
}

function normaliseIncidentInput(interpretation?: Interpretation) {
  return {
    demo_key: DEMO_KEY,
    incident_type: interpretation?.incident_type
      ? redactSensitiveText(interpretation.incident_type)
      : "Online financial fraud",
    description: demoNarrative,
    urgency: interpretation?.urgency ?? "high",
    status: "under_review" as const,
    is_demo: true,
    updated_at: new Date().toISOString(),
  };
}

async function ensureDemoIncident(interpretation?: Interpretation) {
  const supabase = getSupabaseClient();
  if (!supabase || process.env.CYBERDESK_FORCE_LOCAL_STORE === "1") return null;

  const { data, error } = await supabase
    .from("incidents")
    .upsert(normaliseIncidentInput(interpretation), { onConflict: "demo_key" })
    .select("id,status,updated_at")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not save the synthetic incident");
  return data;
}

function evidenceRow(evidence: EvidenceItem, incidentId: string) {
  const item = normaliseEvidence(evidence);
  return {
    id: item.id,
    incident_id: incidentId,
    type: item.type,
    category: item.category,
    filename: item.filename,
    source: item.source,
    mime_type: item.mimeType,
    storage_reference: item.storageReference,
    upload_status: item.uploadStatus,
    extraction_status: item.extractionStatus,
    extraction_notes: item.extractionNotes ?? null,
    extracted_fields: item.candidateFields,
    verification_status: item.verificationStatus,
    is_demo: true,
  };
}

export async function persistEvidenceMetadata(input: {
  evidence: EvidenceItem;
  interpretation?: Interpretation;
}) {
  const evidence = normaliseEvidence(input.evidence);
  fallbackEvidence.set(evidence.id, evidence);
  try {
    const incident = await ensureDemoIncident(input.interpretation);
    if (!incident) {
      return {
        incidentId: fallbackCase.incidentId,
        persisted: false,
        reason: "Supabase is unavailable; this evidence is kept in the current demo session.",
      };
    }
    const { error } = await getSupabaseClient()!.from("evidence").upsert(evidenceRow(evidence, incident.id));
    if (error) throw error;
    return { incidentId: incident.id, persisted: true };
  } catch (error) {
    console.error("Could not persist evidence metadata; using the demo session fallback", error);
    return {
      incidentId: fallbackCase.incidentId,
      persisted: false,
      reason: "Evidence was kept in this demo session because cloud persistence was unavailable.",
    };
  }
}

function factRow(field: CandidateField, incidentId: string, evidence: EvidenceItem) {
  const verificationStatus = field.verificationStatus ?? "candidate";
  return {
    incident_id: incidentId,
    evidence_id: evidence.id,
    field_key: normaliseFieldKey(field.fieldKey, field.label),
    fact_type: field.label,
    value: { text: field.value },
    source: verificationStatus === "confirmed" ? "Citizen confirmed from evidence" : field.source,
    confidence: null,
    verification_status: verificationStatus,
    verified_at: verificationStatus === "confirmed" ? new Date().toISOString() : null,
    provenance: {
      evidenceId: evidence.id,
      extractionSource: field.source,
      verification: verificationStatus,
    },
    is_demo: true,
  };
}

function getField(evidence: EvidenceItem, fieldKey: string, label: string) {
  return evidence.candidateFields.find((field) =>
    (field.fieldKey === fieldKey || field.label === label) && field.verificationStatus === "confirmed"
  )?.value;
}

function timelineRow(evidence: EvidenceItem, incidentId: string) {
  const amount = getField(evidence, "transactionAmount", "Amount");
  const reference = getField(evidence, "transactionReference", "Reference");
  const date = getField(evidence, "eventDate", "Possible date");
  const time = getField(evidence, "eventTime", "Time") ?? getField(evidence, "eventTime", "Approximate time");
  if (!amount && !reference && !date && !time) {
    return {
      incident_id: incidentId,
      event_key: `evidence-${evidence.id}-payment`,
      evidence_id: evidence.id,
      event_time: null,
      event_time_label: null,
      time_precision: "unknown" as const,
      event_type: "transaction_debit",
      description: "No payment detail from this evidence is currently confirmed.",
      source: "Citizen verification",
      verification_status: "rejected" as const,
      is_demo: true,
    };
  }

  const timePrecision = date && time ? "exact" : date ? "date" : time ? "approximate" : "unknown";
  const detail = [
    amount ? `A ${amount} debit is referenced in the evidence.` : "A payment event is referenced in the evidence.",
    reference ? `Reference: ${reference}.` : "",
  ].filter(Boolean).join(" ");

  return {
    incident_id: incidentId,
    event_key: `evidence-${evidence.id}-payment`,
    evidence_id: evidence.id,
    event_time: null,
    event_time_label: [date, time].filter(Boolean).join(" · ") || null,
    time_precision: timePrecision,
    event_type: "transaction_debit",
    description: detail,
    source: evidence.isDemo
      ? "Evidence-derived · citizen confirmed · demo information"
      : "Evidence-derived · citizen confirmed",
    verification_status: "confirmed" as const,
    is_demo: true,
  };
}

export async function persistVerifiedEvidence(input: {
  evidence: EvidenceItem;
  interpretation: Interpretation;
}) {
  const evidence = normaliseEvidence(input.evidence);
  fallbackEvidence.set(evidence.id, evidence);
  try {
    const incident = await ensureDemoIncident(input.interpretation);
    if (!incident) {
      return {
        incidentId: fallbackCase.incidentId,
        persisted: false,
        reason: "Supabase is unavailable; verified evidence is kept in the current demo session.",
      };
    }

    const supabase = getSupabaseClient()!;
    const { error: evidenceError } = await supabase.from("evidence").upsert(evidenceRow(evidence, incident.id));
    if (evidenceError) throw evidenceError;

    const facts = evidence.candidateFields
      .filter((field) => field.verificationStatus === "confirmed")
      .map((field) => factRow(field, incident.id, evidence));
    if (facts.length) {
      const { error: factsError } = await supabase
        .from("facts")
        .upsert(facts, { onConflict: "incident_id,evidence_id,field_key" });
      if (factsError) throw factsError;
    }

    const event = timelineRow(evidence, incident.id);
    const { error: timelineError } = await supabase
      .from("timeline_events")
      .upsert(event, { onConflict: "incident_id,event_key" });
    if (timelineError) throw timelineError;

    return { incidentId: incident.id, persisted: true };
  } catch (error) {
    console.error("Could not persist verified evidence; using the demo session fallback", error);
    return {
      incidentId: fallbackCase.incidentId,
      persisted: false,
      reason: "Verified evidence remains available in this demo session because cloud persistence was unavailable.",
    };
  }
}

export async function getDemoCase(): Promise<DemoCase> {
  const supabase = getSupabaseClient();
  if (!supabase || process.env.CYBERDESK_FORCE_LOCAL_STORE === "1") {
    console.warn("Supabase is unavailable for the synthetic demo; using the deterministic fallback store.");
    return getFallbackCase();
  }

  try {
    const { data, error } = await supabase
      .from("incidents")
      .select("id,status,updated_at")
      .eq("demo_key", DEMO_KEY)
      .maybeSingle();
    if (error) throw error;
    if (!data || !isDemoStatus(data.status)) return getFallbackCase();
    return { incidentId: data.id, status: data.status, statusLabel: statusLabel(data.status), updatedAt: data.updated_at };
  } catch (error) {
    console.error("Could not read the synthetic demo case from Supabase; using fallback store", error);
    return getFallbackCase();
  }
}

export async function saveDemoJourney(input: {
  interpretation: Interpretation;
  evidence: EvidenceItem | null;
  complaintText: string;
}): Promise<DemoCase> {
  const supabase = getSupabaseClient();
  if (!supabase || process.env.CYBERDESK_FORCE_LOCAL_STORE === "1") return saveToFallback(input);

  try {
    const incident = await ensureDemoIncident(input.interpretation);
    if (!incident) return saveToFallback(input);

    if (input.evidence) {
      const evidence = normaliseEvidence(input.evidence);
      const { error } = await supabase.from("evidence").upsert(evidenceRow(evidence, incident.id));
      if (error) throw error;
      if (evidence.verificationStatus === "confirmed") {
        await persistVerifiedEvidence({ evidence, interpretation: input.interpretation });
      }
    }

    const { data: complaint, error: complaintError } = await supabase.from("complaints").upsert({
      incident_id: incident.id,
      complaint_text: redactSensitiveText(input.complaintText),
      status: "under_review",
      acknowledgement_id: "CYB-DEMO-84A21",
      is_demo: true,
    }, { onConflict: "incident_id" }).select("id,acknowledgement_id").single();
    if (complaintError || !complaint) throw new Error(complaintError?.message ?? "Could not save the mock report");

    const { error: eventsError } = await supabase.from("complaint_events").upsert([
      { complaint_id: complaint.id, status: "submitted", description: "Demo report created", is_demo: true },
      { complaint_id: complaint.id, status: "information_received", description: "Synthetic information package received", is_demo: true },
      { complaint_id: complaint.id, status: "under_review", description: "Synthetic case is shown as under review", is_demo: true },
    ], { onConflict: "complaint_id,status", ignoreDuplicates: true });
    if (eventsError) throw eventsError;

    return { incidentId: incident.id, complaintId: complaint.id, caseId: complaint.acknowledgement_id, status: "under_review", statusLabel: statusLabel("under_review"), updatedAt: incident.updated_at };
  } catch (error) {
    console.error("Could not persist the synthetic demo journey to Supabase; using fallback store", error);
    return saveToFallback(input);
  }
}

export function getFallbackComplaintText() {
  return fallbackComplaintText;
}

export function getStatusContext() {
  return {
    status: "under_review" as const,
    status_label: statusLabel("under_review"),
    case_id: "CYB-DEMO-84A21",
    last_updated: "Today, 14:48 IST",
    prior_events: [
      { status: "submitted", at: "Today, 14:41 IST", description: "The citizen completed the CyberDesk demo submission." },
      { status: "information_received", at: "Today, 14:42 IST", description: "The synthetic incident details and evidence were accepted by the prototype." },
    ],
    verified_context: [...timelineEvents.map((event) => event.title), "₹35,000 synthetic debit"],
  };
}
