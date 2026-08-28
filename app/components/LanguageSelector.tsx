"use client";

import { useState, useRef, useEffect } from "react";
import { en } from "@/lib/i18n/en";

export function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="language-selector" ref={dropdownRef}>
      <button
        type="button"
        className="language-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={en.shell.languageSelectorLabel}
      >
        <span className="lang-globe" aria-hidden="true">🌐</span>
        <span className="lang-name">{en.shell.languageName}</span>
        <span className="lang-arrow" aria-hidden="true">▾</span>
      </button>

      {isOpen && (
        <div className="language-dropdown" role="menu">
          <button
            type="button"
            className="lang-option active"
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            <span>English</span>
            <span className="lang-active-check" aria-hidden="true">✓</span>
          </button>
          <div className="lang-divider" />
          <div className="lang-coming-soon">
            <small>{en.shell.moreLanguagesNotice}</small>
            <span className="lang-chips">
              <span>हिन्दी</span>
              <span>தமிழ்</span>
              <span>తెలుగు</span>
              <span>বাংলা</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
