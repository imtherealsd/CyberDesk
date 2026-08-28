"use client";

import type { DemoCase } from "@/lib/types";
import { en } from "@/lib/i18n/en";

export interface SubmitScreenProps {
  caseInfo: DemoCase | null;
  onBack: () => void;
  onTrack: () => void;
}

export function SubmitScreen({ caseInfo, onBack, onTrack }: SubmitScreenProps) {
  return (
    <div className="step-panel submitted-panel">
      <div className="success-mark" aria-hidden="true">✓</div>
      <span className="eyebrow">{en.submitted.eyebrow}</span>
      <h2>{en.submitted.noGovernmentReport}</h2>
      <p>{en.submitted.subtext}</p>

      <div className="case-id">
        <span>{en.submitted.caseIdLabel}</span>
        <strong>{caseInfo?.caseId ?? "CYB-DEMO-84A21"}</strong>
        <small>{en.submitted.caseIdMeta}</small>
      </div>

      <div className="form-actions">
        <button type="button" className="secondary-button" onClick={onBack}>
          {en.submitted.reviewReportButton}
        </button>
        <button type="button" className="primary-button" onClick={onTrack}>
          {en.submitted.trackButton} <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
