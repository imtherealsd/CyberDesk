"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LanguageSelector } from "./LanguageSelector";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";

export interface PublicNavProps {
  onStartIncident?: () => void;
}

export function PublicNav({ onStartIncident }: PublicNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const drawerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Focus trap in mobile drawer
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const drawer = drawerRef.current;
    if (!drawer) return;

    const focusable = drawer.querySelectorAll<HTMLElement>(
      'a, button, input, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        toggleRef.current?.focus();
      }
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const navLinks = [
    { href: "/", label: t.nav.home },
    { href: "/how-it-works", label: t.nav.howItWorks },
    { href: "/safety", label: t.nav.safety },
    { href: "/resources", label: t.nav.resources },
    { href: "/about", label: t.nav.about },
  ];

  if (user) {
    navLinks.push({ href: "/cases", label: t.nav.myCases });
  }

  const isOnHome = pathname === "/";

  return (
    <header className="public-topbar">
      <div className="public-nav-container">
        <Link href="/" className="brand" aria-label="CyberDesk Home">
          <span className="brand-mark" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/cyberdesk-logo.png" alt="" width={32} height={32} className="brand-logo-img" />
          </span>
          <span className="brand-text">
            <strong>CyberDesk</strong>
            <small>{t.common.brandSubtitle}</small>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav-links" aria-label="Main Navigation">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${isActive ? "active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Actions */}
        <div className="topbar-actions">
          <LanguageSelector />

          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                className="prototype-badge"
                style={{
                  background: "var(--teal-soft)",
                  color: "var(--teal-dark)",
                  borderColor: "var(--teal-border)",
                  maxWidth: "160px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={user.email}
              >
                {user.email}
              </span>
              <Link href="/cases" className="primary-button nav-cta-btn">
                {t.nav.myCases} <span aria-hidden="true">→</span>
              </Link>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="secondary-button"
                style={{ fontSize: "0.85rem", padding: "8px 14px" }}
              >
                {t.nav.signIn}
              </Link>
              {/* "Start an incident" only shown if we have an onStartIncident handler (home page SPA) */}
              {onStartIncident && !isOnHome && (
                <button
                  type="button"
                  className="primary-button nav-cta-btn"
                  onClick={onStartIncident}
                >
                  {t.nav.startIncident} <span aria-hidden="true">→</span>
                </button>
              )}
              {!onStartIncident && (
                <Link href="/" className="primary-button nav-cta-btn">
                  {t.nav.startIncident} <span aria-hidden="true">→</span>
                </Link>
              )}
            </>
          )}

          {/* Mobile Hamburger Button */}
          <button
            ref={toggleRef}
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-drawer"
            aria-label={mobileMenuOpen ? t.shell.closeMenu : t.shell.openMenu}
          >
            <span className={`hamburger-bar ${mobileMenuOpen ? "open" : ""}`} />
            <span className={`hamburger-bar ${mobileMenuOpen ? "open" : ""}`} />
            <span className={`hamburger-bar ${mobileMenuOpen ? "open" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      <div
        id="mobile-nav-drawer"
        ref={drawerRef}
        className="mobile-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={t.shell.menu}
        aria-hidden={!mobileMenuOpen}
        style={{ display: mobileMenuOpen ? undefined : "none" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px 8px" }}>
          {user ? (
            <span style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 600 }}>
              {user.email}
            </span>
          ) : (
            <span style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 600 }}>
              CyberDesk {t.shell.menu}
            </span>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <LanguageSelector />
            <button
              type="button"
              className="secondary-button"
              style={{ padding: "6px 12px", fontSize: "0.85rem" }}
              onClick={() => {
                setMobileMenuOpen(false);
                toggleRef.current?.focus();
              }}
              aria-label={t.common.close}
            >
              ✕ {t.common.close}
            </button>
          </div>
        </div>
        <nav className="mobile-nav-links" aria-label="Mobile navigation">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`mobile-nav-link ${isActive ? "active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="mobile-nav-footer">
          {user ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <Link href="/cases" className="primary-button mobile-cta-btn">
                {t.nav.myCases} <span aria-hidden="true">→</span>
              </Link>
              <button
                type="button"
                className="secondary-button mobile-cta-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut().then(() => router.push("/"));
                }}
              >
                {t.nav.signOut}
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className="secondary-button mobile-cta-btn" style={{ marginBottom: "8px" }}>
                {t.nav.signIn}
              </Link>
              <Link href="/" className="primary-button mobile-cta-btn">
                {t.nav.startIncident} <span aria-hidden="true">→</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

