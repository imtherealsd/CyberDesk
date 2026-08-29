"use client";

import { useState } from "react";
import type { TimelineEvent as TimelineEventType } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import { TimelineEvent } from "./TimelineEvent";

export interface TimelineScreenProps {
  events: TimelineEventType[];
  onBack: () => void;
  onContinue: () => void;
}

export function TimelineScreen({
  events,
  onBack,
  onContinue,
}: TimelineScreenProps) {
  const [localEvents, setLocalEvents] = useState<TimelineEventType[]>(events);
  const { t } = useI18n();

  function handleSaveEvent(index: number, newTitle: string, newDetail: string) {
    setLocalEvents((current) =>
      current.map((event, i) =>
        i === index ? { ...event, title: newTitle, detail: newDetail } : event
      )
    );
  }

  return (
    <div className="step-panel timeline-panel">
      <p className="lead">{t.timeline.lead}</p>

      <div className="timeline-legend">
        <span className="tl-legend-item">
          <span className="tl-badge badge-citizen">{t.timeline.legendCitizen}</span>
          {t.timeline.legendCitizenDesc}
        </span>
        <span className="tl-legend-item">
          <span className="tl-badge badge-synthetic">{t.timeline.legendSynthetic}</span>
          {t.timeline.legendSyntheticDesc}
        </span>
        <span className="tl-legend-item">
          <span className="tl-badge badge-ai">{t.timeline.legendAi}</span>
          {t.timeline.legendAiDesc}
        </span>
      </div>

      <div className="timeline" aria-label="Incident timeline">
        {localEvents.map((event, index) => (
          <TimelineEvent
            key={index}
            event={event}
            index={index}
            isLast={index === localEvents.length - 1}
            onSave={handleSaveEvent}
          />
        ))}
      </div>

      <div className="next-action">
        <div>
          <span className="eyebrow">{t.timeline.nextActionEyebrow}</span>
          <strong>{t.timeline.nextActionTitle}</strong>
          <p>{t.timeline.nextActionDesc}</p>
        </div>
        <div className="action-buttons">
          <button type="button" className="secondary-button" onClick={onBack}>
            {t.common.back}
          </button>
          <button type="button" className="primary-button" onClick={onContinue}>
            {t.timeline.continueButton} <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

