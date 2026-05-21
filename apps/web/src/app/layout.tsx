import "./globals.css";
import React from "react";
import { I18nProvider } from "@/lib/i18n";
import ReferralCapture from "@/components/referrals/ReferralCapture";

export const metadata = {
  title: "OneAI",
  description: "OneAI Studio",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>
          <ReferralCapture />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
