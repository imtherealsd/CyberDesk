"use client";

import { useState } from "react";
import Link from "next/link";
import { PublicNav } from "@/app/components/PublicNav";
import { PublicFooter } from "@/app/components/PublicFooter";
import { useAuth } from "@/lib/auth-context";

export default function DeveloperPortalPage() {
  const { user, authFetch } = useAuth();
  const [keyName, setKeyName] = useState("Production FinTech Client");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [testNarrative, setTestNarrative] = useState("I was contacted on Telegram by an account pretending to be an HR recruiter from Amazon offering part-time work from home. They asked me to deposit ₹14,500 into an ICICI account via UPI to unlock my commission, but after payment they blocked me on Telegram.");
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [testingApi, setTestingApi] = useState(false);
  const [activeTab, setActiveTab] = useState<"api" | "sdk" | "webhooks">("api");

  async function handleCreateKey(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setError("Please sign in to generate a developer API key.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await authFetch("/api/v1/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: keyName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create API key.");
      setCreatedKey(data.apiKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate key.");
    } finally {
      setBusy(false);
    }
  }

  async function runInteractiveTest() {
    setTestingApi(true);
    setApiResponse(null);
    try {
      const res = await fetch("/api/v1/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${createdKey || "cyb_live_demo_test_token"}`,
        },
        body: JSON.stringify({ narrative: testNarrative }),
      });
      const data = await res.json();
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setApiResponse(JSON.stringify({ error: err instanceof Error ? err.message : "Network error" }, null, 2));
    } finally {
      setTestingApi(false);
    }
  }

  return (
    <div className="shell">
      <PublicNav />

      <main className="content" style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        <div style={{ marginBottom: "2.5rem" }}>
          <span className="badge" style={{ background: "rgba(14, 165, 233, 0.15)", color: "#0ea5e9", padding: "0.3rem 0.8rem", borderRadius: "999px", fontWeight: "600", fontSize: "0.85rem" }}>
            CyberDesk PaaS Developer Platform
          </span>
          <h1 style={{ fontSize: "2.4rem", fontWeight: "800", marginTop: "0.8rem", letterSpacing: "-0.02em" }}>
            Developer API & Integration Hub
          </h1>
          <p style={{ color: "var(--muted, #64748b)", fontSize: "1.1rem", maxWidth: "750px", lineHeight: "1.6" }}>
            Integrate CyberDesk’s AI incident interpretation (Google Gemini 3.6 Flash), BNS Legal Provision mapping, and court-ready Section 65B evidence pipelines directly into your FinTech app, wallet, or enterprise SIEM.
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: "1rem", borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: "2rem" }}>
          <button
            onClick={() => setActiveTab("api")}
            style={{
              padding: "0.75rem 1.25rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === "api" ? "2px solid #0ea5e9" : "2px solid transparent",
              color: activeTab === "api" ? "#0ea5e9" : "var(--muted)",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            API Keys & Console
          </button>
          <button
            onClick={() => setActiveTab("sdk")}
            style={{
              padding: "0.75rem 1.25rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === "sdk" ? "2px solid #0ea5e9" : "2px solid transparent",
              color: activeTab === "sdk" ? "#0ea5e9" : "var(--muted)",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            SDK & Code Snippets
          </button>
          <button
            onClick={() => setActiveTab("webhooks")}
            style={{
              padding: "0.75rem 1.25rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === "webhooks" ? "2px solid #0ea5e9" : "2px solid transparent",
              color: activeTab === "webhooks" ? "#0ea5e9" : "var(--muted)",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Webhooks & SIEM
          </button>
        </div>

        {activeTab === "api" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
            {/* API Key Generation */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "1.75rem" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: "700", marginBottom: "0.5rem" }}>Generate Live API Key</h2>
              <p style={{ fontSize: "0.9rem", color: "var(--muted)", marginBottom: "1.5rem" }}>
                API keys grant secure programmatic access to `/api/v1/*` endpoints.
              </p>

              {user ? (
                <form onSubmit={handleCreateKey}>
                  <div style={{ marginBottom: "1.25rem" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.4rem" }}>
                      Key Identifier Name
                    </label>
                    <input
                      type="text"
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      required
                      style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.2)", color: "inherit" }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className="button primary"
                    style={{ width: "100%", padding: "0.75rem", fontWeight: "600" }}
                  >
                    {busy ? "Generating Secure Key…" : "Generate New API Key →"}
                  </button>

                  {error && <p style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: "0.75rem" }}>{error}</p>}

                  {createdKey && (
                    <div style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "8px" }}>
                      <p style={{ fontSize: "0.8rem", fontWeight: "700", color: "#10b981", marginBottom: "0.5rem" }}>
                        ✓ NEW LIVE API KEY GENERATED:
                      </p>
                      <code style={{ display: "block", background: "rgba(0,0,0,0.5)", padding: "0.6rem", borderRadius: "6px", fontSize: "0.85rem", wordBreak: "break-all", color: "#6ee7b7" }}>
                        {createdKey}
                      </code>
                      <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.5rem" }}>
                        ⚠️ Copy this key now. It will never be displayed again.
                      </p>
                    </div>
                  )}
                </form>
              ) : (
                <div style={{ padding: "1.5rem", textAlign: "center", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}>
                  <p style={{ fontSize: "0.95rem", marginBottom: "1rem" }}>Please sign in to generate live API keys for your organization.</p>
                  <Link href="/login" className="button primary" style={{ display: "inline-block" }}>
                    Sign in to Developer Account →
                  </Link>
                </div>
              )}
            </div>

            {/* Interactive API Tester */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "1.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h2 style={{ fontSize: "1.3rem", fontWeight: "700" }}>Live API Sandbox (POST /api/v1/analyze)</h2>
                <span style={{ fontSize: "0.75rem", background: "#10b981", color: "#000", padding: "0.2rem 0.5rem", borderRadius: "4px", fontWeight: "700" }}>200 OK</span>
              </div>

              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.4rem" }}>
                Test Narrative Payload
              </label>
              <textarea
                rows={4}
                value={testNarrative}
                onChange={(e) => setTestNarrative(e.target.value)}
                style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.2)", color: "inherit", fontSize: "0.85rem", marginBottom: "1rem" }}
              />

              <button
                onClick={runInteractiveTest}
                disabled={testingApi}
                className="button secondary"
                style={{ width: "100%", padding: "0.75rem", fontWeight: "600", marginBottom: "1rem" }}
              >
                {testingApi ? "Executing via Google Gemini 3.6 Flash…" : "Send Test API Request ⚡"}
              </button>

              {apiResponse && (
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--muted)", marginBottom: "0.3rem" }}>
                    Live JSON Response
                  </label>
                  <pre style={{ maxHeight: "250px", overflowY: "auto", background: "rgba(0,0,0,0.6)", padding: "0.75rem", borderRadius: "8px", fontSize: "0.75rem", color: "#38bdf8", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {apiResponse}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "sdk" && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "2rem" }}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: "700", marginBottom: "1rem" }}>Integration Code Snippets</h2>

            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "#38bdf8", marginBottom: "0.5rem" }}>1. cURL (Command Line)</h3>
              <pre style={{ background: "rgba(0,0,0,0.6)", padding: "1rem", borderRadius: "8px", fontSize: "0.85rem", color: "#e2e8f0", overflowX: "auto" }}>
{`curl -X POST https://cyberdesk-five.vercel.app/api/v1/analyze \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "narrative": "I received an APK download link claiming to be SBI KYC update. INR 25,000 was debited via UPI."
  }'`}
              </pre>
            </div>

            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "#38bdf8", marginBottom: "0.5rem" }}>2. TypeScript / Node.js</h3>
              <pre style={{ background: "rgba(0,0,0,0.6)", padding: "1rem", borderRadius: "8px", fontSize: "0.85rem", color: "#e2e8f0", overflowX: "auto" }}>
{`import { fetch } from 'undici';

const response = await fetch('https://cyberdesk-five.vercel.app/api/v1/incidents', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + process.env.CYBERDESK_API_KEY
  },
  body: JSON.stringify({
    narrative: 'Victim was coerced into sending INR 45,000 under threat of leaking morphed photos.',
    complainantName: 'Rohan Sharma',
    bankName: 'HDFC Bank'
  })
});

const result = await response.json();
console.log('Case ID:', result.caseId);
console.log('BNS Legal Provisions:', result.legalArtifacts.firDraft.applicableProvisions);`}
              </pre>
            </div>
          </div>
        )}

        {activeTab === "webhooks" && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "2rem" }}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: "700", marginBottom: "0.5rem" }}>Real-time Webhook Subscriptions</h2>
            <p style={{ color: "var(--muted)", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
              Subscribe your SIEM, Fraud Ops Desk, or Slack channel to real-time incident events. All payloads are cryptographically signed with HMAC-SHA256 headers (`X-CyberDesk-Signature`).
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
              <div style={{ padding: "1rem", background: "rgba(0,0,0,0.2)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <code style={{ color: "#38bdf8", fontWeight: "700" }}>incident.created</code>
                <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.3rem" }}>Triggered when a citizen or system logs a new incident.</p>
              </div>
              <div style={{ padding: "1rem", background: "rgba(0,0,0,0.2)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <code style={{ color: "#38bdf8", fontWeight: "700" }}>evidence.extracted</code>
                <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.3rem" }}>Triggered when Gemini AI parses new candidate facts.</p>
              </div>
              <div style={{ padding: "1rem", background: "rgba(0,0,0,0.2)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <code style={{ color: "#38bdf8", fontWeight: "700" }}>dossier.finalized</code>
                <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.3rem" }}>Triggered when a formal court-ready dossier is generated.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
