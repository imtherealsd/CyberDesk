import type { DemoCase, EvidenceItem, IncidentDossier, Interpretation, TimelineEvent } from "./types";

export const demoNarrative =
  "Someone called saying they were from my bank and that my KYC was going to expire. They sent me a link. I opened it and shortly after I got a message saying ₹35,000 had been debited. I don't know what to do or what I need to report.";

export const seededInterpretation: Interpretation = {
  incident_type: "Online financial fraud",
  possible_method: "Bank impersonation and a suspicious KYC link",
  amount: 35000,
  urgency: "high",
  mentioned_evidence: ["Caller details", "KYC link", "Debit notification"],
  missing_information: ["Approximate time of the call", "The link or message that was received"],
  uncertainties: ["The exact way the debit was authorised is not clear yet"],
};

export const seededEvidence: EvidenceItem = {
  id: "evidence-demo-transaction",
  type: "Transaction notification",
  category: "transaction",
  filename: "synthetic-transaction-notification.txt",
  source: "Synthetic transaction notification",
  description: "A fictional debit alert included for the demo. No real bank or transaction system is connected.",
  mimeType: "text/plain",
  storageReference: null,
  uploadStatus: "demo",
  extractionStatus: "complete",
  extractionNotes: "Seeded synthetic evidence for the demo journey.",
  createdAt: "2026-08-26T14:32:00+05:30",
  isDemo: true,
  candidateFields: [
    { id: "demo-amount", fieldKey: "transactionAmount", label: "Amount", value: "₹35,000", source: "Synthetic transaction notification", evidenceId: "evidence-demo-transaction", verificationStatus: "candidate" },
    { id: "demo-time", fieldKey: "eventTime", label: "Time", value: "14:32 IST", source: "Synthetic transaction notification", evidenceId: "evidence-demo-transaction", verificationStatus: "candidate" },
    { id: "demo-reference", fieldKey: "transactionReference", label: "Reference", value: "TXN-DEMO-84A21", source: "Synthetic transaction notification", evidenceId: "evidence-demo-transaction", verificationStatus: "candidate" },
  ],
  verificationStatus: "candidate",
};

export const timelineEvents: TimelineEvent[] = [
  { eventKey: "reported-caller", time: "—", timeLabel: "Time not reported", timePrecision: "unknown", title: "Caller claims to be from a bank", detail: "A caller says KYC is about to expire.", source: "Citizen description" },
  { eventKey: "reported-link", time: "—", timeLabel: "Time not reported", timePrecision: "unknown", title: "KYC link received", detail: "A suspicious link is sent during the call.", source: "Citizen description" },
  { eventKey: "reported-link-opened", time: "—", timeLabel: "Time not reported", timePrecision: "unknown", title: "Link opened", detail: "The link is opened before the debit notification arrives.", source: "Citizen description" },
  { eventKey: "synthetic-debit", time: "14:32", timeLabel: "Synthetic demo", timePrecision: "exact", title: "Synthetic debit appears", detail: "A fictional ₹35,000 debit is shown in the demo evidence.", source: "Verified synthetic evidence" },
];

export const verifiedFacts = [
  "Online financial fraud",
  "Bank impersonation and a suspicious KYC link",
  "₹35,000 synthetic debit",
  "Reference TXN-DEMO-84A21",
];

export function buildTimelineEvents(evidence: EvidenceItem | null): TimelineEvent[] {
  const confirmedFields = evidence?.candidateFields.filter((field) => field.verificationStatus === "confirmed") ?? [];
  const getConfirmed = (fieldKey: string, labels: string[]) => confirmedFields.find((field) =>
    field.fieldKey === fieldKey || labels.includes(field.label)
  )?.value;
  const amount = getConfirmed("transactionAmount", ["Amount"]);
  const reference = getConfirmed("transactionReference", ["Reference", "Transaction reference"]);
  const date = getConfirmed("eventDate", ["Possible date"]);
  const time = getConfirmed("eventTime", ["Time", "Approximate time"]);
  const hasPaymentEvidence = Boolean(amount || reference || date || time);

  return timelineEvents.flatMap((event) => {
    if (event.title !== "Synthetic debit appears") return [event];
    if (!hasPaymentEvidence) return [];

    const displayTime = [date, time?.replace(/\s*IST$/i, "")].filter(Boolean).join(" · ") || "—";
    const detail = [
      amount
        ? evidence?.isDemo
          ? `A fictional ${amount} debit is shown in the demo evidence.`
          : `A debit of ${amount} is referenced in the evidence.`
        : "A payment event is referenced in the evidence.",
      reference ? `Reference: ${reference}.` : "",
    ].filter(Boolean).join(" ");

    return [{
      ...event,
      time: displayTime,
      timeLabel: "Evidence-derived · demo information",
      timePrecision: date && time ? "exact" : date ? "date" : time ? "approximate" : "unknown",
      source: evidence?.isDemo
        ? "Evidence-derived · citizen confirmed · demo information"
        : "Evidence-derived · citizen confirmed",
      evidenceId: evidence?.id,
      detail,
    }];
  });
}

export function buildVerifiedFacts(interpretation: Interpretation | null, evidence: EvidenceItem | null): string[] {
  const fields = evidence?.candidateFields.filter((field) => field.verificationStatus === "confirmed") ?? [];
  const amount = fields.find((field) => field.fieldKey === "transactionAmount" || field.label === "Amount")?.value;
  const reference = fields.find((field) => field.fieldKey === "transactionReference" || ["Reference", "Transaction reference"].includes(field.label))?.value;
  return [
    interpretation?.incident_type ?? "Incident type not confirmed",
    interpretation?.possible_method ?? "Method not confirmed",
    ...(amount ? [`${amount} ${evidence?.isDemo ? "synthetic debit" : "debit referenced in evidence"}`] : []),
    ...(reference ? [`Reference ${reference}`] : []),
  ];
}

export function buildIncidentDossier(
  interpretation: Interpretation | null,
  evidence: EvidenceItem | null,
  caseInfo: DemoCase | null,
  actions: string[] = []
): IncidentDossier {
  return {
    incidentSummary: interpretation?.incident_type
      ? `${interpretation.incident_type}${interpretation.possible_method ? ` involving ${interpretation.possible_method}` : ""}.`
      : "Incident summary is still being prepared.",
    verifiedFacts: buildVerifiedFacts(interpretation, evidence),
    evidence: evidence ? [evidence] : [],
    timeline: buildTimelineEvents(evidence),
    actions,
    caseStatus: caseInfo?.status ?? "draft",
    disclosure: "This is a synthetic prototype dossier. It is not an official complaint or investigation record.",
  };
}
