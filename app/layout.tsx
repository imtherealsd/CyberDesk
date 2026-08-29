import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { I18nProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "CyberDesk — Understand what happened. Know what to do next.",
  description: "An independent prototype for preparing and understanding cyber incident reports.",
  icons: {
    icon: "/cyberdesk-logo.png",
    apple: "/cyberdesk-logo.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AuthProvider>
          <I18nProvider>
            {children}
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

