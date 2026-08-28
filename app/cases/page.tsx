"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { PublicNav } from "../components/PublicNav";
import { PublicFooter } from "../components/PublicFooter";
import type { CaseSummary } from "@/lib/types";

function UrgencyBadge({ urgency }: { urgency: string }) {
  return (
    <span className={`urgency-badge ${urgency}`}>
      {urgency === "high" ? "⚠ " : ""}
      {urgency.toUpperCase()}
    </span>
  );
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span className={`status-badge ${status}`}>
      {label}
    </span>
  );
}

export default function MyCasesPage() {
  const { user, isLoading, authFetch, signOut } = useAuth();
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const loadCases = useCallback(async () => {
    setLoadingCases(true);
    setError("");
    try {
      const response = await authFetch("/api/cases");
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to load cases");
      setCases(data.cases || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load cases.");
    } finally {
      setLoadingCases(false);
    }
  }, [authFetch, router]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      loadCases();
    }
  }, [user, isLoading, router, loadCases]);

  if (isLoading || (!user && loadingCases)) {
    return (
      <div className="workspace-page">
        <PublicNav />
        <main
          id="main-content"
          className="workspace-main"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh" }}
        >
          <p style={{ color: "var(--muted)" }}>Checking authorization…</p>
        </main>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="workspace-page">
      <PublicNav />

      <main id="main-content" className="workspace-main">
        {/* Page Header */}
        <div className="workspace-page-header">
          <div>
            <span className="prototype-badge" style={{ marginBottom: "8px", display: "inline-block" }}>
              Case Management Workspace
            </span>
            <h1 className="workspace-page-title">My Incident Cases</h1>
            <p className="workspace-page-subtitle">
              Private, encrypted workspaces for documenting cyber incidents, organising evidence, and building verified timelines.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <span
              className="prototype-badge"
              style={{ background: "var(--teal-soft)", color: "var(--teal-dark)", borderColor: "var(--teal-border)" }}
            >
              {user?.email}
            </span>
            <Link href="/cases/new" className="primary-button" id="create-case-btn">
              + New Case
            </Link>
            <button
              type="button"
              className="secondary-button"
              style={{ fontSize: "0.85rem", padding: "8px 12px" }}
              onClick={() => signOut().then(() => router.push("/"))}
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="error-box" role="alert" style={{ marginBottom: "24px" }}>
            <strong>Unable to load cases</strong>
            <span>{error}</span>
          </div>
        )}

        {/* Cases list */}
        {loadingCases ? (
          <div className="card" style={{ padding: "48px", textAlign: "center", color: "var(--muted)" }}>
            <div style={{ marginBottom: "12px", fontSize: "1.5rem" }}>⏳</div>
            Loading your cases…
          </div>
        ) : cases.length === 0 ? (
          <div className="case-empty-state">
            <div className="case-empty-icon" aria-hidden="true">📁</div>
            <h2 className="case-empty-title">No incidents documented yet</h2>
            <p className="case-empty-desc">
              Create your first incident workspace to upload evidence, extract key details with AI,
              verify facts, and prepare a structured dossier for your bank or the authorities.
            </p>
            <Link href="/cases/new" className="primary-button" style={{ display: "inline-block" }}>
              Start an Incident Workspace →
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "14px" }}>
            {cases.map((item) => (
              <div key={item.id} className="case-card">
                <div style={{ flex: "1 1 300px" }}>
                  <div className="case-card-meta">
                    <StatusBadge status={item.status} label={item.statusLabel} />
                    <UrgencyBadge urgency={item.urgency} />
                    <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                      Role: {item.role}
                    </span>
                  </div>

                  <h2 className="case-card-title">
                    {item.incidentType || "Online Cyber Incident"}
                  </h2>
                  <p className="case-card-desc">{item.description}</p>

                  <div className="case-card-stats">
                    <span className="case-card-stat">
                      📁 <strong>{item.evidenceCount}</strong> evidence {item.evidenceCount === 1 ? "file" : "files"}
                    </span>
                    <span className="case-card-stat">
                      ✓ <strong>{item.verifiedFactCount}</strong> verified {item.verifiedFactCount === 1 ? "fact" : "facts"}
                    </span>
                    {item.caseReference && (
                      <span className="case-card-stat">
                        Ref: <strong>{item.caseReference}</strong>
                      </span>
                    )}
                    <span className="case-card-stat">
                      Updated:{" "}
                      {new Date(item.updatedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/cases/${item.id}`}
                  className="primary-button"
                  style={{ whiteSpace: "nowrap", padding: "10px 18px", fontSize: "0.9rem" }}
                >
                  Open Workspace →
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Demo pointer */}
        <div
          style={{
            marginTop: "40px",
            padding: "20px 24px",
            background: "var(--paper-subtle)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--line)",
          }}
        >
          <h3 style={{ fontSize: "0.95rem", margin: "0 0 6px", color: "var(--ink)" }}>
            Looking for the synthetic prototype demo?
          </h3>
          <p style={{ margin: "0 0 12px", fontSize: "0.85rem", color: "var(--muted)" }}>
            You can still test and explore the pre-seeded bank impersonation scenario without creating a real user-owned case.
          </p>
          <Link href="/" className="secondary-button" style={{ fontSize: "0.85rem", padding: "6px 12px" }}>
            Explore Synthetic Demo Journey →
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
