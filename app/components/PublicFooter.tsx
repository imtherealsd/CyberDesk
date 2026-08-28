"use client";

import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Brand column */}
          <div className="footer-brand-col">
            <div className="brand footer-brand">
              <span className="brand-mark" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span className="brand-text">
                <strong>CyberDesk</strong>
                <small>Citizen cyber incident assistance</small>
              </span>
            </div>
            <p className="footer-tagline">
              A clearer way to understand, organise, and prepare your response after a digital incident in India.
            </p>
            <div className="footer-prototype-tag">
              Independent prototype · Not a government portal
            </div>
          </div>

          {/* Platform links */}
          <div className="footer-links-col">
            <span className="footer-col-title">Product</span>
            <ul className="footer-links-list">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/how-it-works">How it works</Link></li>
              <li><Link href="/safety">Safety &amp; privacy</Link></li>
              <li><Link href="/resources">Resources</Link></li>
              <li><Link href="/about">About CyberDesk</Link></li>
            </ul>
          </div>

          {/* Legal links */}
          <div className="footer-links-col">
            <span className="footer-col-title">Legal</span>
            <div className="footer-legal-links">
              <Link href="/privacy">Privacy policy</Link>
              <Link href="/terms">Terms of use</Link>
              <hr className="footer-legal-divider" />
              <span style={{ fontSize: "0.78rem", color: "var(--muted)", lineHeight: 1.5 }}>
                Alpha prototype · August 2026<br />
                Not affiliated with any government
              </span>
            </div>
          </div>

          {/* Official Helpline */}
          <div className="footer-helpline-col">
            <span className="footer-col-title">Official Helplines (India)</span>
            <div className="footer-helpline-card">
              <strong>National Cyber Crime Helpline</strong>
              <div className="helpline-number-row">
                <a href="tel:1930" className="helpline-phone" aria-label="Call 1930, National Cyber Crime Helpline">
                  1930
                </a>
                <span className="badge-tollfree">Toll-free</span>
              </div>
              <p>Lost money to online fraud? Report within the first hour — call immediately.</p>
              <a
                href="https://cybercrime.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="portal-link"
              >
                cybercrime.gov.in <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <div className="footer-disclaimer">
            <strong>Important:</strong> CyberDesk is an independent prototype. It does not file official police complaints (FIRs), freeze accounts, or reverse transactions. For official reporting, call{" "}
            <strong>1930</strong> or visit{" "}
            <strong>cybercrime.gov.in</strong>. All data in the demo is synthetic and fictional.
          </div>
          <div className="footer-copyright">
            © {new Date().getFullYear()} CyberDesk Prototype. Private by design.
          </div>
        </div>
      </div>
    </footer>
  );
}
