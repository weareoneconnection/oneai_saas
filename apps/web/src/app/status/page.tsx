import { Suspense } from "react";

type Monitor = {
  id: number;
  friendly_name: string;
  url: string;
  status: number;
  average_response_time: string;
  uptime_ratio?: string;
};

async function getMonitors(): Promise<Monitor[]> {
  const apiKey = process.env.UPTIMEROBOT_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch("https://api.uptimerobot.com/v2/getMonitors", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        api_key: apiKey,
        format: "json",
        custom_uptime_ratios: "7-30",
      }),
      next: { revalidate: 60 },
    });
    const json = await res.json();
    return json?.monitors || [];
  } catch {
    return [];
  }
}

function statusLabel(status: number) {
  if (status === 2) return { text: "Operational", color: "bg-emerald-500" };
  if (status === 9) return { text: "Degraded", color: "bg-amber-500" };
  return { text: "Down", color: "bg-red-500" };
}

function uptimeColor(ratio: string) {
  const n = parseFloat(ratio);
  if (n >= 99.9) return "text-emerald-600";
  if (n >= 99) return "text-amber-600";
  return "text-red-600";
}

async function StatusContent() {
  const monitors = await getMonitors();
  const allUp = monitors.every((m) => m.status === 2);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16">
      <div className="mb-10 text-center">
        <div
          className={[
            "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full",
            allUp ? "bg-emerald-500/10" : "bg-red-500/10",
          ].join(" ")}
        >
          <div className={["h-6 w-6 rounded-full", allUp ? "bg-emerald-500" : "bg-red-500"].join(" ")} />
        </div>
        <h1 className="text-2xl font-bold text-black">
          {allUp ? "All Systems Operational" : "Service Disruption"}
        </h1>
        <p className="mt-2 text-sm text-black/50">
          Updated every 5 minutes · {new Date().toUTCString()}
        </p>
      </div>

      <div className="space-y-3">
        {monitors.map((monitor) => {
          const s = statusLabel(monitor.status);
          const ratios = (monitor.uptime_ratio || "").split("-");
          const ratio7 = ratios[0] || "—";
          const ratio30 = ratios[1] || "—";

          return (
            <div
              key={monitor.id}
              className="flex items-center justify-between rounded-xl border border-black/10 bg-white px-5 py-4"
            >
              <div className="flex items-center gap-3">
                <div className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
                <div>
                  <div className="text-sm font-semibold text-black">
                    {monitor.friendly_name.replace(/https?:\/\//, "").split("/")[0]}
                  </div>
                  <div className="text-xs text-black/45">{monitor.url}</div>
                </div>
              </div>
              <div className="flex items-center gap-6 text-right">
                <div>
                  <div className="text-xs text-black/45">Response</div>
                  <div className="text-sm font-semibold text-black">
                    {monitor.average_response_time ? `${Math.round(parseFloat(monitor.average_response_time))} ms` : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-black/45">7 days</div>
                  <div className={`text-sm font-semibold ${uptimeColor(ratio7)}`}>
                    {ratio7 !== "—" ? `${parseFloat(ratio7).toFixed(2)}%` : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-black/45">30 days</div>
                  <div className={`text-sm font-semibold ${uptimeColor(ratio30)}`}>
                    {ratio30 !== "—" ? `${parseFloat(ratio30).toFixed(2)}%` : "—"}
                  </div>
                </div>
                <div className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  monitor.status === 2
                    ? "bg-emerald-500/10 text-emerald-700"
                    : monitor.status === 9
                      ? "bg-amber-500/10 text-amber-800"
                      : "bg-red-500/10 text-red-700"
                }`}>
                  {s.text}
                </div>
              </div>
            </div>
          );
        })}

        {monitors.length === 0 && (
          <div className="rounded-xl border border-black/10 bg-white px-5 py-8 text-center text-sm text-black/45">
            No monitors configured.
          </div>
        )}
      </div>

      <div className="mt-10 text-center text-xs text-black/35">
        Powered by UptimeRobot · OneAI API Platform
      </div>
    </div>
  );
}

export default function StatusPage() {
  return (
    <main className="min-h-screen bg-[#f8f8f8]">
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center text-sm text-black/45">
            Loading status...
          </div>
        }
      >
        <StatusContent />
      </Suspense>
    </main>
  );
}
