"use client";

import React, { useEffect, useMemo, useState } from "react";

type Customer = {
  email: string;
  keyCount: number;
  activeKeyCount: number;
  requestCount: number;
  costUsd: number;
  latestLoginAt?: string | null;
  lastRequestAt?: string | null;
  latestKeyUsedAt?: string | null;
  latestKeyCreatedAt?: string | null;
};

type EventRow = {
  id: string;
  action: string;
  userEmail?: string | null;
  target?: string | null;
  createdAt: string;
};

type Payload = {
  success?: boolean;
  error?: string;
  hint?: string;
  data?: {
    customers: Customer[];
    recentEvents: EventRow[];
  };
};

function fmtNum(n?: number | null) {
  return new Intl.NumberFormat("en-US", { notation: Number(n || 0) >= 100000 ? "compact" : "standard" }).format(Number(n || 0));
}

function fmtUsd(n?: number | null) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: Number(n || 0) >= 100000 ? "compact" : "standard",
    maximumFractionDigits: Number(n || 0) >= 1000 ? 1 : 2,
  }).format(Number(n || 0));
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  const safeName = name.length <= 2 ? `${name[0] || "*"}*` : `${name.slice(0, 2)}***`;
  return `${safeName}@${domain}`;
}

function latestActivity(row: Customer) {
  return row.lastRequestAt || row.latestKeyUsedAt || row.latestKeyCreatedAt || row.latestLoginAt || null;
}

export function CommercialPreview() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [status, setStatus] = useState<"loading" | "live" | "locked" | "empty">("loading");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/customers", { cache: "no-store" });
        const json = (await res.json()) as Payload;
        if (cancelled) return;

        if (!res.ok || json.success === false) {
          setStatus("locked");
          return;
        }

        const rows = json.data?.customers || [];
        setCustomers(rows);
        setEvents(json.data?.recentEvents || []);
        setStatus(rows.length ? "live" : "empty");
      } catch {
        if (!cancelled) setStatus("locked");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const totals = useMemo(() => {
    return customers.reduce(
      (acc, row) => {
        acc.customers += 1;
        acc.activeKeys += row.activeKeyCount || 0;
        acc.requests += row.requestCount || 0;
        acc.cost += row.costUsd || 0;
        return acc;
      },
      { customers: 0, activeKeys: 0, requests: 0, cost: 0 }
    );
  }, [customers]);

  const rows = useMemo(() => {
    return [...customers]
      .sort((a, b) => new Date(latestActivity(b) || 0).getTime() - new Date(latestActivity(a) || 0).getTime())
      .slice(0, 4);
  }, [customers]);

  const statusLabel =
    status === "live" ? "Live data" : status === "loading" ? "Loading" : status === "empty" ? "No customers yet" : "Operator login required";

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3 shadow-2xl shadow-black/30">
      <div className="rounded-lg border border-white/10 bg-[#f7f6f2] p-3 text-black">
        <div className="flex flex-col gap-3 border-b border-black/10 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-black">Commercial Control Plane</div>
            <div className="text-xs text-black/45">Real operator data from OneAI customers, keys, usage, and events</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-black px-2 py-1 text-xs font-bold text-white">Operator</span>
            <span className={["rounded-full px-2 py-1 text-xs font-bold", status === "live" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"].join(" ")}>
              {statusLabel}
            </span>
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          {[
            ["Customers", status === "live" ? fmtNum(totals.customers) : "-"],
            ["Active keys", status === "live" ? fmtNum(totals.activeKeys) : "-"],
            ["Requests", status === "live" ? fmtNum(totals.requests) : "-"],
            ["Model cost", status === "live" ? fmtUsd(totals.cost) : "-"],
          ].map((item) => (
            <div key={item[0]} className="rounded-lg border border-black/10 bg-white p-3">
              <div className="text-xs text-black/45">{item[0]}</div>
              <div className="mt-1 text-xl font-black tracking-tight">{item[1]}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="overflow-x-auto rounded-lg border border-black/10 bg-white">
            <div className="min-w-[520px]">
              <div className="grid grid-cols-12 bg-black/[0.03] px-3 py-2 text-xs font-black text-black/45">
                <div className="col-span-5">Customer</div>
                <div className="col-span-2 text-right">Keys</div>
                <div className="col-span-3 text-right">Cost</div>
                <div className="col-span-2 text-right">Usage</div>
              </div>
              {status === "live" && rows.length ? (
                rows.map((row) => (
                  <div key={row.email} className="grid grid-cols-12 border-t border-black/10 px-3 py-2 text-xs">
                    <div className="col-span-5 truncate font-semibold" title={row.email}>{maskEmail(row.email)}</div>
                    <div className="col-span-2 text-right text-black/60">{fmtNum(row.activeKeyCount)}</div>
                    <div className="col-span-3 text-right font-bold">{fmtUsd(row.costUsd)}</div>
                    <div className="col-span-2 text-right text-black/60">{fmtNum(row.requestCount)}</div>
                  </div>
                ))
              ) : (
                <div className="border-t border-black/10 px-3 py-8 text-center text-xs font-semibold text-black/45">
                  {status === "loading" ? "Loading operator data..." : status === "empty" ? "No customer activity yet." : "Sign in as an operator to view real data."}
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-lg border border-black/10 bg-white p-3">
              <div className="text-xs font-black uppercase tracking-wide text-black/40">Plan policy</div>
              <div className="mt-3 space-y-2 text-xs">
                {[
                  ["Free", "cheap + balanced"],
                  ["Pro", "fast + auto"],
                  ["Team", "premium + debug"],
                ].map((row) => (
                  <div key={row[0]} className="flex items-center justify-between gap-3 rounded-lg bg-black/[0.03] px-3 py-2">
                    <span className="font-black">{row[0]}</span>
                    <span className="text-black/55">{row[1]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-black/10 bg-[#0f1115] p-3 text-white">
              <div className="text-xs font-black uppercase tracking-wide text-white/45">Recent events</div>
              <div className="mt-3 space-y-2 text-xs text-white/70">
                {status === "live" && events.length ? (
                  events.slice(0, 3).map((event) => (
                    <div key={event.id}>
                      {event.action} · {event.userEmail ? maskEmail(event.userEmail) : event.target || "-"}
                    </div>
                  ))
                ) : (
                  <div>{status === "loading" ? "Loading events..." : "No visible events."}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
