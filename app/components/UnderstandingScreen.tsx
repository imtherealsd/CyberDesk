"use client";

import { useState } from "react";
import type { Interpretation, Urgency } from "@/lib/types";
import { en } from "@/lib/i18n/en";

export type InterpretationSource = "openai" | "demo_fallback";

export interface UnderstandingScreenProps {
  interpretation: Interpretation;
  source: InterpretationSource;
  onSave: (value: Interpretation) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export function UnderstandingScreen({
  interpretation,
  source,
  onSave,
  onConfirm,
  onBack,
}: UnderstandingScreenProps) {
  const [draft, setDraft] = useState<Interpretation>(interpretation);
  const [editing, setEditing] = useState(false);

  const update = (field: keyof Interpretation, value: string | number | null) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  function handleSaveCorrections() {
    onSave(draft);
    setEditing(false);
  }

  function handleCancel() {
    setDraft(interpretation);
    setEditing(false);
  }

  const isAi = source === "openai";

  return (
    <div className="step-panel understanding-panel">
      <div className="ai-ribbon">
        <span className="spark" aria-hidden="true">✦</span>
        <div>
          <strong>
            {isAi ? en.understanding.aiRibbonTitle : en.understanding.demoRibbonTitle}
          </strong>
          <small>
            {isAi ? en.understanding.aiRibbonSubtitle : en.understanding.demoRibbonSubtitle}
          </small>
        </div>
      </div>

      <div className="understanding-grid">
        <InfoCard
          label={en.understanding.cardLooksLike}
          value={draft.incident_type ?? en.understanding.notEnoughInfo}
          editing={editing}
          inputValue={draft.incident_type ?? ""}
          onInput={(val) => update("incident_type", val || null)}
        />
        <InfoCard
          label={en.understanding.cardPossibleMethod}
          value={draft.possible_method ?? en.understanding.notEnoughInfo}
          editing={editing}
          inputValue={draft.possible_method ?? ""}
          onInput={(val) => update("possible_method", val || null)}
        />
        <InfoCard
          label={en.understanding.cardFinancialImpact}
          value={
            draft.amount
              ? `₹${draft.amount.toLocaleString("en-IN")} mentioned`
              : en.understanding.notMentioned
          }
          editing={editing}
          inputValue={draft.amount?.toString() ?? ""}
          inputType="number"
          onInput={(val) => update("amount", val ? Number(val) : null)}
        />
        <InfoCard
          label={en.understanding.cardUrgency}
          value={draft.urgency === "high" ? en.understanding.actSoon : draft.urgency}
          accent={draft.urgency === "high"}
          editing={editing}
          selectValue={draft.urgency}
          onSelect={(val) => update("urgency", val as Urgency)}
        />
      </div>

      <div className="split-block">
        <div>
          <span className="eyebrow">{en.understanding.mentionedEyebrow}</span>
          <ul className="compact-list">
            {draft.mentioned_evidence.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <span className="eyebrow">{en.understanding.unclearEyebrow}</span>
          <ul className="compact-list muted-list">
            {[...draft.missing_information, ...draft.uncertainties].map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="correction-bar">
        <div>
          <strong>
            {editing
              ? en.understanding.editBarTitleEditing
              : en.understanding.editBarTitleNormal}
          </strong>
          <span>
            {editing
              ? en.understanding.editBarDescEditing
              : en.understanding.editBarDescNormal}
          </span>
        </div>
        <div className="action-buttons">
          {editing ? (
            <>
              <button
                type="button"
                className="secondary-button"
                onClick={handleCancel}
              >
                {en.common.cancel}
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleSaveCorrections}
              >
                {en.understanding.saveCorrectionsButton}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="secondary-button"
                onClick={onBack}
              >
                {en.common.back}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setEditing(true)}
              >
                {en.understanding.editDetailsButton}
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={onConfirm}
              >
                {en.understanding.confirmButton} <span aria-hidden="true">→</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface InfoCardProps {
  label: string;
  value: string;
  accent?: boolean;
  editing?: boolean;
  inputValue?: string;
  inputType?: "text" | "number";
  onInput?: (val: string) => void;
  selectValue?: Urgency;
  onSelect?: (val: string) => void;
}

function InfoCard({
  label,
  value,
  accent = false,
  editing = false,
  inputValue = "",
  inputType = "text",
  onInput,
  selectValue,
  onSelect,
}: InfoCardProps) {
  return (
    <div className={`info-card ${accent ? "accent" : ""}`}>
      <span>{label}</span>
      {editing && onSelect ? (
        <select
          aria-label={`Edit ${label}`}
          value={selectValue}
          onChange={(event) => onSelect(event.target.value)}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">Act soon</option>
          <option value="unknown">Unknown</option>
        </select>
      ) : editing && onInput ? (
        <input
          aria-label={`Edit ${label}`}
          type={inputType}
          value={inputValue}
          onChange={(event) => onInput(event.target.value)}
        />
      ) : (
        <strong>{value}</strong>
      )}
    </div>
  );
}
