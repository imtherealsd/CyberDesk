"use client";

import { use, useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { PublicNav } from "@/app/components/PublicNav";
import { PublicFooter } from "@/app/components/PublicFooter";
import { EvidenceScreen } from "@/app/components/EvidenceScreen";
import { TimelineScreen } from "@/app/components/TimelineScreen";
import { ReviewScreen } from "@/app/components/ReviewScreen";
import { TrackingScreen } from "@/app/components/TrackingScreen";
import { getNormalisedMimeType, normaliseEvidence } from "@/lib/evidence";
import type {
  CaseDetail,
  DemoCase,
  EvidenceCategory,
  EvidenceItem,
  Interpretation,
  StatusExplanation,
  TimelineEvent,
} from "@/lib/types";

type WorkspaceTab = "overview" | "evidence" | "timeline" | "report" | "tracking";

export default function CaseWorkspacePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id: caseId } = use(props.params);
  const { user, isLoading, authFetch } = useAuth();
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unauthorized, setUnauthorized] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [complaintText, setComplaintText] = useState("");
  const [explanation, setExplanation] = useState<StatusExplanation | null>(null);
  const router = useRouter();

  const fetchCase = useCallback(async () => {
    setLoading(true);
    setError("");
    setUnauthorized(false);
    try {
      const response = await authFetch(`/api/cases/${caseId}`);
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (response.status === 403 || response.status === 404) {
        setUnauthorized(true);
        setError("You do not have access to this case workspace or it does not exist.");
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to load case.");
      const detail = data.case as CaseDetail;
      setCaseDetail(detail);
      setComplaintText(detail.complaintText || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load case workspace.");
    } finally {
      setLoading(false);
    }
  }, [authFetch, caseId, router]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }
    if (user && caseId) {
      fetchCase();
    }
  }, [user, isLoading, caseId, router, fetchCase]);

  // Active evidence item for editing/verification
  const activeEvidence = useMemo(() => {
    return caseDetail?.evidence?.[0] || null;
  }, [caseDetail?.evidence]);

  const interpretation: Interpretation = useMemo(() => ({
    incident_type: caseDetail?.incidentType ?? "Cyber Incident",
    possible_method: null,
    amount: null,
    urgency: caseDetail?.urgency ?? "high",
    mentioned_evidence: [],
    missing_information: [],
    uncertainties: [],
  }), [caseDetail]);

  const demoCaseInfo: DemoCase | null = useMemo(() => {
    if (!caseDetail) return null;
    return {
      incidentId: caseDetail.id,
      caseId: caseDetail.acknowledgementId || `CASE-${caseDetail.id.slice(0, 8).toUpperCase()}`,
      status: caseDetail.status,
      statusLabel: caseDetail.statusLabel,
      updatedAt: caseDetail.updatedAt,
    };
  }, [caseDetail]);

  const verifiedFacts = useMemo(() => {
    if (!caseDetail?.facts) return [];
    return caseDetail.facts
      .filter((f) => f.verificationStatus === "confirmed")
      .map((f) => `${f.label}: ${f.value}`);
  }, [caseDetail?.facts]);

  const timelineEvents: TimelineEvent[] = useMemo(() => {
    if (caseDetail?.timeline && caseDetail.timeline.length > 0) {
      return caseDetail.timeline;
    }
    return [
      {
        time: "",
        timeLabel: "Report Created",
        timePrecision: "date",
        title: caseDetail?.incidentType || "Incident Created",
        detail: caseDetail?.description || "Workspace created by citizen.",
        source: "Citizen narrative",
      },
    ];
  }, [caseDetail]);

  const incidentDossier = useMemo(() => ({
    incidentSummary: caseDetail?.description || "",
    verifiedFacts,
    evidence: caseDetail?.evidence || [],
    timeline: timelineEvents,
    actions: ["Preserve digital communication", "Monitor bank accounts"],
    caseStatus: caseDetail?.status || "draft",
    disclosure: "Authenticated citizen workspace",
  }), [caseDetail, verifiedFacts, timelineEvents]);

  async function uploadEvidenceFile(file: File, category: EvidenceCategory) {
    setBusy("upload");
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("category", category);
      const uploadResponse = await authFetch(`/api/cases/${caseId}/evidence/upload`, {
        method: "POST",
        body: form,
      });
      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok) throw new Error(uploadData.error ?? "Failed to upload file.");

      setNotice("Evidence file securely stored. CyberDesk is extracting candidate details…");
      setBusy("extract");

      let contentData = "";
      const mimeType = getNormalisedMimeType(file.name, file.type);
      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        contentData = (await file.text()).slice(0, 60000);
      }

      const extractResponse = await authFetch(`/api/cases/${caseId}/evidence/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evidence: uploadData.evidence,
          content: contentData ? { kind: "text", data: contentData, mimeType } : undefined,
        }),
      });
      const extractData = await extractResponse.json();
      if (!extractResponse.ok) throw new Error(extractData.error ?? "Failed to extract evidence details.");

      setNotice("AI extracted candidate fields. Please review and confirm them.");
      await fetchCase();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evidence processing failed.");
    } finally {
      setBusy(null);
    }
  }

  async function handleVerifyEvidence() {
    if (!activeEvidence || !caseDetail) return;
    setBusy("verify");
    setError("");
    try {
      const verifiedEvidence: EvidenceItem = {
        ...activeEvidence,
        verificationStatus: "confirmed",
        candidateFields: activeEvidence.candidateFields.map((field) =>
          field.verificationStatus === "rejected"
            ? field
            : { ...field, verificationStatus: "confirmed" }
        ),
      };

      const response = await authFetch(`/api/cases/${caseId}/evidence/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interpretation,
          evidence: verifiedEvidence,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to verify evidence details.");

      setNotice("Evidence confirmed! Details have been added to the case timeline.");
      await fetchCase();
      setActiveTab("timeline");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setBusy(null);
    }
  }

  async function handleSubmitReport() {
    if (!complaintText.trim()) {
      setError("Please review and write your report summary before submitting.");
      return;
    }
    setBusy("submit");
    setError("");
    try {
      const response = await authFetch(`/api/cases/${caseId}/reports/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaintText: complaintText.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to submit report.");

      setNotice(`Report prepared and submitted with reference ${data.acknowledgementId}.`);
      await fetchCase();
      setActiveTab("tracking");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Report submission failed.");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="public-page-wrapper">
        <PublicNav />
        <main className="public-content-container" style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "var(--muted)" }}>Loading workspace…</p>
        </main>
        <PublicFooter />
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="public-page-wrapper">
        <PublicNav />
        <main className="public-content-container" style={{ maxWidth: "600px", margin: "60px auto" }}>
          <div className="error-box" role="alert" style={{ padding: "32px", textAlign: "center" }}>
            <h1 style={{ fontSize: "1.35rem", margin: "0 0 10px", color: "var(--coral)" }}>
              Access Denied
            </h1>
            <p style={{ margin: "0 0 20px" }}>{error}</p>
            <Link href="/cases" className="primary-button" style={{ display: "inline-block" }}>
              ← Return to My Cases
            </Link>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  if (!caseDetail) return null;

  return (
    <div className="workspace-page">
      {/* Workspace Header */}
      <header className="workspace-topbar">
        <div className="public-nav-container">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link
              href="/cases"
              style={{ color: "var(--muted)", fontSize: "0.85rem", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}
            >
              ← My Cases
            </Link>
            <span style={{ color: "var(--line-strong)", fontSize: "0.8rem" }}>|</span>
            <div>
              <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--ink)" }}>
                {caseDetail.incidentType || "Cyber Incident"}
              </span>
              <span style={{ fontSize: "0.78rem", color: "var(--muted)", marginLeft: "8px", fontVariantNumeric: "tabular-nums" }}>
                {caseDetail.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className={`status-badge ${caseDetail.status}`}>
              {caseDetail.statusLabel}
            </span>
            <span className={`urgency-badge ${caseDetail.urgency}`}>
              {caseDetail.urgency.toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      <main id="main-content" style={{ flex: 1, width: "min(1100px, 92vw)", margin: "24px auto 80px" }}>
        {notice && (
          <div className="notice" role="status" style={{ marginBottom: "20px" }}>
            <span aria-hidden="true">✓</span> {notice}
          </div>
        )}

        {error && (
          <div className="error-box" role="alert" style={{ marginBottom: "20px" }}>
            <strong>Workspace Notice</strong>
            <span>{error}</span>
          </div>
        )}

        {/* Workspace Tab Navigation */}
        <div
          className="workspace-tabs"
          role="tablist"
          aria-label="Workspace Tabs"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "overview"}
            className={`workspace-tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            1. Overview
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "evidence"}
            className={`workspace-tab ${activeTab === "evidence" ? "active" : ""}`}
            onClick={() => setActiveTab("evidence")}
          >
            2. Evidence
            <span className="workspace-tab-badge">{caseDetail.evidence.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "timeline"}
            className={`workspace-tab ${activeTab === "timeline" ? "active" : ""}`}
            onClick={() => setActiveTab("timeline")}
          >
            3. Timeline
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "report"}
            className={`workspace-tab ${activeTab === "report" ? "active" : ""}`}
            onClick={() => setActiveTab("report")}
          >
            4. Report
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "tracking"}
            className={`workspace-tab ${activeTab === "tracking" ? "active" : ""}`}
            onClick={() => setActiveTab("tracking")}
          >
            5. Tracking
          </button>
        </div>

        {/* Dynamic Workspace Health / Progress Summary */}
        <div className="workspace-health-bar" role="region" aria-label="Case workspace health summary">
          <div className="health-bar-item">
            <span className="health-bar-dot complete" aria-hidden="true" />
            <span>01 Story: <strong>Recorded</strong></span>
          </div>
          <span className="health-bar-divider" aria-hidden="true">/</span>
          <div className="health-bar-item">
            <span className={`health-bar-dot ${caseDetail.evidence.length > 0 ? "complete" : "active"}`} aria-hidden="true" />
            <span>02 Evidence: <strong>{caseDetail.evidence.length} file{caseDetail.evidence.length !== 1 ? "s" : ""} ({verifiedFacts.length} verified)</strong></span>
          </div>
          <span className="health-bar-divider" aria-hidden="true">/</span>
          <div className="health-bar-item">
            <span className={`health-bar-dot ${timelineEvents.length > 1 ? "complete" : "active"}`} aria-hidden="true" />
            <span>03 Timeline: <strong>{timelineEvents.length} event{timelineEvents.length !== 1 ? "s" : ""}</strong></span>
          </div>
          <span className="health-bar-divider" aria-hidden="true">/</span>
          <div className="health-bar-item">
            <span className={`health-bar-dot ${caseDetail.status === "submitted" ? "complete" : "active"}`} aria-hidden="true" />
            <span>04 Report: <strong>{caseDetail.status === "submitted" ? "Submitted" : "Draft ready"}</strong></span>
          </div>
          <span className="health-bar-divider" aria-hidden="true">/</span>
          <div className="health-bar-item">
            <span className="health-bar-dot complete" aria-hidden="true" />
            <span>05 Status: <strong>{caseDetail.statusLabel}</strong></span>
          </div>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="card" style={{ padding: "32px", border: "1px solid var(--line)" }}>
            <h2 style={{ fontSize: "1.25rem", margin: "0 0 16px", color: "var(--ink)" }}>
              Incident Summary
            </h2>
            <div style={{ background: "var(--paper-subtle)", padding: "16px 20px", borderRadius: "var(--radius-sm)", marginBottom: "24px" }}>
              <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {caseDetail.description}
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "28px" }}>
              <div style={{ padding: "16px", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block" }}>INCIDENT TYPE</span>
                <strong style={{ fontSize: "0.95rem" }}>{caseDetail.incidentType || "Online fraud"}</strong>
              </div>
              <div style={{ padding: "16px", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block" }}>URGENCY</span>
                <strong style={{ fontSize: "0.95rem" }}>{caseDetail.urgency.toUpperCase()}</strong>
              </div>
              <div style={{ padding: "16px", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block" }}>VERIFIED FACTS</span>
                <strong style={{ fontSize: "0.95rem" }}>{verifiedFacts.length} Confirmed</strong>
              </div>
              <div style={{ padding: "16px", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block" }}>ATTACHED EVIDENCE</span>
                <strong style={{ fontSize: "0.95rem" }}>{caseDetail.evidence.length} Files</strong>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="primary-button"
                onClick={() => setActiveTab("evidence")}
              >
                Continue to Evidence Locker →
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Evidence Locker */}
        {activeTab === "evidence" && (
          <div>
            <EvidenceScreen
              evidence={activeEvidence}
              onAdd={() => {}}
              onChange={(updated) => {
                if (updated) {
                  setCaseDetail((prev) => prev ? {
                    ...prev,
                    evidence: [normaliseEvidence(updated)],
                  } : null);
                }
              }}
              onUploadFile={uploadEvidenceFile}
              busy={busy === "upload" || busy === "extract" || busy === "verify" ? busy : null}
              onBack={() => setActiveTab("overview")}
              onContinue={handleVerifyEvidence}
            />
          </div>
        )}

        {/* Tab 3: Verified Timeline */}
        {activeTab === "timeline" && (
          <div>
            <TimelineScreen
              events={timelineEvents}
              onBack={() => setActiveTab("evidence")}
              onContinue={() => {
                if (!complaintText) {
                  setComplaintText(`I am reporting a cyber incident regarding ${caseDetail.incidentType || "an online fraud"}. ${caseDetail.description}`);
                }
                setActiveTab("report");
              }}
            />
          </div>
        )}

        {/* Tab 4: Report Review */}
        {activeTab === "report" && (
          <div>
            <ReviewScreen
              value={complaintText}
              facts={verifiedFacts}
              dossier={incidentDossier}
              onChange={setComplaintText}
              onBack={() => setActiveTab("timeline")}
              onSubmit={handleSubmitReport}
              busy={busy === "submit"}
            />
          </div>
        )}

        {/* Tab 5: Status Tracking */}
        {activeTab === "tracking" && (
          <div>
            <TrackingScreen
              caseInfo={demoCaseInfo}
              explanation={explanation}
              onBack={() => setActiveTab("report")}
              onExplain={async () => {
                setExplanation({
                  meaning: "Your incident report has been organized and recorded in your CyberDesk workspace.",
                  next_expected_step: "Review your verified timeline and preserve communications with your bank and local cyber cell.",
                  limitations: "CyberDesk is an assistance tool and does not replace official police or bank investigations.",
                  source: "demo_fallback",
                });
              }}
              busy={false}
            />
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
