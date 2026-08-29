"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildTimelineEvents,
  buildIncidentDossier,
  buildVerifiedFacts,
  demoNarrative,
  seededEvidence,
  seededInterpretation,
} from "@/lib/mock-data";
import { CASE_STATUS_LABELS, statusProgress } from "@/lib/case-status";
import type {
  DemoCase,
  EvidenceCategory,
  EvidenceItem,
  Interpretation,
  JourneyStep,
  StatusExplanation,
} from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import { getNormalisedMimeType, normaliseEvidence } from "@/lib/evidence";
import { getExtractionContent } from "@/lib/evidence-content";

import { CyberDeskShell } from "./components/CyberDeskShell";
import { EntryScreen } from "./components/EntryScreen";
import { IntakeScreen } from "./components/IntakeScreen";
import { UnderstandingScreen, type InterpretationSource } from "./components/UnderstandingScreen";
import { GuidanceScreen } from "./components/GuidanceScreen";
import { EvidenceScreen } from "./components/EvidenceScreen";
import { TimelineScreen } from "./components/TimelineScreen";
import { ReviewScreen } from "./components/ReviewScreen";
import { SubmitScreen } from "./components/SubmitScreen";
import { TrackingScreen } from "./components/TrackingScreen";

const BACK_STEPS: Record<JourneyStep, JourneyStep> = {
  entry: "entry",
  intake: "entry",
  understanding: "intake",
  guidance: "understanding",
  evidence: "guidance",
  timeline: "evidence",
  report: "timeline",
  submitted: "report",
  tracking: "submitted",
};

const JOURNEY_STORAGE_KEY = "cyberdesk-demo-journey-v2";

type PersistedJourney = {
  step: JourneyStep;
  description: string;
  interpretation: Interpretation | null;
  interpretationSource: InterpretationSource;
  evidence: EvidenceItem | null;
  complaintText: string;
  caseInfo: DemoCase | null;
  explanation: StatusExplanation | null;
};

const ALL_JOURNEY_STEPS: JourneyStep[] = [
  "entry",
  "intake",
  "understanding",
  "guidance",
  "evidence",
  "timeline",
  "report",
  "submitted",
  "tracking",
];

function isJourneyStep(value: unknown): value is JourneyStep {
  return typeof value === "string" && ALL_JOURNEY_STEPS.includes(value as JourneyStep);
}

