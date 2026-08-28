import { statusLabel } from "./case-status";
import { normaliseEvidence, normaliseFieldKey } from "./evidence";
import { getSupabaseServiceRoleClient } from "./supabase-server";
import type {
  CandidateField,
  CaseDetail,
  CaseMember,
  CaseStatus,
  CaseSummary,
  CreateCaseInput,
  EvidenceItem,
  Interpretation,
  TimelineEvent,
  Urgency,
} from "./types";
import type { SupabaseClient, User } from "@supabase/supabase-js";

// In-Memory Fallback Case Store (Used for Playwright tests, offline development, or local test users)
type MockCaseRecord = {
  id: string;
  incidentType: string | null;
  description: string;
  urgency: Urgency;
  status: CaseStatus;
  isDemo: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  interpretation: Interpretation | null;
  evidence: Map<string, EvidenceItem>;
  facts: Map<string, CandidateField>;
  timeline: Map<string, TimelineEvent>;
  complaintText: string;
  acknowledgementId?: string;
  members: Map<string, CaseMember>;
};

const globalForCases = globalThis as unknown as {
  mockCases?: Map<string, MockCaseRecord>;
};

const mockCases = globalForCases.mockCases ?? new Map<string, MockCaseRecord>();
if (process.env.NODE_ENV !== "production") globalForCases.mockCases = mockCases;

function getMockCase(caseId: string): MockCaseRecord | null {
  return mockCases.get(caseId) ?? null;
}

function checkMockMembership(caseId: string, userId: string): boolean {
  const record = mockCases.get(caseId);
  if (!record) return false;
  return record.members.has(userId) || record.createdBy === userId;
}

/**
 * Checks if a user has access to a case (owner or member).
 */
