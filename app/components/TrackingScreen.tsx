"use client";

import type { DemoCase, StatusExplanation } from "@/lib/types";
import { CASE_STATUS_LABELS, statusProgress } from "@/lib/case-status";
import { useI18n } from "@/lib/i18n";

export interface TrackingScreenProps {
  caseInfo: DemoCase | null;
  explanation: StatusExplanation | null;
  onBack: () => void;
  onExplain: () => void;
  busy: boolean;
}

export function TrackingScreen({
  caseInfo,
  explanation,
  onBack,
  onExplain,
  busy,
}: TrackingScreenProps) {
  const { t } = useI18n();
  const currentStatus = caseInfo?.status ?? "under_review";
  const label = CASE_STATUS_LABELS[currentStatus];
  const progress = statusProgress(currentStatus);

  return (
    <div className="step-panel tracking-panel">
      <div className="system-fact">
        <div>
          <span className="eyebrow">{t.tracking.systemFactEyebrow}</span>
          <h2>{label}</h2>
          <p>{t.tracking.lastUpdated}</p>
        </div>
        <span className="status-chip font-mono">{caseInfo?.caseId ?? "CYB-DEMO-84A21"}</span>
      </div>

      <div className="status-timeline" aria-label="Status timeline">
        {progress.map((item) => (
          <StatusRow
            key={item.status}
            label={item.label}
            detail={item.detail}
            done={item.done}
            active={item.active}
          />
        ))}
      </div>

      <div className="next-action status-next-action">
        <div>
          <span className="eyebrow">{t.tracking.nextInPrototypeEyebrow}</span>
          <strong>
            {currentStatus === "under_review"
              ? t.tracking.nextInPrototypeUnderReview
              : currentStatus === "draft"
              ? t.tracking.nextInPrototypeDraft
              : t.tracking.nextInPrototypeGeneral}
          </strong>
          <p>{t.tracking.nextInPrototypeSubtext}</p>
        </div>
      </div>

      <div className="explain-card">
        <div className="explain-heading">
          <span className="spark" aria-hidden="true">✦</span>
          <div>
            <span className="eyebrow">
              {explanation?.source === "demo_fallback"
                ? t.tracking.explainDemoEyebrow
                : t.tracking.explainAiEyebrow}
            </span>
            <h3>{t.tracking.explainHeadingTitle.replace("{status}", label)}</h3>
          </div>
        </div>

        {explanation ? (
          <>
            <p className="explanation-source">
              {explanation.source === "gemini" || explanation.source === "openai"
                ? t.tracking.explainAiEyebrow
                : t.tracking.explainFallbackTag}
            </p>
            <div className="explanation-grid">
              <div>
                <span>{t.tracking.plainLanguageLabel}</span>
                <p>{explanation.meaning}</p>
              </div>
              <div>
                <span>{t.tracking.whatHappensNextLabel}</span>
                <p>{explanation.next_expected_step}</p>
              </div>
              <div>
                <span>{t.tracking.limitationsLabel}</span>
                <p>{explanation.limitations}</p>
              </div>
            </div>
            <button
              type="button"
              className="secondary-button retry-button"
              onClick={onExplain}
              disabled={busy}
            >
              {busy ? (
                <>
                  <span className="spinner" /> {t.tracking.retryingButton}
                </>
              ) : (
                <>
                  {t.tracking.retryButton} <span aria-hidden="true">↻</span>
                </>
              )}
            </button>
          </>
        ) : (
          <>
            <p className="explain-prompt">
              {t.tracking.explainPrompt}
            </p>
            <button
              type="button"
              className="primary-button"
              onClick={onExplain}
              disabled={busy}
            >
              {busy ? (
                <>
                  <span className="spinner" /> {t.tracking.explainingButton}
                </>
              ) : (
                <>
                  {t.tracking.explainButton} <span aria-hidden="true">→</span>
                </>
              )}
            </button>
          </>
        )}
      </div>

      <div className="form-actions">
        <button type="button" className="secondary-button" onClick={onBack}>
          {t.tracking.backButton}
        </button>
      </div>

      <div className="tracking-disclosure">
        {t.tracking.disclosure}
      </div>
    </div>
  );
}

interface StatusRowProps {
  label: string;
  detail: string;
  done?: boolean;
  active?: boolean;
}

function StatusRow({ label, detail, done = false, active = false }: StatusRowProps) {
  return (
    <div className={`status-row ${done ? "done" : ""} ${active ? "active" : ""}`}>
      <span className="status-icon">{done ? "✓" : "·"}</span>
      <div className="status-row-content">
        <strong>{label}</strong>
        <span>{detail}</span>
      </div>
      {active && <small className="status-badge-current">Current</small>}
    </div>
  );
}

