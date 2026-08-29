"use client";

import { useI18n } from "@/lib/i18n";

export interface SafetyNoticeProps {
  showBoundary?: boolean;
  className?: string;
}

export function SafetyNotice({ showBoundary = true, className = "" }: SafetyNoticeProps) {
  const { t } = useI18n();

  return (
    <div className={`safety-notice-banner ${className}`} role="note">
      <div className="safety-notice-header">
        <span className="safety-icon" aria-hidden="true">🛡️</span>
        <div className="safety-notice-title-group">
          <strong>{t.guidance.safetyNoticeTitle}</strong>
          <div className="safety-actions-row">
            <a
              href="tel:1930"
              className="safety-helpline-link"
              aria-label="Call National Cyber Crime Helpline 1930"
            >
              <span className="phone-icon" aria-hidden="true">📞</span>
              <strong>1930</strong>
              <small>{t.guidance.safetyNoticeHelpline}</small>
            </a>
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="safety-portal-link"
              aria-label="Visit official National Cyber Crime Reporting Portal cybercrime.gov.in"
            >
              <span>{t.guidance.safetyNoticePortal}</span>
              <span className="ext-icon" aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </div>
      {showBoundary && (
        <p className="safety-boundary-text">
          {t.guidance.safetyNoticeBoundary}
        </p>
      )}
    </div>
  );
}

