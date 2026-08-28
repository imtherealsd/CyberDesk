import Link from "next/link";
import { PublicNav } from "@/app/components/PublicNav";
import { PublicFooter } from "@/app/components/PublicFooter";

export default function NotFound() {
  return (
    <div className="not-found-page">
      <PublicNav />

      <main id="main-content" className="not-found-main">
        <div className="not-found-content">
          {/* Brand mark */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "28px" }}>
            <span className="brand-mark" aria-hidden="true" style={{ width: 48, height: 48, padding: 10 }}>
              <span />
              <span />
              <span />
            </span>
          </div>

          <p className="not-found-code" aria-hidden="true">404</p>
          <h1 className="not-found-title">Page not found</h1>
          <p className="not-found-desc">
            This page doesn&apos;t exist or may have been moved. If you were looking for a specific
            incident workspace, please sign in and check your Cases.
          </p>

          <div className="not-found-actions">
            <Link href="/" className="primary-button">
              ← Return home
            </Link>
            <Link href="/cases" className="secondary-button">
              My Cases
            </Link>
            <Link href="/how-it-works" className="secondary-button">
              How it works
            </Link>
          </div>

          {/* 1930 reminder */}
          <div style={{
            marginTop: "48px",
            padding: "16px 20px",
            background: "var(--paper-subtle)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-md)",
            fontSize: "0.875rem",
            color: "var(--muted)",
            lineHeight: 1.55,
          }}>
            <strong style={{ color: "var(--ink)" }}>Responding to cyber fraud?</strong>{" "}
            Call{" "}
            <a href="tel:1930" style={{ color: "var(--teal-dark)", fontWeight: 700 }}>1930</a>
            {" "}(National Cyber Crime Helpline) or visit{" "}
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--teal-dark)", fontWeight: 600 }}
            >
              cybercrime.gov.in
            </a>
            {" "}to file an official report.
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
