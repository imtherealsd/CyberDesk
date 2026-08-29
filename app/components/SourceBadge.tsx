"use client";

import React from "react";
import { useI18n } from "@/lib/i18n";

export type SourceType = "citizen" | "synthetic" | "ai" | "system";

export interface SourceBadgeProps {
  source: SourceType | string;
  className?: string;
  showIcon?: boolean;
}

export function SourceBadge({ source, className = "", showIcon = true }: SourceBadgeProps) {
  const { t } = useI18n();

  let label = t.evidence.provenanceCitizen;
  let variantClass = "badge-citizen";
  let icon = "✓";

  const lower = source.toLowerCase();

  if (lower.includes("evidence-derived")) {
    label = lower.includes("demo") ? `${t.evidence.fieldSourceBadge} · demo` : t.evidence.fieldSourceBadge;
    variantClass = "badge-citizen";
    icon = "↗";
  } else if (
    source === "citizen" ||
    lower.includes("citizen") ||
    lower.includes("you reported") ||
    lower.includes("you provided")
  ) {
    label = t.timeline.legendCitizen;
    variantClass = "badge-citizen";
    icon = "✓";
  } else if (
    source === "synthetic" ||
    lower.includes("synthetic") ||
    lower.includes("demo")
  ) {
    label = t.timeline.legendSynthetic;
    variantClass = "badge-synthetic";
    icon = "⚡";
  } else if (
    source === "ai" ||
    lower.includes("ai") ||
    lower.includes("openai") ||
    lower.includes("suggested")
  ) {
    label = t.timeline.legendAi;
    variantClass = "badge-ai";
    icon = "✦";
  } else if (
    source === "system" ||
    lower.includes("cyberdesk") ||
    lower.includes("system")
  ) {
    label = "CyberDesk";
    variantClass = "badge-system";
    icon = "🛡";
  } else {
    label = source;
    variantClass = "badge-neutral";
    icon = "•";
  }

  return (
    <span className={`tl-badge ${variantClass} ${className}`}>
      {showIcon && <span className="badge-icon" aria-hidden="true">{icon}</span>}
      <span className="badge-text">{label}</span>
    </span>
  );
}

