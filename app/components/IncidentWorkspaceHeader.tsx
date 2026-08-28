"use client";

import React from "react";
import type { JourneyStep } from "@/lib/types";
import { LanguageSelector } from "./LanguageSelector";

export interface IncidentWorkspaceHeaderProps {
  currentStep: JourneyStep;
  onExit: () => void;
}

export function IncidentWorkspaceHeader({
  currentStep,
  onExit,
}: IncidentWorkspaceHeaderProps) {
  const stepTitles: Record<JourneyStep, string> = {
    entry: "Home",
    intake: "01 Describe",
    understanding: "02 Understand",
    guidance: "03 Next steps",
    evidence: "04 Evidence",
    timeline: "05 Timeline",
    report: "06 Review",
    submitted: "07 Prepare",
    tracking: "08 Track",
  };

  return (
    <header className="workspace-topbar">
      <div className="workspace-header-left">
        <button
          type="button"
          className="brand"
          onClick={onExit}
          aria-label="Return to CyberDesk home"
        >
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="brand-text">
            <strong>CyberDesk</strong>
            <small>Incident Workspace</small>
          </span>
        </button>
        <span className="workspace-divider" aria-hidden="true">/</span>
        <div className="workspace-step-tag">
          <span className="workspace-step-name">{stepTitles[currentStep] || "Workspace"}</span>
          <span className="workspace-case-id">CYB-DEMO-84A21</span>
        </div>
      </div>

      <div className="workspace-header-right">
        <LanguageSelector />
        <button
          type="button"
          className="secondary-button save-exit-btn"
          onClick={onExit}
          aria-label="Save and exit to homepage"
        >
          <span>Save & exit</span>
        </button>
      </div>
    </header>
  );
}
