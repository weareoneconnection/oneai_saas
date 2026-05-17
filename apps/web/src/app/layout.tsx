import "./globals.css";
import React from "react";
import { I18nProvider } from "@/lib/i18n";

export const metadata = {
  title: "OneAI",
  description: "OneAI Studio",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