export async function isUserCaseMember(
  caseId: string,
  userId: string,
  client: SupabaseClient | null
): Promise<boolean> {
  if (!client || process.env.CYBERDESK_FORCE_LOCAL_STORE === "1") {
    return checkMockMembership(caseId, userId);
  }

  try {
    const { data, error } = await client
      .from("case_members")
      .select("id")
      .eq("incident_id", caseId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Lists all cases for the authenticated user.
 */
export async function getUserCases(
  user: User,
  client: SupabaseClient | null
): Promise<CaseSummary[]> {
  if (!client || process.env.CYBERDESK_FORCE_LOCAL_STORE === "1") {
    const results: CaseSummary[] = [];
    for (const record of mockCases.values()) {
      if (checkMockMembership(record.id, user.id)) {
        const member = record.members.get(user.id);
        results.push({
          id: record.id,
          incidentType: record.incidentType,
          description: record.description,
          urgency: record.urgency,
          status: record.status,
          statusLabel: statusLabel(record.status),
          isDemo: record.isDemo,
          role: member?.role ?? "owner",
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          evidenceCount: record.evidence.size,
          verifiedFactCount: Array.from(record.facts.values()).filter(
            (f) => f.verificationStatus === "confirmed"
          ).length,
          caseReference: record.acknowledgementId,
        });
      }
    }
    // Return sorted newest first
    return results.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  try {
    // With RLS, querying incidents returns only cases the user is a member of (is_case_member = true)
    const { data: incidents, error } = await client
      .from("incidents")
      .select(`
        id,
        incident_type,
        description,
        urgency,
        status,
        is_demo,
        created_at,
        updated_at,
        case_members!inner(role, user_id),
        evidence(id),
        facts(id, verification_status),
        complaints(acknowledgement_id)
      `)
      .eq("case_members.user_id", user.id)
      .eq("is_demo", false)
      .order("updated_at", { ascending: false });

    if (error || !incidents) {
      console.error("Failed to query incidents from Supabase:", error);
      return [];
    }

    return incidents.map((inc: any) => {
      const memberRole = inc.case_members?.[0]?.role ?? "owner";
      const evidenceCount = Array.isArray(inc.evidence) ? inc.evidence.length : 0;
      const verifiedFactCount = Array.isArray(inc.facts)
        ? inc.facts.filter((f: any) => f.verification_status === "confirmed").length
        : 0;
      const ackId = inc.complaints?.[0]?.acknowledgement_id;

      return {
        id: inc.id,
        incidentType: inc.incident_type,
        description: inc.description,
        urgency: inc.urgency,
        status: inc.status,
        statusLabel: statusLabel(inc.status),
        isDemo: inc.is_demo,
        role: memberRole,
        createdAt: inc.created_at,
        updatedAt: inc.updated_at,
        evidenceCount,
        verifiedFactCount,
        caseReference: ackId,
      };
    });
  } catch (err) {
    console.error("getUserCases exception:", err);
    return [];
  }
}

/**
 * Fetches full case details for a specific case if the user is a member.
 */
export async function getCaseDetail(
  caseId: string,
  user: User,
  client: SupabaseClient | null
): Promise<CaseDetail | null> {
  if (!client || process.env.CYBERDESK_FORCE_LOCAL_STORE === "1") {
    if (!checkMockMembership(caseId, user.id)) return null;
    const record = getMockCase(caseId);
    if (!record) return null;
    const member = record.members.get(user.id);

    return {
      id: record.id,
      incidentType: record.incidentType,
      description: record.description,
      urgency: record.urgency,
      status: record.status,
      statusLabel: statusLabel(record.status),
      isDemo: record.isDemo,
      role: member?.role ?? "owner",
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      interpretation: record.interpretation,
      evidence: Array.from(record.evidence.values()),
      facts: Array.from(record.facts.values()),
      timeline: Array.from(record.timeline.values()),
      complaintText: record.complaintText,
      acknowledgementId: record.acknowledgementId,
      members: Array.from(record.members.values()),
    };
  }

  try {
    const { data: incident, error } = await client
      .from("incidents")
      .select(`
        id,
        incident_type,
        description,
        urgency,
        status,
        is_demo,
        created_at,
        updated_at,
        case_members(id, incident_id, user_id, role, created_at),
        evidence(*),
        facts(*),
        timeline_events(*),
        complaints(*)
      `)
      .eq("id", caseId)
      .maybeSingle();

    if (error || !incident) return null;

    const userMembership = incident.case_members?.find(
      (m: any) => m.user_id === user.id
    );
    if (!userMembership) return null;

    const evidenceList: EvidenceItem[] = (incident.evidence || []).map((e: any) => ({
      id: e.id,
      type: e.type,
      category: e.category,
      filename: e.filename,
      source: e.source,
      description: e.description || `Evidence file: ${e.filename}`,
      mimeType: e.mime_type,
      storageReference: e.storage_reference,
      uploadStatus: e.upload_status,
      extractionStatus: e.extraction_status,
      extractionNotes: e.extraction_notes,
      createdAt: e.created_at,
      isDemo: e.is_demo,
      candidateFields: Array.isArray(e.extracted_fields) ? e.extracted_fields : [],
      verificationStatus: e.verification_status,
    }));

    const factsList: CandidateField[] = (incident.facts || []).map((f: any) => ({
      id: f.id,
      fieldKey: f.field_key,
      label: f.fact_type,
      value: typeof f.value === "object" && f.value?.text ? f.value.text : JSON.stringify(f.value),
      source: f.source,
      evidenceId: f.evidence_id,
      confidence: f.confidence ? "high" : null,
      verificationStatus: f.verification_status,
      provenance: f.provenance,
    }));

    const timelineList: TimelineEvent[] = (incident.timeline_events || []).map((t: any) => ({
      eventKey: t.event_key,
      evidenceId: t.evidence_id,
      time: t.event_time ? new Date(t.event_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
      timeLabel: t.event_time_label || (t.event_time ? undefined : "Time not reported"),
      timePrecision: t.time_precision,
      title: t.event_type || "Incident event",
      detail: t.description,
      source: t.source,
    }));

    const complaint = incident.complaints?.[0];

    return {
      id: incident.id,
      incidentType: incident.incident_type,
      description: incident.description,
      urgency: incident.urgency,
      status: incident.status,
      statusLabel: statusLabel(incident.status),
      isDemo: incident.is_demo,
      role: userMembership.role,
      createdAt: incident.created_at,
      updatedAt: incident.updated_at,
      interpretation: null,
      evidence: evidenceList,
      facts: factsList,
      timeline: timelineList,
      complaintText: complaint?.complaint_text || "",
      acknowledgementId: complaint?.acknowledgement_id,
      members: incident.case_members.map((m: any) => ({
        id: m.id,
        incidentId: m.incident_id,
        userId: m.user_id,
        role: m.role,
        createdAt: m.created_at,
      })),
    };
  } catch (err) {
    console.error("getCaseDetail exception:", err);
    return null;
  }
}

/**
 * Creates a new case in the canonical incidents table and sets the user as owner in case_members.
 */
export async function createCase(
  user: User,
  input: CreateCaseInput,
  client: SupabaseClient | null
): Promise<CaseDetail> {
  const caseId = crypto.randomUUID();
  const now = new Date().toISOString();
  const incidentType =
    input.incidentType || input.interpretation?.incident_type || "Online cyber incident";
  const urgency = input.urgency || input.interpretation?.urgency || "high";

  if (!client || process.env.CYBERDESK_FORCE_LOCAL_STORE === "1") {
    const member: CaseMember = {
      id: crypto.randomUUID(),
      incidentId: caseId,
      userId: user.id,
      role: "owner",
      createdAt: now,
      email: user.email,
      fullName: (user.user_metadata?.full_name as string) || (user.email ? user.email.split("@")[0] : ""),
    };
    const membersMap = new Map<string, CaseMember>();
    membersMap.set(user.id, member);

    const record: MockCaseRecord = {
      id: caseId,
      incidentType,
      description: input.description,
      urgency,
      status: "draft",
      isDemo: false,
      createdBy: user.id,
      createdAt: now,
      updatedAt: now,
      interpretation: input.interpretation ?? null,
      evidence: new Map(),
      facts: new Map(),
      timeline: new Map(),
      complaintText: "",
      members: membersMap,
    };
    mockCases.set(caseId, record);

    return {
      id: record.id,
      incidentType: record.incidentType,
      description: record.description,
      urgency: record.urgency,
      status: record.status,
      statusLabel: statusLabel(record.status),
      isDemo: record.isDemo,
      role: "owner",
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      interpretation: record.interpretation,
      evidence: [],
      facts: [],
      timeline: [],
      complaintText: "",
      members: [member],
    };
  }

  // Live Supabase execution with service role for initial atomic creation
  const serviceClient = getSupabaseServiceRoleClient() || client;
  const { data: incident, error: incError } = await serviceClient
    .from("incidents")
    .insert({
      id: caseId,
      demo_key: null,
      incident_type: incidentType,
      description: input.description,
      urgency,
      status: "draft",
      is_demo: false,
      created_by: user.id,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (incError || !incident) {
    throw new Error(incError?.message ?? "Failed to create case incident record");
  }

  const { data: memberData, error: memberError } = await serviceClient
    .from("case_members")
    .upsert({
      incident_id: caseId,
      user_id: user.id,
      role: "owner",
      created_at: now,
    }, { onConflict: "incident_id,user_id" })
    .select()
    .single();

  if (memberError || !memberData) throw new Error(memberError?.message ?? "Failed to create case owner membership");

  const member: CaseMember = {
    id: memberData?.id || crypto.randomUUID(),
    incidentId: caseId,
    userId: user.id,
    role: "owner",
    createdAt: now,
    email: user.email,
  };

  return {
    id: incident.id,
    incidentType: incident.incident_type,
    description: incident.description,
    urgency: incident.urgency,
    status: incident.status,
    statusLabel: statusLabel(incident.status),
    isDemo: incident.is_demo,
    role: "owner",
    createdAt: incident.created_at,
    updatedAt: incident.updated_at,
    interpretation: input.interpretation ?? null,
    evidence: [],
    facts: [],
    timeline: [],
    complaintText: "",
    members: [member],
  };
}

/**
 * Saves or updates evidence item for an authenticated case.
 */
export async function saveCaseEvidence(
  caseId: string,
  user: User,
  evidence: EvidenceItem,
  client: SupabaseClient | null
): Promise<{ persisted: boolean }> {
  const norm = normaliseEvidence(evidence);
  norm.isDemo = false;

  if (!client || process.env.CYBERDESK_FORCE_LOCAL_STORE === "1") {
    if (!checkMockMembership(caseId, user.id)) return { persisted: false };
    const record = getMockCase(caseId);
    if (!record) return { persisted: false };
    record.evidence.set(norm.id, norm);
    record.updatedAt = new Date().toISOString();
    return { persisted: true };
  }

  try {
    const row = {
      id: norm.id,
      incident_id: caseId,
      type: norm.type,
      category: norm.category,
      filename: norm.filename,
      source: norm.source,
      mime_type: norm.mimeType,
      storage_reference: norm.storageReference,
      upload_status: norm.uploadStatus,
      extraction_status: norm.extractionStatus,
      extraction_notes: norm.extractionNotes ?? null,
      extracted_fields: norm.candidateFields,
      verification_status: norm.verificationStatus,
      is_demo: false,
      created_by: user.id,
    };

    const { error } = await client.from("evidence").upsert(row);
    if (error) {
      console.error("saveCaseEvidence error:", error);
      return { persisted: false };
    }
    return { persisted: true };
  } catch (err) {
    console.error("saveCaseEvidence exception:", err);
    return { persisted: false };
  }
}

/**
 * Saves verified evidence facts and rebuilds the case timeline.
 */
export async function saveCaseVerifiedEvidence(
  caseId: string,
  user: User,
  evidence: EvidenceItem,
  interpretation: Interpretation,
  client: SupabaseClient | null
): Promise<{ persisted: boolean; confirmedFieldCount: number }> {
  const norm = normaliseEvidence(evidence);
  norm.isDemo = false;
  const confirmedFields = norm.candidateFields.filter(
    (field) => field.verificationStatus === "confirmed"
  );

  if (!client || process.env.CYBERDESK_FORCE_LOCAL_STORE === "1") {
    if (!checkMockMembership(caseId, user.id)) {
      return { persisted: false, confirmedFieldCount: 0 };
    }
    const record = getMockCase(caseId);
    if (!record) return { persisted: false, confirmedFieldCount: 0 };

    record.evidence.set(norm.id, norm);
    confirmedFields.forEach((field) => {
      const key = normaliseFieldKey(field.fieldKey, field.label);
      record.facts.set(`${norm.id}-${key}`, {
        ...field,
        evidenceId: norm.id,
        verificationStatus: "confirmed",
      });
    });

    const amount = norm.candidateFields.find(
      (f) => (f.fieldKey === "transactionAmount" || f.label === "Amount") && f.verificationStatus === "confirmed"
    )?.value;
    const ref = norm.candidateFields.find(
      (f) => (f.fieldKey === "transactionReference" || f.label === "Reference") && f.verificationStatus === "confirmed"
    )?.value;
    const date = norm.candidateFields.find(
      (f) => (f.fieldKey === "eventDate" || f.label === "Possible date") && f.verificationStatus === "confirmed"
    )?.value;
    const time = norm.candidateFields.find(
      (f) => (f.fieldKey === "eventTime" || f.label === "Time") && f.verificationStatus === "confirmed"
    )?.value;

    if (amount || ref || date || time) {
      const eventKey = `evidence-${norm.id}-verified`;
      record.timeline.set(eventKey, {
        eventKey,
        evidenceId: norm.id,
        time: time || "",
        timeLabel: [date, time].filter(Boolean).join(" · ") || "Evidence-derived event",
        timePrecision: date && time ? "exact" : date ? "date" : "approximate",
        title: "Verified Transaction Detail",
        detail: [amount ? `Amount: ${amount}.` : "", ref ? `Reference: ${ref}.` : ""].filter(Boolean).join(" "),
        source: "Evidence-derived · citizen confirmed",
      });
    }

    record.updatedAt = new Date().toISOString();
    return { persisted: true, confirmedFieldCount: confirmedFields.length };
  }

  try {
    const { error: evError } = await client.from("evidence").upsert({
      id: norm.id,
      incident_id: caseId,
      type: norm.type,
      category: norm.category,
      filename: norm.filename,
      source: norm.source,
      mime_type: norm.mimeType,
      storage_reference: norm.storageReference,
      upload_status: norm.uploadStatus,
      extraction_status: norm.extractionStatus,
      extraction_notes: norm.extractionNotes ?? null,
      extracted_fields: norm.candidateFields,
      verification_status: "confirmed",
      is_demo: false,
      created_by: user.id,
    });
    if (evError) throw evError;

    if (norm.candidateFields.length > 0) {
      const factRows = norm.candidateFields.map((field) => ({
        incident_id: caseId,
        evidence_id: norm.id,
        field_key: normaliseFieldKey(field.fieldKey, field.label),
        fact_type: field.label,
        value: { text: field.value },
        source: field.verificationStatus === "confirmed" ? "Citizen confirmed from evidence" : field.source,
        confidence: null,
        verification_status: field.verificationStatus ?? "candidate",
        verified_at: field.verificationStatus === "confirmed" ? new Date().toISOString() : null,
        provenance: {
          evidenceId: norm.id,
          extractionSource: field.source,
          verification: field.verificationStatus,
        },
        is_demo: false,
        created_by: user.id,
      }));

      const { error: factsError } = await client
        .from("facts")
        .upsert(factRows, { onConflict: "incident_id,evidence_id,field_key" });
      if (factsError) throw factsError;
    }

    // Timeline event
    const amount = norm.candidateFields.find(
      (f) => (f.fieldKey === "transactionAmount" || f.label === "Amount") && f.verificationStatus === "confirmed"
    )?.value;
    const ref = norm.candidateFields.find(
      (f) => (f.fieldKey === "transactionReference" || f.label === "Reference") && f.verificationStatus === "confirmed"
    )?.value;
    const date = norm.candidateFields.find(
      (f) => (f.fieldKey === "eventDate" || f.label === "Possible date") && f.verificationStatus === "confirmed"
    )?.value;
    const time = norm.candidateFields.find(
      (f) => (f.fieldKey === "eventTime" || f.label === "Time") && f.verificationStatus === "confirmed"
    )?.value;

    if (amount || ref || date || time) {
      const eventKey = `evidence-${norm.id}-verified`;
      const timePrecision = date && time ? "exact" : date ? "date" : time ? "approximate" : "unknown";
      const { error: tlError } = await client.from("timeline_events").upsert(
        {
          incident_id: caseId,
          event_key: eventKey,
          evidence_id: norm.id,
          event_time: null,
          event_time_label: [date, time].filter(Boolean).join(" · ") || null,
          time_precision: timePrecision,
          event_type: "transaction_debit",
          description: [amount ? `Amount: ${amount}.` : "", ref ? `Reference: ${ref}.` : ""].filter(Boolean).join(" "),
          source: "Evidence-derived · citizen confirmed",
          verification_status: "confirmed",
          is_demo: false,
          created_by: user.id,
        },
        { onConflict: "incident_id,event_key" }
      );
      if (tlError) throw tlError;
    } else {
      const { error: staleTimelineError } = await client
        .from("timeline_events")
        .delete()
        .eq("incident_id", caseId)
        .eq("event_key", `evidence-${norm.id}-verified`);
      if (staleTimelineError) throw staleTimelineError;
    }

    return { persisted: true, confirmedFieldCount: confirmedFields.length };
  } catch (err) {
    console.error("saveCaseVerifiedEvidence exception:", err);
    return { persisted: false, confirmedFieldCount: 0 };
  }
}

/**
 * Submits the case report / complaint dossier.
 */
export async function submitCaseReport(
  caseId: string,
  user: User,
  complaintText: string,
  client: SupabaseClient | null
): Promise<{ acknowledgementId: string; status: CaseStatus }> {
  const shortId = caseId.slice(0, 8).toUpperCase();
  const acknowledgementId = `CYB-${shortId}`;
  const now = new Date().toISOString();

  if (!client || process.env.CYBERDESK_FORCE_LOCAL_STORE === "1") {
    if (!checkMockMembership(caseId, user.id)) {
      throw new Error("Unauthorized to submit this case");
    }
    const record = getMockCase(caseId);
    if (!record) throw new Error("Case not found");

    record.complaintText = complaintText;
    record.acknowledgementId = acknowledgementId;
    record.status = "submitted";
    record.updatedAt = now;

    return { acknowledgementId, status: "submitted" };
  }

  try {
    const { error: incError } = await client
      .from("incidents")
      .update({ status: "submitted", updated_at: now })
      .eq("id", caseId);
    if (incError) throw incError;

    const { data: complaint, error: compError } = await client
      .from("complaints")
      .upsert(
        {
          incident_id: caseId,
          complaint_text: complaintText,
          status: "submitted",
          acknowledgement_id: acknowledgementId,
          is_demo: false,
          created_by: user.id,
          updated_at: now,
        },
        { onConflict: "incident_id" }
      )
      .select("id, acknowledgement_id")
      .single();

    if (compError || !complaint) throw compError;

    const { error: eventError } = await client.from("complaint_events").upsert(
      [
        {
          complaint_id: complaint.id,
          status: "submitted",
          description: "Citizen report prepared and organized via CyberDesk",
          is_demo: false,
        },
      ],
      { onConflict: "complaint_id,status", ignoreDuplicates: true }
    );
    if (eventError) throw eventError;

    return { acknowledgementId, status: "submitted" };
  } catch (err) {
    console.error("submitCaseReport exception:", err);
    throw err;
  }
}
