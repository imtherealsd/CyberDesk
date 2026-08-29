"use client";

import { useI18n } from "@/lib/i18n";
import type { IncidentDossier } from "@/lib/types";

export interface ReviewScreenProps {
  value: string;
  facts: string[];
  dossier: IncidentDossier;
  onChange: (val: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  busy: boolean;
}

export function ReviewScreen({
  value,
  facts,
  dossier,
  onChange,
  onBack,
  onSubmit,
  busy,
}: ReviewScreenProps) {
  const { t } = useI18n();

  function handlePrint() {
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  const confirmedFields = dossier.evidence.flatMap((ev) =>
    ev.candidateFields.filter((f) => f.verificationStatus === "confirmed")
  );

  return (
    <div className="step-panel review-panel">
      {/* Dossier Header */}
      <div className="dossier-header">
        <div className="dossier-header-top">
          <div>
            <div className="dossier-eyebrow">{t.dossierHud.badge}</div>
            <div className="dossier-case-id font-mono">
              {dossier.caseStatus === "draft" ? `DRAFT — CYB-DEMO-84A21` : `CYB-2026-84A21`}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="dossier-status-chip">
              {t.dossierHud.underReview}
            </span>
            <button
              type="button"
              className="dossier-print-btn print-visible"
              onClick={handlePrint}
              title="Print or save as PDF"
            >
              <span aria-hidden="true">🖨</span>
              Print / Save PDF
            </button>
          </div>
        </div>

        <div className="dossier-meta-row">
          <div className="dossier-meta-item">
            <span className="dossier-meta-label">{t.workspace.tabEvidence}</span>
            <span className="dossier-meta-value font-mono">{dossier.evidence.length}</span>
          </div>
          <div className="dossier-meta-item">
            <span className="dossier-meta-label">{t.evidence.statusVerified}</span>
            <span className="dossier-meta-value font-mono">{confirmedFields.length}</span>
          </div>
          <div className="dossier-meta-item">
            <span className="dossier-meta-label">{t.workspace.tabTimeline}</span>
            <span className="dossier-meta-value font-mono">{dossier.timeline.length}</span>
          </div>
        </div>
      </div>

      {/* Dossier Body */}
      <div className="dossier-body">
        {/* Section 1: Verified Facts */}
        {facts.length > 0 && (
          <div className="dossier-section">
            <span className="dossier-section-title">{t.review.verifiedFactsEyebrow}</span>
            <div className="dossier-facts-grid">
              {facts.map((fact) => {
                const [key, ...rest] = fact.split(": ");
                return (
                  <div key={fact} className="dossier-fact-pill">
                    <span className="dossier-fact-key">{key}</span>
                    <span className="dossier-fact-value font-mono">{rest.join(": ")}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 2: Evidence Index */}
        {dossier.evidence.length > 0 && (
          <div className="dossier-section">
            <span className="dossier-section-title">{t.workspace.tabEvidence}</span>
            <div className="dossier-evidence-index">
              {dossier.evidence.map((ev) => (
                <div key={ev.id} className="dossier-evidence-row">
                  <span className="prototype-badge" style={{ background: "var(--paper-subtle)" }}>
                    {ev.category?.replace("_", " ") || ev.type}
                  </span>
                  <span className="dossier-evidence-type">{ev.description || ev.filename}</span>
                  <span className="dossier-evidence-filename font-mono">{ev.filename}</span>
                  <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--muted)" }}>
                    {ev.candidateFields.filter((f) => f.verificationStatus === "confirmed").length} {t.evidence.statusVerified}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 3: Complaint Draft */}
        <div className="dossier-section">
          <span className="dossier-section-title">{t.review.label}</span>
          <div className="form-group-draft" style={{ marginBottom: 0 }}>
            <textarea
              id="draft"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              rows={9}
              maxLength={8000}
              className="review-textarea"
              aria-label={t.review.label}
            />
            <div className="field-meta">
              <span>{t.review.fieldMetaNotice}</span>
              <span>{value.length}/8000</span>
            </div>
          </div>
        </div>
      </div>

      {/* Disclosure */}
      <div className="disclosure" role="note" style={{ marginTop: "16px" }}>
        <span className="disclosure-icon" aria-hidden="true">i</span>
        <div>
          <strong>{t.review.disclosureTitle}</strong>
          <p>{t.review.disclosureBody}</p>
        </div>
      </div>

      {/* Print disclosure (hidden on screen, shown in print) */}
      <div className="print-disclosure" style={{ display: "none" }} aria-hidden="true">
        <strong>Important:</strong> {t.footer.disclaimer}
      </div>

      {/* Actions */}
      <div className="form-actions" style={{ marginTop: "20px" }}>
        <button type="button" className="secondary-button" onClick={onBack}>
          {t.common.back}
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={onSubmit}
          disabled={busy || value.trim().length < 40}
        >
          {busy ? (
            <>
              <span className="spinner" /> {t.review.submittingButton}
            </>
          ) : (
            <>
              {t.review.submitButton} <span aria-hidden="true">→</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

