"use client";

import React from "react";
import type { JourneyStep } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import { LanguageSelector } from "./LanguageSelector";

export interface IncidentWorkspaceHeaderProps {
  currentStep: JourneyStep;
  onExit: () => void;
}

export function IncidentWorkspaceHeader({
  currentStep,
  onExit,
}: IncidentWorkspaceHeaderProps) {
  const { t } = useI18n();

  const stepMeta = t.journey.steps.find((s) => s.id === currentStep);
  const currentStepName = stepMeta ? `${stepMeta.number} ${stepMeta.label}` : t.workspace.badge;

  return (
    <header className="workspace-topbar">
      <div className="workspace-header-left">
        <button
          type="button"
          className="brand"
          onClick={onExit}
          aria-label={t.notFound.returnHome}
        >
          <span className="brand-mark" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/cyberdesk-logo.png" alt="" width={32} height={32} className="brand-logo-img" />
          </span>
          <span className="brand-text">
            <strong>CyberDesk</strong>
            <small>{t.workspace.badge}</small>
          </span>
        </button>
        <span className="workspace-divider" aria-hidden="true">/</span>
        <div className="workspace-step-tag">
          <span className="workspace-step-name">{currentStepName}</span>
          <span className="workspace-case-id font-mono">CYB-DEMO-84A21</span>
        </div>
      </div>

      <div className="workspace-header-right">
        <LanguageSelector />
        <button
          type="button"
          className="secondary-button save-exit-btn"
          onClick={onExit}
          aria-label={`${t.common.save} & ${t.common.close}`}
        >
          <span>{t.common.save} &amp; {t.common.close}</span>
        </button>
      </div>
    </header>
  );
}

