"use client";

import { useState } from "react";
import type { TimelineEvent as TimelineEventType } from "@/lib/types";
import { en } from "@/lib/i18n/en";
import { SourceBadge } from "./SourceBadge";

export interface TimelineEventProps {
  event: TimelineEventType;
  index: number;
  isLast: boolean;
  onSave: (index: number, newTitle: string, newDetail: string) => void;
}

export function TimelineEvent({
  event,
  index,
  isLast,
  onSave,
}: TimelineEventProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(event.title);
  const [draftDetail, setDraftDetail] = useState(event.detail);

  function handleStartEdit() {
    setDraftTitle(event.title);
    setDraftDetail(event.detail);
    setIsEditing(true);
  }

  function handleSave() {
    onSave(index, draftTitle, draftDetail);
    setIsEditing(false);
  }

  function handleCancel() {
    setDraftTitle(event.title);
    setDraftDetail(event.detail);
    setIsEditing(false);
  }

  return (
    <div className="timeline-row">
      <div className="timeline-time-col">
        <span className="timeline-time">{event.time}</span>
        <small className="timeline-time-label">
          {event.timeLabel || "IST"}
        </small>
        {event.timePrecision && (
          <span className={`timeline-precision-badge ${event.timePrecision}`}>
            {event.timePrecision === "exact"
              ? "✓ Exact"
              : event.timePrecision === "approximate"
              ? "≈ Approx"
              : event.timePrecision === "date"
              ? "📅 Date only"
              : "Unknown"}
          </span>
        )}
      </div>

      <span className="timeline-marker">
        <i />
        {!isLast && <b />}
      </span>

      <div className="timeline-content">
        <div className="timeline-content-header">
          {isEditing ? (
            <input
              className="timeline-edit-input"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              aria-label="Edit event title"
            />
          ) : (
            <strong>{event.title}</strong>
          )}

          <SourceBadge source={event.source} />

          {!isEditing && (
            <button
              type="button"
              className="timeline-edit-btn"
              onClick={handleStartEdit}
              aria-label={`Correct: ${event.title}`}
            >
              {en.timeline.correctButton}
            </button>
          )}
        </div>

        {isEditing ? (
          <>
            <textarea
              className="timeline-edit-textarea"
              value={draftDetail}
              onChange={(e) => setDraftDetail(e.target.value)}
              rows={2}
              aria-label="Edit event detail"
            />
            <div className="timeline-edit-actions">
              <button
                type="button"
                className="inline-button"
                onClick={handleSave}
              >
                {en.common.save}
              </button>
              <button
                type="button"
                className="inline-button"
                onClick={handleCancel}
              >
                {en.common.cancel}
              </button>
            </div>
          </>
        ) : (
          <p>{event.detail}</p>
        )}

        {!isEditing && (
          <small className="source-label">{event.source}</small>
        )}
      </div>
    </div>
  );
}
