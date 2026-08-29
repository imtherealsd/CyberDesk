"use client";

import { useState, useRef, useEffect } from "react";
import { useI18n, type SupportedLanguage } from "@/lib/i18n";

export function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { language, setLanguage, t, languages } = useI18n();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (code: SupportedLanguage) => {
    setLanguage(code);
    setIsOpen(false);
  };

  const currentLangMeta = languages.find((l) => l.code === language) || languages[0];

  return (
    <div className="language-selector" ref={dropdownRef}>
      <button
        type="button"
        className="language-btn lang-selector-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={t.shell.languageSelectorLabel}
        id="language-selector-button"
      >
        <span className="lang-globe" aria-hidden="true">🌐</span>
        <span className="lang-name">{currentLangMeta.nativeLabel}</span>
        <span className="lang-arrow" aria-hidden="true">▾</span>
      </button>

      {isOpen && (
        <div className="language-dropdown lang-selector-menu" role="menu" aria-orientation="vertical" aria-labelledby="language-selector-button">
          {languages.map((lang) => {
            const isActive = lang.code === language;
            return (
              <button
                key={lang.code}
                type="button"
                className={`lang-option ${isActive ? "active" : ""}`}
                role="menuitem"
                onClick={() => handleSelect(lang.code)}
                id={`lang-option-${lang.code}`}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <span style={{ fontWeight: isActive ? 700 : 500 }}>{lang.nativeLabel}</span>
                  {lang.code !== "en" && (
                    <small style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{lang.label}</small>
                  )}
                </div>
                {isActive && <span className="lang-active-check" aria-hidden="true">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

