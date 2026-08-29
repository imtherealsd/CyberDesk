"use client";

import { use, useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { PublicNav } from "@/app/components/PublicNav";
import { PublicFooter } from "@/app/components/PublicFooter";
import { EvidenceScreen } from "@/app/components/EvidenceScreen";
import { TimelineScreen } from "@/app/components/TimelineScreen";
import { ReviewScreen } from "@/app/components/ReviewScreen";
import { TrackingScreen } from "@/app/components/TrackingScreen";
import { getNormalisedMimeType, normaliseEvidence } from "@/lib/evidence";
import { getExtractionContent } from "@/lib/evidence-content";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type {
  CaseDetail,
  DemoCase,
  EvidenceCategory,
  EvidenceItem,
  IncidentDossier,
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
  const { t } = useI18n();
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
        setError(t.common.unauthorizedMessage);
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
  }, [authFetch, caseId, router, t.common.unauthorizedMessage]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }
    if (user && caseId) {
      fetchCase();

      // Supabase Realtime channel subscription for live updates
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        const channel = supabase
          .channel(`realtime-case-${caseId}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "evidence", filter: `incident_id=eq.${caseId}` },
            () => fetchCase()
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "facts", filter: `incident_id=eq.${caseId}` },
            () => fetchCase()
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "incidents", filter: `id=eq.${caseId}` },
            () => fetchCase()
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
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
      incidentType: caseDetail.incidentType,
      urgency: caseDetail.urgency,
      evidenceCount: caseDetail.evidence.length,
      verifiedFactCount: caseDetail.evidence.flatMap((ev) =>
        ev.candidateFields.filter((f) => f.verificationStatus === "confirmed")
      ).length,
    };
  }, [caseDetail]);

  // Verified facts array
  const verifiedFacts: string[] = useMemo(() => {
    if (!caseDetail) return [];
    const facts: string[] = [];
    if (caseDetail.incidentType) facts.push(`Type: ${caseDetail.incidentType}`);
    caseDetail.evidence.forEach((ev) => {
      ev.candidateFields
        .filter((f) => f.verificationStatus === "confirmed")
        .forEach((f) => facts.push(`${f.label}: ${f.value}`));
    });
    return facts;
  }, [caseDetail]);

  // Timeline events
  const timelineEvents: TimelineEvent[] = useMemo(() => {
    if (!caseDetail) return [];
    const events: TimelineEvent[] = [];

    events.push({
      time: new Date(caseDetail.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timeLabel: "Incident logged",
      title: "Incident Workspace Created",
      detail: caseDetail.description,
      source: "Citizen reported",
    });

    caseDetail.evidence.forEach((ev) => {
      ev.candidateFields
        .filter((f) => f.verificationStatus === "confirmed")
        .forEach((f) => {
          events.push({
            time: "Verified",
            timeLabel: "Fact",
            title: `Confirmed: ${f.label}`,
            detail: `${f.label}: ${f.value}`,
            source: "Evidence-derived",
          });
        });
    });

    if (caseDetail.status === "submitted") {
      events.push({
        time: new Date(caseDetail.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        timeLabel: "Report Finalized",
        title: "Incident Report Finalized",
        detail: "Report was reviewed and prepared for external filing with bank and cyber authorities.",
        source: "Citizen verified",
      });
    }

    return events;
  }, [caseDetail]);

  // Incident Dossier representation
  const incidentDossier: IncidentDossier = useMemo(() => {
    return {
      incidentSummary: caseDetail?.description || "",
      evidence: caseDetail?.evidence || [],
      timeline: timelineEvents,
      verifiedFacts,
      actions: ["Preserve digital communication", "Monitor bank accounts"],
      caseStatus: caseDetail?.status || "draft",
      disclosure: "Authenticated citizen workspace",
    };
  }, [caseDetail, timelineEvents, verifiedFacts]);

  // Upload evidence file
  async function uploadEvidenceFile(file: File, category: EvidenceCategory) {
    if (!caseDetail) return;
    setBusy("upload");
    setError("");

    let uploadedEvidence: EvidenceItem | null = null;
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);

      const response = await authFetch(`/api/cases/${caseId}/evidence/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Upload failed");
      if (data.metadataPersisted !== true) {
        throw new Error("Evidence metadata could not be saved, so analysis was not started.");
      }

      uploadedEvidence = normaliseEvidence(data.evidence as EvidenceItem);
      setCaseDetail((previous) => previous ? {
        ...previous,
        evidence: previous.evidence.some((item) => item.id === uploadedEvidence?.id)
          ? previous.evidence.map((item) => item.id === uploadedEvidence?.id ? uploadedEvidence as EvidenceItem : item)
          : [uploadedEvidence as EvidenceItem, ...previous.evidence],
      } : previous);

      setBusy("extract");
      const extractionResponse = await authFetch(`/api/cases/${caseId}/evidence/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evidence: uploadedEvidence,
          content: await getExtractionContent(file, getNormalisedMimeType(file.name, file.type)),
        }),
      });
      const extractionData = await extractionResponse.json();
      if (!extractionResponse.ok) throw new Error(extractionData.error ?? "Could not analyze evidence.");
      if (extractionData.metadataPersisted !== true) {
        throw new Error("Evidence was uploaded, but its analysis could not be saved.");
      }

      const storageNotice = uploadedEvidence.uploadStatus === "uploaded"
        ? ""
        : " No private cloud copy exists for this session.";
      setNotice(
        ((extractionData.extraction?.source === "gemini" || extractionData.extraction?.source === "openai")
          ? "Evidence analyzed. Review the untrusted candidate details before confirming."
          : "Evidence analyzed with the deterministic fallback. Review every candidate detail before confirming.") + storageNotice
      );
      await fetchCase();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evidence upload failed.");
      if (uploadedEvidence) {
        setCaseDetail((previous) => previous ? {
          ...previous,
          evidence: previous.evidence.map((item) => item.id === uploadedEvidence?.id
            ? { ...item, extractionStatus: "failed", extractionNotes: "Evidence was uploaded, but analysis did not complete." }
            : item),
        } : previous);
      }
    } finally {
      setBusy(null);
    }
  }

  // Verify and confirm evidence fields
  async function handleVerifyEvidence() {
    if (!caseDetail || !activeEvidence) {
      setActiveTab("timeline");
      return;
    }
    setBusy("verify");
    setError("");
    try {
      // Mark all non-rejected fields as confirmed before sending
      const verifiedAt = new Date().toISOString();
      const verifiedEvidence: EvidenceItem = {
        ...activeEvidence,
        verificationStatus: "confirmed",
        candidateFields: activeEvidence.candidateFields.map((field) =>
          field.verificationStatus === "rejected"
            ? field
            : {
                ...field,
                verificationStatus: "confirmed",
                provenance: field.provenance
                  ? { ...field.provenance, origin: "citizen" as const, verifiedAt }
                  : undefined,
              }
        ),
      };

      const response = await authFetch(`/api/cases/${caseId}/evidence/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interpretation, evidence: verifiedEvidence }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not verify evidence.");

      setNotice(`Evidence verified — ${data.confirmedFieldCount ?? 0} facts confirmed.`);
      await fetchCase();
      setActiveTab("timeline");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify evidence.");
      setActiveTab("timeline");
    } finally {
      setBusy(null);
    }
  }

  // Submit report
  async function handleSubmitReport() {
    if (!caseDetail) return;
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
      if (!response.ok) throw new Error(data.error ?? "Failed to finalize report");

      setNotice(t.workspace.reportSubmittedNotice);
      await fetchCase();
      setActiveTab("tracking");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit report.");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="workspace-page">
        <PublicNav />
        <main id="main-content" className="workspace-main flex-center" style={{ minHeight: "40vh" }}>
          <p style={{ color: "var(--muted)" }}>{t.common.loading}</p>
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
              {t.common.accessDenied}
            </h1>
            <p style={{ margin: "0 0 20px" }}>{error}</p>
            <Link href="/cases" className="primary-button" style={{ display: "inline-block" }}>
              ← {t.nav.myCases}
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
          <div className="flex-row gap-sm">
            <Link
              href="/cases"
              style={{ color: "var(--muted)", fontSize: "0.85rem", textDecoration: "none" }}
              className="flex-row gap-xs"
            >
              ← {t.nav.myCases}
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
            <strong>{t.common.accessDenied}</strong>
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
            1. {t.workspace.tabOverview}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "evidence"}
            className={`workspace-tab ${activeTab === "evidence" ? "active" : ""}`}
            onClick={() => setActiveTab("evidence")}
          >
            2. {t.workspace.tabEvidence}
            <span className="workspace-tab-badge">{caseDetail.evidence.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "timeline"}
            className={`workspace-tab ${activeTab === "timeline" ? "active" : ""}`}
            onClick={() => setActiveTab("timeline")}
          >
            3. {t.workspace.tabTimeline}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "report"}
            className={`workspace-tab ${activeTab === "report" ? "active" : ""}`}
            onClick={() => setActiveTab("report")}
          >
            4. {t.workspace.tabReport}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "tracking"}
            className={`workspace-tab ${activeTab === "tracking" ? "active" : ""}`}
            onClick={() => setActiveTab("tracking")}
          >
            5. {t.tracking.title}
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
            <span>02 {t.workspace.tabEvidence}: <strong>{caseDetail.evidence.length} ({verifiedFacts.length} {t.evidence.statusVerified})</strong></span>
          </div>
          <span className="health-bar-divider" aria-hidden="true">/</span>
          <div className="health-bar-item">
            <span className={`health-bar-dot ${timelineEvents.length > 1 ? "complete" : "active"}`} aria-hidden="true" />
            <span>03 {t.workspace.tabTimeline}: <strong>{timelineEvents.length}</strong></span>
          </div>
          <span className="health-bar-divider" aria-hidden="true">/</span>
          <div className="health-bar-item">
            <span className={`health-bar-dot ${caseDetail.status === "submitted" ? "complete" : "active"}`} aria-hidden="true" />
            <span>04 {t.workspace.tabReport}: <strong>{caseDetail.status === "submitted" ? t.submitted.eyebrow : t.dossierHud.draft}</strong></span>
          </div>
          <span className="health-bar-divider" aria-hidden="true">/</span>
          <div className="health-bar-item">
            <span className="health-bar-dot complete" aria-hidden="true" />
            <span>05 {t.cases.tableStatus}: <strong>{caseDetail.statusLabel}</strong></span>
          </div>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="card" style={{ padding: "32px", border: "1px solid var(--line)" }}>
            <h2 style={{ fontSize: "1.25rem", margin: "0 0 16px", color: "var(--ink)" }}>
              {t.workspace.tabOverview}
            </h2>
            <div style={{ background: "var(--paper-subtle)", padding: "16px 20px", borderRadius: "var(--radius-sm)", marginBottom: "24px" }}>
              <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {caseDetail.description}
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "28px" }}>
              <div style={{ padding: "16px", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block" }}>{t.cases.tableType}</span>
                <strong style={{ fontSize: "0.95rem" }}>{caseDetail.incidentType || "Online fraud"}</strong>
              </div>
              <div style={{ padding: "16px", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block" }}>{t.cases.tableUrgency}</span>
                <strong style={{ fontSize: "0.95rem" }}>{caseDetail.urgency.toUpperCase()}</strong>
              </div>
              <div style={{ padding: "16px", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block" }}>{t.evidence.statusVerified}</span>
                <strong style={{ fontSize: "0.95rem" }}>{verifiedFacts.length}</strong>
              </div>
              <div style={{ padding: "16px", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block" }}>{t.workspace.tabEvidence}</span>
                <strong style={{ fontSize: "0.95rem" }}>{caseDetail.evidence.length}</strong>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="primary-button"
                onClick={() => setActiveTab("evidence")}
              >
                {t.evidence.title} →
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
                    evidence: prev.evidence.map((item) => item.id === updated.id ? normaliseEvidence(updated) : item),
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
                setBusy("explain");
                setError("");
                try {
                  const response = await authFetch("/api/ai/explain-status", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      status: caseDetail.status,
                      status_label: caseDetail.statusLabel,
                      case_id: caseDetail.acknowledgementId || caseDetail.id.slice(0, 8).toUpperCase(),
                      verified_context: verifiedFacts.length > 0 ? verifiedFacts : [
                        `Incident Type: ${caseDetail.incidentType || "Online cyber incident"}`,
                        `Description: ${caseDetail.description.slice(0, 300)}`
                      ],
                    }),
                  });
                  const data = await response.json();
                  if (!response.ok) throw new Error(data.error ?? "Could not explain the status.");
                  setExplanation(data);
                } catch (err) {
                  setExplanation({
                    meaning: "Your incident report has been organized and recorded in your CyberDesk workspace.",
                    next_expected_step: "Review your verified timeline and preserve communications with your bank and local cyber cell.",
                    limitations: "CyberDesk is an assistance tool and does not replace official police or bank investigations.",
                    source: "demo_fallback",
                  });
                } finally {
                  setBusy(null);
                }
              }}
              busy={busy === "explain"}
            />
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
