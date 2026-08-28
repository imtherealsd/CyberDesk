"use client";

import { en } from "@/lib/i18n/en";
import { SafetyNotice } from "./SafetyNotice";

export interface GuidanceScreenProps {
  onBack: () => void;
  onContinue: () => void;
}

export function GuidanceScreen({ onBack, onContinue }: GuidanceScreenProps) {
  return (
    <div className="step-panel guidance-panel">
      <SafetyNotice className="guidance-safety-notice" />

      <p className="lead">{en.guidance.lead}</p>

      <div className="guidance-list" aria-label="Recommended immediate actions">
        {en.guidance.steps.map((guide) => (
          <div className="guide-row" key={guide.number}>
            <span className={`guide-number ${guide.urgent ? "urgent" : ""}`}>
              {guide.number}
            </span>
            <div className="guide-content">
              <strong>{guide.title}</strong>
              <p>{guide.body}</p>
            </div>
            {guide.urgent && (
              <span className="urgent-label">Do this first</span>
            )}
          </div>
        ))}
      </div>

      <div className="next-action">
        <div>
          <span className="eyebrow">{en.guidance.nextActionEyebrow}</span>
          <strong>{en.guidance.nextActionTitle}</strong>
          <p>{en.guidance.nextActionDesc}</p>
        </div>
        <div className="action-buttons">
          <button type="button" className="secondary-button" onClick={onBack}>
            {en.common.back}
          </button>
          <button type="button" className="primary-button" onClick={onContinue}>
            {en.guidance.continueButton} <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
