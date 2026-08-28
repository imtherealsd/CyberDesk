"use client";

import { useState } from "react";
import type { TimelineEvent as TimelineEventType } from "@/lib/types";
import { en } from "@/lib/i18n/en";
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

  function handleSaveEvent(index: number, newTitle: string, newDetail: string) {
    setLocalEvents((current) =>
      current.map((event, i) =>
        i === index ? { ...event, title: newTitle, detail: newDetail } : event
      )
    );
  }

  return (
    <div className="step-panel timeline-panel">
      <p className="lead">{en.timeline.lead}</p>

      <div className="timeline-legend">
        <span className="tl-legend-item">
          <span className="tl-badge badge-citizen">{en.timeline.legendCitizen}</span>
          {en.timeline.legendCitizenDesc}
        </span>
        <span className="tl-legend-item">
          <span className="tl-badge badge-synthetic">{en.timeline.legendSynthetic}</span>
          {en.timeline.legendSyntheticDesc}
        </span>
        <span className="tl-legend-item">
          <span className="tl-badge badge-ai">{en.timeline.legendAi}</span>
          {en.timeline.legendAiDesc}
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
          <span className="eyebrow">{en.timeline.nextActionEyebrow}</span>
          <strong>{en.timeline.nextActionTitle}</strong>
          <p>{en.timeline.nextActionDesc}</p>
        </div>
        <div className="action-buttons">
          <button type="button" className="secondary-button" onClick={onBack}>
            {en.common.back}
          </button>
          <button type="button" className="primary-button" onClick={onContinue}>
            {en.timeline.continueButton} <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
