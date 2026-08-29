"use client";

import { useState } from "react";
import type { TimelineEvent as TimelineEventType } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
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
  const { t } = useI18n();

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
        <span className="timeline-time font-mono">{event.time}</span>
        <small className="timeline-time-label">
          {event.timeLabel || "IST"}
        </small>
        {event.timePrecision && (
          <span className={`timeline-precision-badge ${event.timePrecision}`}>
            {event.timePrecision === "exact"
              ? `✓ ${t.evidence.statusVerified}`
              : event.timePrecision === "approximate"
              ? "≈ Approx"
              : event.timePrecision === "date"
              ? "📅 Date"
              : t.understanding.notEnoughInfo}
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
              aria-label={t.common.edit}
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
              aria-label={`${t.timeline.correctButton}: ${event.title}`}
            >
              {t.timeline.correctButton}
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
              aria-label={t.common.edit}
            />
            <div className="timeline-edit-actions">
              <button
                type="button"
                className="inline-button"
                onClick={handleSave}
              >
                {t.common.save}
              </button>
              <button
                type="button"
                className="inline-button"
                onClick={handleCancel}
              >
                {t.common.cancel}
              </button>
            </div>
          </>
        ) : (
          <p>{event.detail}</p>
        )}
      </div>
    </div>
  );
}

