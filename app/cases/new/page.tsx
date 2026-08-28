"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { PublicNav } from "../../components/PublicNav";
import { PublicFooter } from "../../components/PublicFooter";
import type { Urgency } from "@/lib/types";

const INCIDENT_CATEGORIES = [
  "Online financial fraud / unauthorized debit",
  "Bank / authority impersonation",
  "Social media account takeover / extortion",
  "Phishing message / fake KYC link",
  "Job / investment / lottery scam",
  "Cyber stalking / harassment",
  "Other cyber incident",
];

export default function NewCasePage() {
  const { user, isLoading, authFetch } = useAuth();
  const [incidentType, setIncidentType] = useState(INCIDENT_CATEGORIES[0]);
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
      setError("Please describe what happened in a few sentences (at least 10 characters).");
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
            ← Back to My Cases
          </Link>
          <h1 style={{ fontSize: "1.75rem", margin: "12px 0 6px", color: "var(--ink)" }}>
            Start a New Incident Workspace
          </h1>
          <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.95rem" }}>
            Create a private case to organize your evidence, verify details, and prepare an incident dossier.
          </p>
        </div>

        <div className="card" style={{ padding: "32px", border: "1px solid var(--line)" }}>
          {error && (
            <div className="error-box" role="alert" style={{ marginBottom: "20px" }}>
              <strong>Could not create case</strong>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label htmlFor="case-category" style={{ display: "block", fontWeight: 600, marginBottom: "8px", fontSize: "0.9rem" }}>
                Incident category
              </label>
              <select
                id="case-category"
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--line-strong)",
                  fontSize: "0.95rem",
                  background: "var(--paper-card)",
                }}
              >
                {INCIDENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="case-description" style={{ display: "block", fontWeight: 600, marginBottom: "8px", fontSize: "0.9rem" }}>
                What happened? (Initial summary)
              </label>
              <textarea
                id="case-description"
                rows={5}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what occurred, who contacted you, what platform or channel was involved, and any immediate actions you took…"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--line-strong)",
                  fontSize: "0.95rem",
                  lineHeight: 1.5,
                  fontFamily: "inherit",
                }}
              />
              <small style={{ color: "var(--muted)", display: "block", marginTop: "4px" }}>
                You will be able to upload screenshots, bank alerts, or messages in the workspace.
              </small>
            </div>

            <div>
              <label htmlFor="case-urgency" style={{ display: "block", fontWeight: 600, marginBottom: "8px", fontSize: "0.9rem" }}>
                Urgency level
              </label>
              <select
                id="case-urgency"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as Urgency)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--line-strong)",
                  fontSize: "0.95rem",
                  background: "var(--paper-card)",
                }}
              >
                <option value="high">High — Ongoing fraud, recent unauthorized money transfer or active threat</option>
                <option value="medium">Medium — Suspicious message received or account compromised but no funds lost yet</option>
                <option value="low">Low — Historic incident or informational inquiry</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
              <Link href="/cases" className="secondary-button" style={{ padding: "10px 16px" }}>
                Cancel
              </Link>
              <button
                type="submit"
                disabled={busy}
                className="primary-button"
                id="submit-create-case-btn"
                style={{ padding: "10px 20px" }}
              >
                {busy ? "Creating Workspace…" : "Create Case & Open Workspace →"}
              </button>
            </div>
          </form>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
