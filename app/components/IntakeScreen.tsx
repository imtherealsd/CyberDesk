"use client";

import { useState } from "react";
import { en } from "@/lib/i18n/en";

export interface IntakeScreenProps {
  description: string;
  setDescription: (value: string) => void;
  onSubmit: () => void;
  onSeed: () => void;
  onContinue: () => void;
  hasInterpretation: boolean;
  onBack: () => void;
  busy: boolean;
}

export function IntakeScreen({
  description,
  setDescription,
  onSubmit,
  onSeed,
  onContinue,
  hasInterpretation,
  onBack,
  busy,
}: IntakeScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  function handleSelectCategory(cat: typeof en.intake.categories[0]) {
    setSelectedCategory(cat.id);
    if (!description.trim() && cat.prompt) {
      setDescription(cat.prompt);
    }
  }

  return (
    <div className="step-panel intake-panel">
      <p className="lead">{en.intake.lead}</p>

      <div className="category-selection-section">
        <span className="eyebrow">{en.intake.categoriesEyebrow}</span>
        <div className="category-chips-grid" role="group" aria-label="Incident categories">
          {en.intake.categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                type="button"
                key={cat.id}
                className={`category-card-btn ${isSelected ? "selected" : ""}`}
                onClick={() => handleSelectCategory(cat)}
              >
                <strong className="category-title">{cat.label}</strong>
                <span className="category-subtitle">{cat.detail}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="form-group-narrative">
        <label htmlFor="incident">{en.intake.label}</label>
        <textarea
          id="incident"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder={en.intake.placeholder}
          rows={7}
          maxLength={3000}
        />
        <div className="field-meta">
          <span>{en.intake.safetyReminder}</span>
          <span>{description.length}/{en.intake.charLimit}</span>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="secondary-button" onClick={onBack}>
          {en.common.back}
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={hasInterpretation ? onContinue : onSubmit}
          disabled={busy}
        >
          {busy ? (
            <>
              <span className="spinner" /> {en.intake.submittingButton}
            </>
          ) : hasInterpretation ? (
            <>
              {en.intake.continueButton} <span aria-hidden="true">→</span>
            </>
          ) : (
            <>
              {en.intake.submitButton} <span aria-hidden="true">→</span>
            </>
          )}
        </button>
      </div>

      <button type="button" className="quiet-button" onClick={onSeed}>
        {en.intake.seedButton}
      </button>
    </div>
  );
}
