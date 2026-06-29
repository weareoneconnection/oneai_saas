import Link from "next/link";

async function getApiStatus(): Promise<{ up: boolean; uptime: string }> {
  const apiKey = process.env.UPTIMEROBOT_API_KEY;
  if (!apiKey) return { up: true, uptime: "" };
  try {
    const res = await fetch("https://api.uptimerobot.com/v2/getMonitors", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ api_key: apiKey, format: "json", custom_uptime_ratios: "30" }),
      next: { revalidate: 300 },
    });
    const json = await res.json();
    const monitor = json?.monitors?.[0];
    if (!monitor) return { up: true, uptime: "" };
    return {
      up: monitor.status === 2,
      uptime: monitor.custom_uptime_ratio ? `${parseFloat(monitor.custom_uptime_ratio).toFixed(2)}%` : "",
    };
  } catch {
    return { up: true, uptime: "" };
  }
}

export default async function SiteFooter() {
  const { up, uptime } = await getApiStatus();

  return (
    <footer className="border-t border-black/10 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row">
        <p className="text-xs text-black/40">© {new Date().getFullYear()} OneAI. All rights reserved.</p>
        <div className="flex items-center gap-6 text-xs text-black/40">
          <Link href="/pricing" className="hover:text-black/70">Pricing</Link>
          <Link href="/docs" className="hover:text-black/70">Docs</Link>
          <Link
            href="/status"
            className="flex items-center gap-1.5 hover:text-black/70"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${up ? "bg-emerald-500" : "bg-red-500"}`} />
            <span>{up ? "All Systems Operational" : "Service Disruption"}</span>
            {uptime && <span className="text-black/30">· {uptime}</span>}
          </Link>
        </div>
      </div>
    </footer>
  );
}
