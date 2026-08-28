"use client";

import { useState } from "react";
import { en } from "@/lib/i18n/en";
import type { CandidateField } from "@/lib/types";
import { SourceBadge } from "./SourceBadge";

export interface EvidenceCardProps {
  field: CandidateField;
  onSave: (field: CandidateField, newValue: string) => void;
  onAccept: (field: CandidateField) => void;
  onRemove: (field: CandidateField) => void;
  onRestore: (field: CandidateField) => void;
}

export function EvidenceCard({ field, onSave, onAccept, onRemove, onRestore }: EvidenceCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(field.value);

  function handleStartEdit() {
    setDraftValue(field.value);
    setIsEditing(true);
  }

  function handleSave() {
    onSave(field, draftValue);
    setIsEditing(false);
  }

  function handleCancel() {
    setDraftValue(field.value);
    setIsEditing(false);
  }

  const hint =
    en.evidence.hints[field.label as keyof typeof en.evidence.hints] ??
    en.evidence.hints.default;

  if (field.verificationStatus === "rejected") {
    return (
      <div className="evidence-field-card evidence-field-rejected">
        <div>
          <span className="evidence-field-label">{field.label}</span>
          <p>This suggestion was removed from the incident record.</p>
        </div>
        <button type="button" className="inline-button" onClick={() => onRestore(field)}>
          Restore
        </button>
      </div>
    );
  }

  const isConfirmed = field.verificationStatus === "confirmed";

  return (
    <div className={`evidence-field-card ${isConfirmed ? "card-verified evidence-field-confirmed" : "card-ai"}`}>
      <div className="evidence-field-top">
        <div className="evidence-field-label-row">
          <span className="evidence-field-label">{field.label}</span>
          <SourceBadge source={isConfirmed ? "citizen" : field.source} />
          {isConfirmed && (
            <span className="status-chip status-chip-confirmed" style={{ fontSize: "0.72rem", padding: "2px 8px" }}>
              ✓ Confirmed
            </span>
          )}
        </div>
        <div className="evidence-field-controls">
          {isEditing ? (
            <>
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
            </>
          ) : (
            <>
              {!isConfirmed && (
                <button
                  type="button"
                  className="inline-button inline-button-confirm"
                  onClick={() => onAccept(field)}
                >
                  Accept
                </button>
              )}
              <button
                type="button"
                className="inline-button"
                onClick={handleStartEdit}
              >
                {en.common.edit}
              </button>
              <button
                type="button"
                className="inline-button"
                onClick={() => onRemove(field)}
              >
                {en.common.remove}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="evidence-field-value">
        {isEditing ? (
          <input
            aria-label={`Edit ${field.label}`}
            value={draftValue}
            onChange={(e) => setDraftValue(e.target.value)}
          />
        ) : (
          <strong>{field.value}</strong>
        )}
      </div>

      <div className="evidence-field-hint">
        <span aria-hidden="true">ℹ</span>
        <span>{isConfirmed ? "You confirmed this detail." : `What this may help confirm: ${hint}`}</span>
      </div>
    </div>
  );
}
