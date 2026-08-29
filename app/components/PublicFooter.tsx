"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export function PublicFooter() {
  const { t } = useI18n();

  return (
    <footer className="public-footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Brand & Disclosure column */}
          <div className="footer-brand-col">
            <div className="brand footer-brand">
              <span className="brand-mark" aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/cyberdesk-logo.png" alt="" width={32} height={32} className="brand-logo-img" />
              </span>
              <span className="brand-text">
                <strong>CyberDesk</strong>
                <small>{t.common.brandSubtitle}</small>
              </span>
            </div>
            <p className="footer-tagline">
              {t.footer.tagline}
            </p>
            <div className="footer-prototype-tag">
              {t.footer.prototypeTag}
            </div>
          </div>

          {/* Product links */}
          <div className="footer-links-col">
            <span className="footer-col-title">{t.footer.colProduct}</span>
            <ul className="footer-links-list">
              <li><Link href="/how-it-works">{t.footer.linkHowItWorks}</Link></li>
              <li><Link href="/">{t.footer.linkStartIncident}</Link></li>
              <li><Link href="/about">{t.footer.linkAbout}</Link></li>
            </ul>
          </div>

          {/* Information links */}
          <div className="footer-links-col">
            <span className="footer-col-title">{t.footer.colInformation}</span>
            <ul className="footer-links-list">
              <li><Link href="/resources">{t.footer.linkResources}</Link></li>
              <li><Link href="/safety">{t.footer.linkSafety}</Link></li>
            </ul>
          </div>

          {/* Legal links */}
          <div className="footer-links-col">
            <span className="footer-col-title">{t.footer.colLegal}</span>
            <ul className="footer-links-list">
              <li><Link href="/privacy">{t.footer.linkPrivacy}</Link></li>
              <li><Link href="/terms">{t.footer.linkTerms}</Link></li>
            </ul>
          </div>

          {/* Official Helpline */}
          <div className="footer-helpline-col">
            <span className="footer-col-title">{t.footer.colUrgent}</span>
            <div className="footer-helpline-card">
              <div className="helpline-number-row">
                <a href="tel:1930" className="helpline-phone" aria-label="Call 1930, National Cyber Crime Helpline">
                  1930
                </a>
                <span className="badge-tollfree">{t.footer.tollFree}</span>
              </div>
              <p>{t.footer.helplineSubtitle}</p>
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
            {t.footer.disclaimer}
          </div>
          <div className="footer-copyright">
            {t.footer.copyright}
          </div>
        </div>
      </div>
    </footer>
  );
}


