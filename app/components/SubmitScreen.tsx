"use client";

import type { DemoCase } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

export interface SubmitScreenProps {
  caseInfo: DemoCase | null;
  onBack: () => void;
  onTrack: () => void;
}

export function SubmitScreen({ caseInfo, onBack, onTrack }: SubmitScreenProps) {
  const { t } = useI18n();

  return (
    <div className="step-panel submitted-panel">
      <div className="success-mark" aria-hidden="true">✓</div>
      <span className="eyebrow">{t.submitted.eyebrow}</span>
      <h2>{t.submitted.noGovernmentReport}</h2>
      <p>{t.submitted.subtext}</p>

      <div className="case-id">
        <span>{t.submitted.caseIdLabel}</span>
        <strong className="font-mono">{caseInfo?.caseId ?? "CYB-DEMO-84A21"}</strong>
        <small>{t.submitted.caseIdMeta}</small>
      </div>

      <div className="form-actions">
        <button type="button" className="secondary-button" onClick={onBack}>
          {t.submitted.reviewReportButton}
        </button>
        <button type="button" className="primary-button" onClick={onTrack}>
          {t.submitted.trackButton} <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}

