"use client";

import React from "react";

const REF_KEY = "oneai.partner.ref";
const SOURCE_KEY = "oneai.partner.source";
const LANDING_KEY = "oneai.partner.landing";

function normalizeRef(raw: string | null) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 80);
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=7776000; SameSite=Lax`;
}

export function getStoredReferral() {
  if (typeof window === "undefined") return null;
  const ref = normalizeRef(window.localStorage.getItem(REF_KEY));
  if (ref) {
    return {
      refCode: ref,
      sourcePath: window.localStorage.getItem(SOURCE_KEY) || "",
      landingPath: window.localStorage.getItem(LANDING_KEY) || "",
    };
  }

  const cookieRef = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("oneai.ref="));
  const value = cookieRef ? decodeURIComponent(cookieRef.split("=").slice(1).join("=")) : "";
  const normalized = normalizeRef(value);
  if (!normalized) return null;

  return {
    refCode: normalized,
    sourcePath: window.location.pathname + window.location.search,
    landingPath: window.location.pathname,
  };
}

export default function ReferralCapture() {
  React.useEffect(() => {
    const url = new URL(window.location.href);
    const refCode = normalizeRef(
      url.searchParams.get("ref") ||
        url.searchParams.get("partner") ||
        url.searchParams.get("via") ||
        url.searchParams.get("utm_ref")
    );

    if (!refCode) return;

    const sourcePath = window.location.pathname + window.location.search;
    const existingLanding = window.localStorage.getItem(LANDING_KEY);

    window.localStorage.setItem(REF_KEY, refCode);
    window.localStorage.setItem(SOURCE_KEY, sourcePath);
    window.localStorage.setItem(LANDING_KEY, existingLanding || window.location.pathname);
    setCookie("oneai.ref", refCode);
  }, []);

  return null;
}
