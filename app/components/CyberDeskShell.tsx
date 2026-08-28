"use client";

import React from "react";
import type { EvidenceItem, Interpretation, JourneyStep } from "@/lib/types";
import { en } from "@/lib/i18n/en";
import { PublicNav } from "./PublicNav";
import { PublicFooter } from "./PublicFooter";
import { IncidentWorkspaceHeader } from "./IncidentWorkspaceHeader";
import { JourneySidebar } from "./JourneySidebar";
import { IncidentDossierHUD } from "./IncidentDossierHUD";

export interface CyberDeskShellProps {
  currentStep: JourneyStep;
  completedSteps: Set<JourneyStep>;
  interpretation?: Interpretation | null;
  evidence?: EvidenceItem | null;
  onNavigate: (step: JourneyStep) => void;
  onStartIncident?: () => void;
  children: React.ReactNode;
}

export function CyberDeskShell({
  currentStep,
  completedSteps,
  interpretation = null,
  evidence = null,
  onNavigate,
  onStartIncident,
  children,
}: CyberDeskShellProps) {
  const steps = en.journey.steps;
  const activeIndex = Math.max(0, steps.findIndex((item) => item.id === currentStep));
  const isEntry = currentStep === "entry";

  return (
    <div className="app-shell">
      {isEntry ? (
        <PublicNav onStartIncident={onStartIncident || (() => onNavigate("intake"))} />
      ) : (
        <IncidentWorkspaceHeader
          currentStep={currentStep}
          onExit={() => onNavigate("entry")}
        />
      )}

      {!isEntry && (
        <div className="mobile-progress" aria-label="Step progress">
          <span
            style={{ width: `${((activeIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      )}

      <div className={`workspace ${isEntry ? "workspace-entry" : ""}`}>
        {!isEntry && (
          <JourneySidebar
            currentStep={currentStep}
            completedSteps={completedSteps}
            onNavigate={onNavigate}
          />
        )}

        <main id="main-content" className={`content ${isEntry ? "content-entry" : ""}`}>
          {!isEntry && (
            <div className="content-kicker">
              <span className="step-dot" />
              <span>
                {en.common.stepOf} {String(activeIndex + 1).padStart(2, "0")} {en.common.of} {steps.length}
              </span>
              <span className="kicker-line" />
            </div>
          )}

          {!isEntry && (
            <IncidentDossierHUD
              currentStep={currentStep}
              interpretation={interpretation}
              evidence={evidence}
              onNavigate={onNavigate}
            />
          )}

          {children}
        </main>
      </div>

      <PublicFooter />
    </div>
  );
}