export default function Home() {
  const { t } = useI18n();
  const [step, setStep] = useState<JourneyStep>("entry");
  const [description, setDescription] = useState("");
  const [interpretation, setInterpretation] = useState<Interpretation | null>(null);
  const [interpretationSource, setInterpretationSource] = useState<InterpretationSource>("openai");
  const [evidence, setEvidence] = useState<EvidenceItem | null>(null);
  const [complaintText, setComplaintText] = useState("");
  const [caseInfo, setCaseInfo] = useState<DemoCase | null>(null);
  const [explanation, setExplanation] = useState<StatusExplanation | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const currentStatus = caseInfo?.status ?? "under_review";
  const currentStatusLabel = caseInfo
    ? CASE_STATUS_LABELS[caseInfo.status]
    : CASE_STATUS_LABELS.under_review;
  const currentVerifiedFacts = useMemo(
    () => buildVerifiedFacts(interpretation, evidence),
    [interpretation, evidence]
  );
  const currentTimelineEvents = useMemo(
    () => buildTimelineEvents(evidence),
    [evidence]
  );
  const incidentDossier = useMemo(
    () => buildIncidentDossier(interpretation, evidence, caseInfo),
    [interpretation, evidence, caseInfo]
  );

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(JOURNEY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<PersistedJourney>;
        if (isJourneyStep(parsed.step)) setStep(parsed.step);
        if (typeof parsed.description === "string") setDescription(parsed.description);
        if (parsed.interpretation) setInterpretation(parsed.interpretation);
        if (
          parsed.interpretationSource === "openai" ||
          parsed.interpretationSource === "demo_fallback"
        ) {
          setInterpretationSource(parsed.interpretationSource);
        }
        if (parsed.evidence) setEvidence(parsed.evidence);
        if (typeof parsed.complaintText === "string") setComplaintText(parsed.complaintText);
        if (parsed.caseInfo) setCaseInfo(parsed.caseInfo);
        if (parsed.explanation) setExplanation(parsed.explanation);
      }
    } catch (storageError) {
      console.warn("Could not restore the synthetic demo session", storageError);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const state: PersistedJourney = {
      step,
      description,
      interpretation,
      interpretationSource,
      evidence,
      complaintText,
      caseInfo,
      explanation,
    };
    sessionStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(state));
  }, [
    hydrated,
    step,
    description,
    interpretation,
    interpretationSource,
    evidence,
    complaintText,
    caseInfo,
    explanation,
  ]);

  function begin() {
    setStep("intake");
    setError("");
    setNotice("");
  }

  function navigateTo(target: JourneyStep) {
    if (
      target === "entry" ||
      target === "intake" ||
      (target === "understanding" && interpretation) ||
      (target === "guidance" && interpretation) ||
      (target === "evidence" && interpretation) ||
      ((target === "timeline" || target === "report") &&
        evidence?.verificationStatus === "confirmed") ||
      ((target === "submitted" || target === "tracking") && caseInfo)
    ) {
      setStep(target);
      setError("");
      setNotice("");
    }
  }

  function goBack() {
    navigateTo(BACK_STEPS[step]);
  }

  async function understand() {
    setError("");
    if (description.trim().length < 20) {
      setError(t.intake.minCharsError);
      return;
    }
    setBusy("understand");
    try {
      const response = await fetch("/api/ai/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not interpret the description.");
      setInterpretation(data);
      setInterpretationSource("openai");
      setNotice("AI suggestion ready. Review it before it becomes part of your report.");
      setStep("understanding");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The AI interpretation could not be completed."
      );
    } finally {
      setBusy(null);
    }
  }

  async function uploadEvidenceFile(file: File, category: EvidenceCategory) {
    setBusy("upload");
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("category", category);
      const uploadResponse = await fetch("/api/evidence/upload", { method: "POST", body: form });
      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok) throw new Error(uploadData.error ?? "We couldn't receive that file.");

      const processingEvidence: EvidenceItem = {
        ...normaliseEvidence(uploadData.evidence as EvidenceItem),
        extractionStatus: "processing",
      };
      setEvidence(processingEvidence);
      setNotice(uploadData.storageMessage ?? "File received. CyberDesk is preparing it for review.");

      setBusy("extract");
      const extractionResponse = await fetch("/api/evidence/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evidence: uploadData.evidence,
          content: await getExtractionContent(file, getNormalisedMimeType(file.name, file.type)),
        }),
      });
      const extractionData = await extractionResponse.json();
      if (!extractionResponse.ok) throw new Error(extractionData.error ?? "We couldn't process that evidence yet.");

      setEvidence(normaliseEvidence(extractionData.evidence as EvidenceItem));
      setNotice(
        extractionData.extraction?.source === "openai"
          ? "AI found possible details. Review, edit or remove them before confirming."
          : "Evidence processed with the demo fallback. Review, edit or remove every detail before confirming."
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't process that evidence yet.");
      setEvidence((current) => current ? { ...current, extractionStatus: "failed" } : current);
    } finally {
      setBusy(null);
    }
  }

  function useSeededUnderstanding() {
    setDescription((current) => current || demoNarrative);
    setInterpretation(seededInterpretation);
    setInterpretationSource("demo_fallback");
    setNotice(
      "This demo suggestion is deterministic and clearly labelled because OpenAI is unavailable."
    );
    setStep("understanding");
    setError("");
  }

  function confirmUnderstanding() {
    setNotice("Confirmed by you. These facts can now guide the next steps.");
    setStep("guidance");
  }

  function addEvidence() {
    setEvidence({
      ...seededEvidence,
      candidateFields: seededEvidence.candidateFields.map((field) => ({ ...field })),
    });
    setNotice(
      "Synthetic evidence added. Its details remain candidate facts until you verify them."
    );
  }

  async function verifyEvidence() {
    if (!evidence || !interpretation) return;
    const verifiedAt = new Date().toISOString();
    const verifiedEvidence: EvidenceItem = {
      ...evidence,
      verificationStatus: "confirmed",
      candidateFields: evidence.candidateFields.map((field) =>
        field.verificationStatus === "rejected"
          ? field
          : {
            ...field,
            verificationStatus: "confirmed",
            provenance: field.provenance
              ? { ...field.provenance, origin: "citizen", verifiedAt }
              : undefined,
          }
      ),
    };
    setEvidence(verifiedEvidence);
    setBusy("verify");
    setError("");
    try {
      const response = await fetch("/api/evidence/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interpretation, evidence: verifiedEvidence }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "We couldn't save the verified evidence yet.");
      setStep("timeline");
      setNotice(
        data.persisted
          ? "Evidence facts confirmed by you and added to the incident record."
          : "Evidence facts confirmed by you. They are available in this demo session; cloud persistence was unavailable."
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't save the verified evidence yet.");
    } finally {
      setBusy(null);
    }
  }

  function openReport() {
    const amount = interpretation?.amount
      ? `₹${interpretation.amount.toLocaleString("en-IN")}`
      : "the synthetic amount";
    const method = interpretation?.possible_method ?? "the reported method";
    const reference =
      evidence?.candidateFields.find((field) => (field.fieldKey === "transactionReference" || field.label === "Reference" || field.label === "Transaction reference") && field.verificationStatus !== "rejected")?.value ??
      "the synthetic reference";
    setComplaintText(
      (current) =>
        current ||
        `I am reporting a synthetic online financial fraud incident involving ${method}. A fictional debit of ${amount} is shown in the demo evidence with reference ${reference}. The caller claimed that my KYC was expiring, sent a link, and the debit notification followed shortly after. I have preserved the synthetic evidence and would like this information reviewed.`
    );
    setStep("report");
  }

  async function submitReport() {
    if (!interpretation || !complaintText.trim()) return;
    setBusy("submit");
    setError("");
    try {
      const response = await fetch("/api/reports/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interpretation, evidence, complaintText }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save the mock report.");
      setCaseInfo(data);
      setExplanation(null);
      setStep("submitted");
      setNotice("The prototype saved a synthetic case state. No government report was filed.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The mock report could not be saved.");
    } finally {
      setBusy(null);
    }
  }

  async function viewCase() {
    setBusy("case");
    setError("");
    try {
      const response = await fetch("/api/demo-case");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "The demo case could not be loaded.");
      setCaseInfo(data);
      setExplanation(null);
      setStep("tracking");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The demo case could not be loaded. Please try again."
      );
    } finally {
      setBusy(null);
    }
  }

  async function explain() {
    setBusy("explain");
    setError("");
    try {
      const response = await fetch("/api/ai/explain-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: currentStatus,
          status_label: currentStatusLabel,
          case_id: caseInfo?.caseId ?? "CYB-DEMO-84A21",
          prior_events: statusProgress(currentStatus)
            .filter((item) => item.done)
            .map((item) => item.label),
          verified_context: currentVerifiedFacts,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not explain the status.");
      setExplanation(data);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The status explanation could not be completed."
      );
    } finally {
      setBusy(null);
    }
  }

  const pageTitle = useMemo(
    () =>
      ({
        entry: t.entry.headline,
        intake: t.intake.title,
        understanding: t.understanding.title,
        guidance: t.guidance.title,
        evidence: t.evidence.title,
        timeline: t.timeline.title,
        report: t.review.title,
        submitted: t.submitted.title,
        tracking: t.tracking.title,
      }[step]),
    [step, t]
  );

  const completedSteps = new Set<JourneyStep>();
  if (interpretation) {
    (["intake", "understanding", "guidance"] as JourneyStep[]).forEach((item) =>
      completedSteps.add(item)
    );
  }
  if (evidence) completedSteps.add("evidence");
  if (evidence?.verificationStatus === "confirmed") {
    (["timeline", "report"] as JourneyStep[]).forEach((item) => completedSteps.add(item));
  }
  if (caseInfo) {
    (["submitted", "tracking"] as JourneyStep[]).forEach((item) => completedSteps.add(item));
  }

  return (
    <CyberDeskShell
      currentStep={step}
      completedSteps={completedSteps}
      interpretation={interpretation}
      evidence={evidence}
      onNavigate={navigateTo}
    >
      {step !== "entry" && <h1>{pageTitle}</h1>}

      {notice && (
        <div className="notice" role="status">
          <span>✓</span> {notice}
        </div>
      )}

      {error && (
        <div className="error-box" role="alert">
          <strong>We could not complete that step.</strong>
          <span>{error}</span>
          {error.includes("not configured") && step === "intake" && (
            <button
              type="button"
              className="small-button"
              onClick={useSeededUnderstanding}
            >
              Continue with seeded demo data
            </button>
          )}
        </div>
      )}

      {step === "entry" && (
        <EntryScreen
          onBegin={begin}
          onViewCase={viewCase}
          busy={busy === "case"}
        />
      )}

      {step === "intake" && (
        <IntakeScreen
          description={description}
          setDescription={setDescription}
          onSubmit={understand}
          onSeed={useSeededUnderstanding}
          onContinue={() => navigateTo("understanding")}
          hasInterpretation={Boolean(interpretation)}
          onBack={goBack}
          busy={busy === "understand"}
        />
      )}

      {step === "understanding" && interpretation && (
        <UnderstandingScreen
          interpretation={interpretation}
          source={interpretationSource}
          onSave={setInterpretation}
          onConfirm={confirmUnderstanding}
          onBack={goBack}
        />
      )}

      {step === "guidance" && (
        <GuidanceScreen
          onBack={goBack}
          onContinue={() => setStep("evidence")}
        />
      )}

      {step === "evidence" && (
        <EvidenceScreen
          evidence={evidence}
          onAdd={addEvidence}
          onChange={setEvidence}
          onUploadFile={uploadEvidenceFile}
          busy={busy === "upload" || busy === "extract" || busy === "verify" ? busy : null}
          onBack={goBack}
          onContinue={verifyEvidence}
        />
      )}

      {step === "timeline" && (
        <TimelineScreen
          events={currentTimelineEvents}
          onBack={goBack}
          onContinue={openReport}
        />
      )}

      {step === "report" && (
        <ReviewScreen
          value={complaintText}
          facts={currentVerifiedFacts}
          dossier={incidentDossier}
          onChange={setComplaintText}
          onBack={goBack}
          onSubmit={submitReport}
          busy={busy === "submit"}
        />
      )}

      {step === "submitted" && (
        <SubmitScreen
          caseInfo={caseInfo}
          onBack={goBack}
          onTrack={() => setStep("tracking")}
        />
      )}

      {step === "tracking" && (
        <TrackingScreen
          caseInfo={caseInfo}
          explanation={explanation}
          onBack={goBack}
          onExplain={explain}
          busy={busy === "explain"}
        />
      )}
    </CyberDeskShell>
  );
}
