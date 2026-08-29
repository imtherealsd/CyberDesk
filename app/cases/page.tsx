"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
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
  const { t } = useI18n();
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
          className="workspace-main flex-center"
          style={{ minHeight: "40vh" }}
        >
          <p style={{ color: "var(--muted)" }}>{t.cases.checkingAuth}</p>
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
              {t.cases.badge}
            </span>
            <h1 className="workspace-page-title">{t.cases.title}</h1>
            <p className="workspace-page-subtitle">
              {t.cases.subtitle}
            </p>
          </div>

          <div className="flex-row gap-sm" style={{ flexWrap: "wrap" }}>
            <span
              className="prototype-badge font-mono"
              style={{ background: "var(--teal-soft)", color: "var(--teal-dark)", borderColor: "var(--teal-border)" }}
            >
              {user?.email}
            </span>
            <Link href="/cases/new" className="primary-button" id="create-case-btn">
              + {t.cases.newCaseBtn}
            </Link>
            <button
              type="button"
              className="secondary-button"
              style={{ fontSize: "0.85rem", padding: "8px 12px" }}
              onClick={() => signOut().then(() => router.push("/"))}
            >
              {t.nav.signOut}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="error-box" role="alert" style={{ marginBottom: "24px" }}>
            <strong>{t.common.accessDenied}</strong>
            <span>{error}</span>
          </div>
        )}

        {/* Cases list */}
        {loadingCases ? (
          <div className="card" style={{ padding: "48px", textAlign: "center", color: "var(--muted)" }}>
            <div style={{ marginBottom: "12px", fontSize: "1.5rem" }}>⏳</div>
            {t.cases.loadingText}
          </div>
        ) : cases.length === 0 ? (
          <div className="case-empty-state">
            <div className="case-empty-icon" aria-hidden="true">📁</div>
            <h2 className="case-empty-title">{t.cases.emptyTitle}</h2>
            <p className="case-empty-desc">
              {t.cases.emptyDesc}
            </p>
            <Link href="/cases/new" className="primary-button" style={{ display: "inline-block" }}>
              {t.cases.newCaseBtn} →
            </Link>
          </div>
        ) : (
          <div className="flex-col gap-sm">
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
                      📁 <strong>{item.evidenceCount}</strong> {t.workspace.tabEvidence}
                    </span>
                    <span className="case-card-stat">
                      ✓ <strong>{item.verifiedFactCount}</strong> {t.evidence.statusVerified}
                    </span>
                    {item.caseReference && (
                      <span className="case-card-stat font-mono">
                        Ref: <strong>{item.caseReference}</strong>
                      </span>
                    )}
                    <span className="case-card-stat">
                      {t.cases.tableUpdated}:{" "}
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
                  {t.cases.openWorkspace}
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
            {t.about.explorationTitle}
          </h3>
          <p style={{ margin: "0 0 12px", fontSize: "0.85rem", color: "var(--muted)" }}>
            {t.common.privateByDesignDesc}
          </p>
          <Link href="/" className="secondary-button" style={{ fontSize: "0.85rem", padding: "6px 12px" }}>
            {t.entry.secondaryCta} →
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

