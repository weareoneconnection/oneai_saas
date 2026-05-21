"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { getStoredReferral } from "./ReferralCapture";

export default function ReferralClaim() {
  const { data, status } = useSession();

  React.useEffect(() => {
    if (status !== "authenticated") return;
    const email = String(data?.user?.email || "").trim().toLowerCase();
    if (!email) return;

    const referral = getStoredReferral();
    if (!referral?.refCode) return;

    const claimKey = `oneai.partner.claimed.${email}.${referral.refCode}`;
    if (window.localStorage.getItem(claimKey)) return;

    fetch("/api/referrals/claim", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(referral),
      cache: "no-store",
    })
      .then((res) => {
        if (res.ok) window.localStorage.setItem(claimKey, new Date().toISOString());
      })
      .catch(() => {
        // Referral attribution is best-effort and should never block the console.
      });
  }, [data?.user?.email, status]);

  return null;
}
