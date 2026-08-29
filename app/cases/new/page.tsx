"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { PublicNav } from "../../components/PublicNav";
import { PublicFooter } from "../../components/PublicFooter";
import type { Urgency } from "@/lib/types";

export default function NewCasePage() {
  const { user, isLoading, authFetch } = useAuth();
  const { t } = useI18n();

  const incidentCategories = [
    t.entry.contextChips[0],
    t.entry.contextChips[1],
    t.entry.contextChips[2],
    t.entry.contextChips[3],
    t.entry.contextChips[4],
    t.entry.contextChips[5],
    t.intake.categories[5].label,
  ];

  const [incidentType, setIncidentType] = useState(incidentCategories[0]);
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<Urgency>("high");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  if (!isLoading && !user) {
    router.push("/login");
    return null;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (description.trim().length < 10) {
      setError(t.newCase.validationDesc);
      return;
    }

    setBusy(true);
    setError("");

    try {
      const response = await authFetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentType,
          description: description.trim(),
          urgency,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to create case");

      if (data.case?.id) {
        router.push(`/cases/${data.case.id}`);
      } else {
        router.push("/cases");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create case workspace.");
      setBusy(false);
    }
  }

  return (
    <div className="workspace-page">
      <PublicNav />

      <main id="main-content" className="workspace-main" style={{ maxWidth: "720px" }}>
        <div style={{ marginBottom: "24px" }}>
          <Link href="/cases" style={{ color: "var(--muted)", fontSize: "0.85rem", textDecoration: "none" }}>
            ← {t.nav.myCases}
          </Link>
          <h1 style={{ fontSize: "1.75rem", margin: "12px 0 6px", color: "var(--ink)" }}>
            {t.newCase.title}
          </h1>
          <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.95rem" }}>
            {t.newCase.subtitle}
          </p>
        </div>

        <div className="card" style={{ padding: "32px", border: "1px solid var(--line)" }}>
          {error && (
            <div className="error-box" role="alert" style={{ marginBottom: "20px" }}>
              <strong>{t.common.accessDenied}</strong>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCreate} className="flex-col gap-md">
            <div>
              <label htmlFor="case-category" className="form-label">
                {t.newCase.incidentCategoryLabel}
              </label>
              <select
                id="case-category"
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value)}
                className="form-input"
              >
                {incidentCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="case-description" className="form-label">
                {t.newCase.descriptionLabel}
              </label>
              <textarea
                id="case-description"
                rows={5}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.newCase.descriptionPlaceholder}
                className="form-input"
              />
              <small style={{ color: "var(--muted)", display: "block", marginTop: "4px" }}>
                {t.intake.safetyReminder}
              </small>
            </div>

            <div>
              <label htmlFor="case-urgency" className="form-label">
                {t.cases.tableUrgency}
              </label>
              <select
                id="case-urgency"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as Urgency)}
                className="form-input"
              >
                <option value="high">High — {t.understanding.actSoon}</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="unknown">{t.understanding.notEnoughInfo}</option>
              </select>
            </div>

            <div className="flex-end gap-sm mt-sm">
              <Link href="/cases" className="secondary-button" style={{ padding: "10px 16px" }}>
                {t.newCase.cancelBtn}
              </Link>
              <button
                type="submit"
                disabled={busy}
                className="primary-button"
                id="submit-create-case-btn"
                style={{ padding: "10px 20px" }}
              >
                {busy ? t.newCase.creatingBtn : `${t.newCase.createBtn} →`}
              </button>
            </div>
          </form>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

