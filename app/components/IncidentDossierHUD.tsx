"use client";

import React from "react";
import type { EvidenceItem, Interpretation, JourneyStep } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

export interface IncidentDossierHUDProps {
  currentStep: JourneyStep;
  interpretation: Interpretation | null;
  evidence: EvidenceItem | null;
  onNavigate: (step: JourneyStep) => void;
}

export function IncidentDossierHUD({
  currentStep,
  interpretation,
  evidence,
  onNavigate,
}: IncidentDossierHUDProps) {
  const { t } = useI18n();

  // Only show the dossier HUD during active incident construction steps
  const showHUD = [
    "understanding",
    "guidance",
    "evidence",
    "timeline",
    "report",
  ].includes(currentStep);

  if (!showHUD) return null;

  const hasInterpretation = Boolean(interpretation);
  const hasEvidence = Boolean(evidence);
  const isEvidenceConfirmed = evidence?.verificationStatus === "confirmed";

  return (
    <div className="incident-dossier-hud" role="region" aria-label={t.dossierHud.badge}>
      <div className="dossier-hud-top">
        <div className="dossier-meta">
          <span className="dossier-tag">{t.dossierHud.badge}</span>
          <span className="dossier-id font-mono">CYB-DEMO-84A21</span>
          <span className="dossier-status-pill">{t.dossierHud.underReview}</span>
        </div>
        <div className="dossier-provenance-stats">
          <span className="prov-stat stat-citizen">
            <span className="dot" aria-hidden="true" />
            <span>{t.evidence.provenanceCitizen}: <strong>{hasInterpretation ? "2" : "0"}</strong></span>
          </span>
          <span className="prov-stat stat-ai">
            <span className="dot" aria-hidden="true" />
            <span>{t.evidence.provenanceAi}: <strong>{hasInterpretation ? "1" : "0"}</strong></span>
          </span>
          <span className="prov-stat stat-demo">
            <span className="dot" aria-hidden="true" />
            <span>{t.evidence.provenanceDemo}: <strong>{hasEvidence ? "1" : "0"}</strong></span>
          </span>
        </div>
      </div>

      <div className="dossier-pillars-grid">
        <button
          type="button"
          className={`dossier-pillar-btn ${currentStep === "understanding" ? "active" : ""} ${hasInterpretation ? "ready" : ""}`}
          onClick={() => hasInterpretation && onNavigate("understanding")}
          disabled={!hasInterpretation}
        >
          <span className="pillar-num">01</span>
          <div className="pillar-info">
            <strong className="pillar-name">{t.journey.steps[1].label}</strong>
            <span className="pillar-state">
              {hasInterpretation ? t.dossierHud.verified : t.common.loading}
            </span>
          </div>
        </button>

        <button
          type="button"
          className={`dossier-pillar-btn ${currentStep === "guidance" ? "active" : ""} ${hasInterpretation ? "ready" : ""}`}
          onClick={() => hasInterpretation && onNavigate("guidance")}
          disabled={!hasInterpretation}
        >
          <span className="pillar-num">02</span>
          <div className="pillar-info">
            <strong className="pillar-name">{t.journey.steps[2].label}</strong>
            <span className="pillar-state">1930 &amp; {t.entry.dossierPreview.actionBank}</span>
          </div>
        </button>

        <button
          type="button"
          className={`dossier-pillar-btn ${currentStep === "evidence" ? "active" : ""} ${hasEvidence ? "ready" : ""}`}
          onClick={() => hasInterpretation && onNavigate("evidence")}
          disabled={!hasInterpretation}
        >
          <span className="pillar-num">03</span>
          <div className="pillar-info">
            <strong className="pillar-name">{t.journey.steps[3].label}</strong>
            <span className="pillar-state">
              {isEvidenceConfirmed
                ? t.dossierHud.verified
                : hasEvidence
                ? t.evidence.fieldSourceBadge
                : t.evidence.emptyTitle}
            </span>
          </div>
        </button>

        <button
          type="button"
          className={`dossier-pillar-btn ${currentStep === "timeline" ? "active" : ""} ${isEvidenceConfirmed ? "ready" : ""}`}
          onClick={() => isEvidenceConfirmed && onNavigate("timeline")}
          disabled={!isEvidenceConfirmed}
        >
          <span className="pillar-num">04</span>
          <div className="pillar-info">
            <strong className="pillar-name">{t.journey.steps[4].label}</strong>
            <span className="pillar-state">
              {isEvidenceConfirmed ? t.dossierHud.verified : t.understanding.unclearEyebrow}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}

