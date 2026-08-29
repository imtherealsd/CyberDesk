"use client";

import { useI18n } from "@/lib/i18n";
import { SafetyNotice } from "./SafetyNotice";

export interface GuidanceScreenProps {
  onBack: () => void;
  onContinue: () => void;
}

export function GuidanceScreen({ onBack, onContinue }: GuidanceScreenProps) {
  const { t } = useI18n();

  return (
    <div className="step-panel guidance-panel">
      <SafetyNotice className="guidance-safety-notice" />

      <p className="lead">{t.guidance.lead}</p>

      <div className="guidance-list" aria-label="Recommended immediate actions">
        {t.guidance.steps.map((guide) => (
          <div className="guide-row" key={guide.number}>
            <span className={`guide-number ${guide.urgent ? "urgent" : ""}`}>
              {guide.number}
            </span>
            <div className="guide-content">
              <strong>{guide.title}</strong>
              <p>{guide.body}</p>
            </div>
            {guide.urgent && (
              <span className="urgent-label">{t.understanding.actSoon}</span>
            )}
          </div>
        ))}
      </div>

      <div className="next-action">
        <div>
          <span className="eyebrow">{t.guidance.nextActionEyebrow}</span>
          <strong>{t.guidance.nextActionTitle}</strong>
          <p>{t.guidance.nextActionDesc}</p>
        </div>
        <div className="action-buttons">
          <button type="button" className="secondary-button" onClick={onBack}>
            {t.common.back}
          </button>
          <button type="button" className="primary-button" onClick={onContinue}>
            {t.guidance.continueButton} <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

