"use client";

import React from "react";
import type { EvidenceItem, Interpretation, JourneyStep } from "@/lib/types";

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
    <div className="incident-dossier-hud" role="region" aria-label="Incident Record Workspace">
      <div className="dossier-hud-top">
        <div className="dossier-meta">
          <span className="dossier-tag">Incident Record</span>
          <span className="dossier-id">CYB-DEMO-84A21</span>
          <span className="dossier-status-pill">Synthetic Demo Case</span>
        </div>
        <div className="dossier-provenance-stats">
          <span className="prov-stat stat-citizen">
            <span className="dot" aria-hidden="true" />
            <span>Citizen facts: <strong>{hasInterpretation ? "2" : "0"}</strong></span>
          </span>
          <span className="prov-stat stat-ai">
            <span className="dot" aria-hidden="true" />
            <span>AI suggestions: <strong>{hasInterpretation ? "1" : "0"}</strong></span>
          </span>
          <span className="prov-stat stat-demo">
            <span className="dot" aria-hidden="true" />
            <span>Demo artifacts: <strong>{hasEvidence ? "1" : "0"}</strong></span>
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
            <strong className="pillar-name">Understand</strong>
            <span className="pillar-state">
              {hasInterpretation ? "Details captured" : "In progress"}
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
            <strong className="pillar-name">Next Steps</strong>
            <span className="pillar-state">1930 & Bank actions</span>
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
            <strong className="pillar-name">Evidence</strong>
            <span className="pillar-state">
              {isEvidenceConfirmed
                ? "Verified facts ready"
                : hasEvidence
                ? "Candidate item ready"
                : "Awaiting items"}
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
            <strong className="pillar-name">Timeline</strong>
            <span className="pillar-state">
              {isEvidenceConfirmed ? "Ordered events ready" : "Pending verification"}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
