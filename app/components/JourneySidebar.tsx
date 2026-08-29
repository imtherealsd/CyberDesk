"use client";

import type { JourneyStep } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

export interface JourneySidebarProps {
  currentStep: JourneyStep;
  completedSteps: Set<JourneyStep>;
  onNavigate: (step: JourneyStep) => void;
}

export function JourneySidebar({
  currentStep,
  completedSteps,
  onNavigate,
}: JourneySidebarProps) {
  const { t } = useI18n();
  const steps = t.journey.steps;
  const activeIndex = Math.max(0, steps.findIndex((item) => item.id === currentStep));

  return (
    <aside className="journey-nav" aria-label="Journey progress">
      <p className="eyebrow">{t.common.stepOf}</p>
      <div className="journey-list">
        {steps.map((item, index) => {
          const stepId = item.id as JourneyStep;
          const isEnabled = completedSteps.has(stepId) || stepId === currentStep;
          const isActive = index === activeIndex;
          const isComplete = index < activeIndex || (completedSteps.has(stepId) && !isActive);

          return (
            <button
              key={item.id}
              className={`journey-item ${isActive ? "active" : ""} ${isComplete ? "complete" : ""}`}
              onClick={() => onNavigate(stepId)}
              disabled={!isEnabled}
              aria-current={isActive ? "step" : undefined}
            >
              <span className="journey-number">
                {isComplete && !isActive ? "✓" : item.number}
              </span>
              <span className="journey-label">{item.label}</span>
            </button>
          );
        })}
      </div>
      <div className="nav-note">
        <span className="mini-shield" aria-hidden="true">✓</span>
        <p>
          <strong>{t.common.privateByDesign}</strong>
          <br />
          {t.common.privateByDesignDesc}
        </p>
      </div>
    </aside>
  );
}

