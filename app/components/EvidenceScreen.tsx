"use client";

import { useRef, useState } from "react";
import type { CandidateField, EvidenceCategory, EvidenceItem } from "@/lib/types";
import { EVIDENCE_CATEGORIES, getCategoryLabel, isSupportedEvidenceFile, MAX_EVIDENCE_BYTES } from "@/lib/evidence";
import { en } from "@/lib/i18n/en";
import { EvidenceCard } from "./EvidenceCard";
import { SourceBadge } from "./SourceBadge";

// Icon map for category cards
const CATEGORY_ICONS: Record<EvidenceCategory, string> = {
  transaction: "💸",
  bank_communication: "🏦",
  sms: "📱",
  whatsapp_message: "💬",
  email: "📧",
  screenshot: "🖼",
  link: "🔗",
  caller_contact: "📞",
  other: "📁",
};

export interface EvidenceScreenProps {
  evidence: EvidenceItem | null;
  onAdd: () => void;
  onChange: (value: EvidenceItem | null) => void;
  onUploadFile: (file: File, category: EvidenceCategory) => Promise<void>;
  busy: "upload" | "extract" | "verify" | null;
  onBack: () => void;
  onContinue: () => void;
}

export function EvidenceScreen({
  evidence,
  onAdd,
  onChange,
  onUploadFile,
  busy,
  onBack,
  onContinue,
}: EvidenceScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<EvidenceCategory>("transaction");
  const [localError, setLocalError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  function getFieldId(field: CandidateField) {
    return field.id ?? `${field.fieldKey ?? field.label}:${field.evidenceId ?? evidence?.id ?? "evidence"}`;
  }

  function handleSaveField(field: CandidateField, newValue: string) {
    if (!evidence) return;
    const fieldId = getFieldId(field);
    const verifiedAt = new Date().toISOString();
    onChange({
      ...evidence,
      candidateFields: evidence.candidateFields.map((currentField) =>
        getFieldId(currentField) === fieldId
          ? {
            ...currentField,
            value: newValue.trim(),
            verificationStatus: "confirmed",
            provenance: currentField.provenance
              ? { ...currentField.provenance, origin: "citizen", verifiedAt }
              : undefined,
          }
          : currentField
      ),
    });
  }

  function markField(field: CandidateField, verificationStatus: "confirmed" | "rejected" | "candidate") {
    if (!evidence) return;
    const fieldId = getFieldId(field);
    const verifiedAt = new Date().toISOString();
    onChange({
      ...evidence,
      candidateFields: evidence.candidateFields.map((currentField) =>
        getFieldId(currentField) === fieldId
          ? {
            ...currentField,
            verificationStatus,
            provenance: currentField.provenance
              ? {
                ...currentField.provenance,
                origin: verificationStatus === "confirmed" ? "citizen" : currentField.provenance.origin,
                verifiedAt: verificationStatus === "confirmed" ? verifiedAt : undefined,
              }
              : undefined,
          }
          : currentField
      ),
    });
  }

  async function handleFileChange(file: File | undefined) {
    setLocalError("");
    if (!file) return;
    if (file.size > MAX_EVIDENCE_BYTES) {
      setLocalError("That file is too large. Try a file smaller than 5 MB.");
      return;
    }
    if (!isSupportedEvidenceFile(file.name, file.type)) {
      setLocalError("That file type isn't supported yet. Try a JPG, PNG, PDF or TXT file.");
      return;
    }
    await onUploadFile(file, category);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    void handleFileChange(file);
  }

  const isProcessing = busy === "upload" || busy === "extract";
  const confirmedCount = evidence?.candidateFields.filter((field) => field.verificationStatus === "confirmed").length ?? 0;

  return (
    <div className="step-panel evidence-panel">
      <p className="lead">{en.evidence.lead}</p>

      {!evidence ? (
        <>
          <div className="evidence-empty">
            <div className="evidence-empty-icon" aria-hidden="true">📄</div>
            <strong>{en.evidence.emptyTitle}</strong>
            <p>{en.evidence.emptyDesc}</p>
            <button type="button" className="evidence-add-btn" onClick={onAdd}>
              <span className="plus" aria-hidden="true">+</span>
              <span>
                <strong>{en.evidence.addSyntheticButton}</strong>
                <small>{en.evidence.addSyntheticSubtext}</small>
              </span>
              <span className="arrow" aria-hidden="true">→</span>
            </button>

          {/* Visual category grid */}
            <div className="evidence-upload-card">
              <div className="evidence-upload-heading">
                <div>
                  <strong>Upload evidence from your device</strong>
                  <p>Use a synthetic or redacted file for this prototype. PNG, JPG, PDF and TXT up to 5 MB.</p>
                </div>
                <span className="upload-lock" aria-hidden="true">▣</span>
              </div>

              <label className="field-label" style={{ marginBottom: "8px", display: "block" }}>
                What kind of evidence is this?
              </label>
              <div className="evidence-category-grid" role="group" aria-label="Evidence category selection">
                {EVIDENCE_CATEGORIES.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={`evidence-category-card ${category === item.value ? "selected" : ""}`}
                    onClick={() => setCategory(item.value as EvidenceCategory)}
                    aria-pressed={category === item.value}
                    disabled={isProcessing}
                  >
                    <span className="cat-icon" aria-hidden="true">
                      {CATEGORY_ICONS[item.value as EvidenceCategory] || "📁"}
                    </span>
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Drag and drop upload zone */}
              <div
                className={`upload-dropzone ${isDragOver ? "dragover" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                role="region"
                aria-label="Evidence upload area"
              >
                <input
                  ref={fileInputRef}
                  id="evidence-upload"
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf,.txt,image/png,image/jpeg,application/pdf,text/plain"
                  aria-label="Upload evidence file"
                  onChange={(event) => void handleFileChange(event.target.files?.[0])}
                  disabled={isProcessing}
                  style={{ position: "absolute", inset: 0, opacity: 0, cursor: isProcessing ? "not-allowed" : "pointer", width: "100%", height: "100%" }}
                />
                {isProcessing ? (
                  <div className="upload-progress-indicator">
                    <div className={`upload-progress-step ${busy === "upload" ? "active" : "done"}`}>
                      <span className={`upload-step-dot ${busy === "upload" ? "active" : "done"}`} />
                      <strong>Uploading your evidence…</strong>
                    </div>
                    {busy === "extract" && (
                      <div className="upload-progress-step active">
                        <span className="upload-step-dot active" />
                        <strong>Looking for useful details…</strong>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="upload-dropzone-icon" aria-hidden="true">☁</div>
                    <p className="upload-dropzone-title">
                      Drop a file here, or click to browse
                    </p>
                    <p className="upload-dropzone-desc">
                      PNG, JPG, PDF or TXT · Max 5 MB
                    </p>
                    <button
                      type="button"
                      className="secondary-button upload-file-button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessing}
                      style={{ marginTop: "12px", pointerEvents: "auto", position: "relative", zIndex: 2 }}
                    >
                      Choose a file
                    </button>
                  </>
                )}
              </div>

              {localError && <p className="upload-error" role="alert">{localError}</p>}
            </div>
          </div>
          <div className="form-actions step-actions">
            <button type="button" className="secondary-button" onClick={onBack}>{en.common.back}</button>
          </div>
        </>
      ) : (
        <>
          <div className="evidence-source-header">
            <span className="evidence-source-name">
              <span className="file-icon" aria-hidden="true">▤</span>
              {evidence.filename}
            </span>
            <SourceBadge source={evidence.source} />
          </div>

          <div className="evidence-file-meta">
            <span>{evidence.category ? getCategoryLabel(evidence.category) : evidence.type}</span>
            <span>{evidence.mimeType ?? "File"}</span>
            {evidence.isDemo && <span className="evidence-status evidence-status-demo">Prototype-only session</span>}
            <span className={`evidence-status evidence-status-${evidence.uploadStatus ?? "demo"}`}>
              {evidence.uploadStatus === "uploaded" ? "Private upload complete" : evidence.uploadStatus === "failed" ? "Private upload unavailable" : evidence.uploadStatus === "local_only" ? "Session only" : "Demo information"}
            </span>
          </div>

          {isProcessing && (
            <div className="evidence-processing" role="status">
              <span className="spinner" />
              <div>
                <strong>{busy === "upload" ? "Uploading your evidence…" : "Looking for useful details…"}</strong>
                <p>{busy === "upload" ? "Checking the file and preparing its metadata." : "CyberDesk is checking the file. Any details found will stay suggestions until you confirm them."}</p>
              </div>
            </div>
          )}

          {!isProcessing && evidence.extractionStatus === "fallback" && (
            <div className="evidence-fallback-note" role="status">
              <strong>AI extraction unavailable — showing the demo extraction.</strong>
              <span>{evidence.extractionNotes ?? "These details are limited suggestions and still need your confirmation."}</span>
            </div>
          )}

          {!isProcessing && evidence.extractionStatus === "failed" && (
            <div className="evidence-fallback-note evidence-fallback-error" role="status">
              <strong>We could not finish processing this file.</strong>
              <span>The file is still listed for this session. Review it yourself or continue with the synthetic demo evidence.</span>
            </div>
          )}

          {!isProcessing && evidence.candidateFields.length > 0 && (
            <div className="evidence-review-heading">
              <span className="spark" aria-hidden="true">✦</span>
              <div>
                <strong>AI found possible details.</strong>
                <span>They are suggestions only. Accept, edit or remove each one before confirming.</span>
              </div>
            </div>
          )}

          <div className="evidence-cards" aria-label="Evidence fields">
            {evidence.candidateFields.map((field) => (
              <EvidenceCard
                key={field.id ?? field.label}
                field={field}
                onSave={handleSaveField}
                onAccept={(field) => markField(field, "confirmed")}
                onRemove={(field) => markField(field, "rejected")}
                onRestore={(field) => markField(field, "candidate")}
              />
            ))}
          </div>

          {!isProcessing && evidence.candidateFields.length === 0 && (
            <div className="evidence-no-fields">
              <strong>No safe candidate details were found.</strong>
              <p>Keep the original file. You can still add this evidence to the record after reviewing it yourself.</p>
            </div>
          )}

          <div className="evidence-suggestions">
            <span className="eyebrow">{en.evidence.suggestionsEyebrow}</span>
            <div className="suggestion-chips">
              {en.evidence.suggestions.map((suggestion) => <span className="suggestion-chip" key={suggestion}>{suggestion}</span>)}
            </div>
          </div>

          <div className="evidence-foot">
            <span>{confirmedCount ? `${confirmedCount} detail${confirmedCount === 1 ? "" : "s"} confirmed by you.` : en.evidence.footNotice}</span>
            <div className="action-buttons">
              <button type="button" className="secondary-button" onClick={onBack}>{en.common.back}</button>
              <button type="button" className="primary-button" onClick={onContinue} disabled={isProcessing || busy === "verify"}>
                {busy === "verify" ? "Saving verified details…" : en.evidence.confirmVerifiedButton} <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
