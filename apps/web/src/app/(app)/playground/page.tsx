"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

type TaskKey = string;
type Mode = "cheap" | "balanced" | "fast" | "premium" | "auto";
type PlaygroundMode = "task" | "chat";
type Result = Record<string, any> | null;

type PlaygroundPreset = {
  id: string;
  title: string;
  task: string;
  tier: "Free" | "Pro" | "Team";
  mode: Mode;
  provider: string;
  model: string;
  maxCostUsd: string;
  desc: string;
  input: unknown;
};

type TaskOption = {
  task: string;
  type?: string;
  id?: string;
  displayName?: string;
  name?: string;
  description?: string;
  category?: string;
  tier?: string;
  maturity?: string;
  exampleInput?: unknown;
};

const fallbackTaskExamples: Record<string, { label: string; description: string; input: unknown; tier?: string }> = {
  business_strategy: {
    label: "Business Strategy",
    description: "Turn a business goal into practical strategy, milestones, risks, next actions, and success metrics.",
    input: {
      goal: "Launch a B2B AI API product in 30 days",
      audience: "SaaS builders and small teams",
      constraints: ["Keep it practical", "Prioritize fast validation", "Include risks"],
    },
    tier: "free",
  },
  content_engine: {
    label: "Content Engine",
    description: "Generate hooks, social posts, CTAs, hashtags, and content variants for product launches.",
    input: {
      topic: "Announce OneAI Task Intelligence API",
      audience: "developers and SaaS builders",
      tone: "clear and practical",
      brand: "OneAI",
    },
    tier: "free",
  },
  market_research: {
    label: "Market Research",
    description: "Create a structured market brief from a product, audience, competitors, context, and constraints.",
    input: {
      product: "Unified model gateway plus Task Intelligence API",
      audience: "SaaS builders",
      competitors: ["generic model gateways", "AI workflow tools"],
      objective: "Find a practical launch wedge",
    },
    tier: "pro",
  },
  support_brain: {
    label: "Support Brain",
    description: "Generate customer support or community replies with intent, confidence, suggested action, and memory update.",
    input: {
      message: "What is OneAI and how can my product use it?",
      context: "customer support",
      customer: "new SaaS builder",
      recentMessages: "The user is asking for a simple explanation and next step.",
    },
    tier: "pro",
  },
  decision_intelligence: {
    label: "Decision Intelligence",
    description: "Turn context and options into a recommendation with rationale, confidence, tradeoffs, risks, and next steps.",
    input: {
      question: "Should we launch publicly or run a private beta first?",
      options: ["public launch", "private beta"],
      context: "Small team, limited support capacity, strong early interest.",
      riskTolerance: "medium",
    },
    tier: "pro",
  },
  custom_task_designer: {
    label: "Custom Task Designer",
    description: "Design a custom Task Intelligence specification for a customer's workflow.",
    input: {
      business: "AI customer support SaaS",
      workflow: "Classify tickets and draft replies with escalation rules",
      users: "support agents and customer success managers",
    },
    tier: "team",
  },
};

const modes: Mode[] = ["cheap", "balanced", "fast", "premium", "auto"];

const playgroundPresets: PlaygroundPreset[] = [
  {
    id: "free-strategy",
    title: "Launch Strategy",
    task: "business_strategy",
    tier: "Free",
    mode: "cheap",
    provider: "openai",
    model: "gpt-4o-mini",
    maxCostUsd: "0.03",
    desc: "Free task for validating OneAI structured strategy output.",
    input: fallbackTaskExamples.business_strategy.input,
  },
  {
    id: "free-content",
    title: "Content Engine",
    task: "content_engine",
    tier: "Free",
    mode: "cheap",
    provider: "openai",
    model: "gpt-4o-mini",
    maxCostUsd: "0.03",
    desc: "Free task for launch copy, hooks, CTAs, and post variants.",
    input: fallbackTaskExamples.content_engine.input,
  },
  {
    id: "pro-market",
    title: "Market Brief",
    task: "market_research",
    tier: "Pro",
    mode: "balanced",
    provider: "openai",
    model: "gpt-4o-mini",
    maxCostUsd: "0.05",
    desc: "Pro task for market positioning and competitor synthesis.",
    input: fallbackTaskExamples.market_research.input,
  },
  {
    id: "pro-support",
    title: "Support Brain",
    task: "support_brain",
    tier: "Pro",
    mode: "balanced",
    provider: "openai",
    model: "gpt-4o-mini",
    maxCostUsd: "0.05",
    desc: "Pro task for customer replies and support memory updates.",
    input: fallbackTaskExamples.support_brain.input,
  },
  {
    id: "pro-decision",
    title: "Decision Intelligence",
    task: "decision_intelligence",
    tier: "Pro",
    mode: "balanced",
    provider: "openai",
    model: "gpt-4o-mini",
    maxCostUsd: "0.05",
    desc: "Pro task for recommendations, tradeoffs, risk, and next steps.",
    input: fallbackTaskExamples.decision_intelligence.input,
  },
  {
    id: "team-custom",
    title: "Custom Task",
    task: "custom_task_designer",
    tier: "Team",
    mode: "balanced",
    provider: "openai",
    model: "gpt-4o-mini",
    maxCostUsd: "0.08",
    desc: "Team task for designing customer-specific intelligence workflows.",
    input: fallbackTaskExamples.custom_task_designer.input,
  },
];

const DEFAULT_TASK = "business_strategy";
const DEFAULT_MODE: Mode = "balanced";
const DEFAULT_PROVIDER = "openai";
const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_MAX_COST_USD = "0.03";

function asJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function asPythonLiteral(value: unknown) {
  return JSON.stringify(value, null, 4)
    .replace(/\btrue\b/g, "True")
    .replace(/\bfalse\b/g, "False")
    .replace(/\bnull\b/g, "None");
}

function extractTaskRows(json: any): TaskOption[] {
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.data?.tasks)) return json.data.tasks;
  if (Array.isArray(json?.tasks)) return json.tasks;
  return [];
}

function taskId(item: TaskOption) {
  return String(item.task || item.type || item.id || "").trim();
}

function taskLabel(item: TaskOption) {
  return String(item.displayName || item.name || taskId(item));
}

function fallbackTaskMeta(type: string) {
  return (
    fallbackTaskExamples[type] || {
      label: type,
      description: `${type} workflow.`,
      input: {
        goal: "Launch a B2B AI API product in 30 days",
        audience: "SaaS builders and small teams",
        constraints: ["Keep it practical", "Prioritize fast validation"],
      },
    }
  );
}

function statusTone(result: Result) {
  if (!result) return "idle";
  if (result.success) return "ok";
  if (result.code === "UPSTREAM_CONFIG_ERROR" || result.code === "UPSTREAM_UNAVAILABLE") return "provider";
  if (result.code === "INVALID_REQUEST") return "input";
  if (result.code === "PLAN_LIMIT_EXCEEDED") return "plan";
  return "error";
}

function explain(result: Result) {
  if (!result) return "Ready to send a request.";
  if (result.success) return "Request completed successfully.";

  const details = String(result.details || result.error || result.message || "");
  if (result.code === "UPSTREAM_CONFIG_ERROR") return `Provider configuration issue: ${details}`;
  if (result.code === "PLAN_LIMIT_EXCEEDED") return `Plan or policy blocked this request: ${details}`;
  if (result.code === "INVALID_REQUEST") return `Input or schema issue: ${details}`;
  if (details.includes("schema") || details.includes("required")) return `Structured output validation failed: ${details}`;
  return details || result.error || "Request failed.";
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-3">
      <div className="text-xs text-black/45">{label}</div>
      <div className="mt-1 text-sm font-semibold text-black">{value}</div>
    </div>
  );
}

function PrettyJson({ value }: { value: unknown }) {
  return (
    <pre className="max-h-[520px] overflow-auto rounded-lg border border-black/10 bg-[#0f1115] p-4 text-xs leading-relaxed text-white/80">
      <code>{typeof value === "string" ? value : asJson(value)}</code>
    </pre>
  );
}

export default function PlaygroundPage() {
  const [playgroundMode, setPlaygroundMode] = useState<PlaygroundMode>("task");
  const [tasks, setTasks] = useState<TaskOption[]>([]);
  const [type, setType] = useState<TaskKey>(DEFAULT_TASK);

  const [mode, setMode] = useState<Mode>(DEFAULT_MODE);
  const [provider, setProvider] = useState(DEFAULT_PROVIDER);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [maxCostUsd, setMaxCostUsd] = useState(DEFAULT_MAX_COST_USD);

  const [input, setInput] = useState(asJson(fallbackTaskExamples.business_strategy.input));
  const [chatInput, setChatInput] = useState(
    asJson({
      model: `${DEFAULT_PROVIDER}:${DEFAULT_MODEL}`,
      messages: [
        {
          role: "user",
          content: "Explain OneAI SaaS in one sentence.",
        },
      ],
      max_completion_tokens: 300,
    })
  );

  const [result, setResult] = useState<Result>(null);
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [parseError, setParseError] = useState("");
  const [taskLoadWarning, setTaskLoadWarning] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadTasks() {
      try {
        const res = await fetch("/api/tasks", {
          cache: "no-store",
          credentials: "include",
        });

        const json = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(json?.error || `HTTP ${res.status}`);
        }

        const rows = extractTaskRows(json).filter((item) => taskId(item));

        if (!cancelled && rows.length > 0) {
          setTasks(rows);

          const hasCurrent = rows.some((item) => taskId(item) === type);
          if (!hasCurrent) {
            const first = taskId(rows[0]);
            setType(first);
            setInput(asJson(rows[0].exampleInput || fallbackTaskMeta(first).input));
          }
        }
      } catch (error: any) {
        if (!cancelled) {
          setTaskLoadWarning(error?.message || "Could not load live task registry; using local examples.");
        }
      }
    }

    loadTasks();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const taskOptions = useMemo(() => {
    if (tasks.length > 0) return tasks;

    return Object.entries(fallbackTaskExamples).map(([key, item]) => ({
      task: key,
      displayName: item.label,
      description: item.description,
      exampleInput: item.input,
      tier: item.tier || "free",
      maturity: "STABLE",
    }));
  }, [tasks]);

  const selectedTask = useMemo(() => {
    const live = taskOptions.find((item) => taskId(item) === type);
    if (live) {
      return {
        label: taskLabel(live),
        description: live.description || fallbackTaskMeta(type).description,
        input: live.exampleInput || fallbackTaskMeta(type).input,
        tier: live.tier || "free",
        maturity: live.maturity || "unknown",
      };
    }

    const fallback = fallbackTaskMeta(type);
    return {
      label: fallback.label,
      description: fallback.description,
      input: fallback.input,
      tier: fallback.tier || "free",
      maturity: "local",
    };
  }, [taskOptions, type]);

  const tone = statusTone(result);

  const taskPayload = useMemo(() => {
    let parsed: unknown = {};
    try {
      parsed = JSON.parse(input);
    } catch {
      parsed = "<invalid-json>";
    }

    return {
      type,
      input: parsed,
      options: {
        debug: true,
        llm: {
          mode,
          ...(provider.trim() ? { provider: provider.trim() } : {}),
          ...(model.trim() ? { model: model.trim() } : {}),
          maxCostUsd: Number(maxCostUsd || DEFAULT_MAX_COST_USD),
        },
      },
    };
  }, [input, maxCostUsd, mode, model, provider, type]);

  const chatPayload = useMemo(() => {
    try {
      return JSON.parse(chatInput);
    } catch {
      return "<invalid-json>";
    }
  }, [chatInput]);

  const curlPreview = useMemo(() => {
    if (playgroundMode === "chat") {
      return `curl -s https://oneai-saas-api-production.up.railway.app/v1/chat/completions \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -d '${JSON.stringify(chatPayload)}' | jq`;
    }

    return `curl -s https://oneai-saas-api-production.up.railway.app/v1/generate \\\n  -H "Content-Type: application/json" \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -d '${JSON.stringify(taskPayload)}' | jq`;
  }, [chatPayload, playgroundMode, taskPayload]);

  const nodePreview = useMemo(() => {
    const endpoint =
      playgroundMode === "chat"
        ? "https://oneai-saas-api-production.up.railway.app/v1/chat/completions"
        : "https://oneai-saas-api-production.up.railway.app/v1/generate";
    const payload = playgroundMode === "chat" ? chatPayload : taskPayload;
    const authHeader =
      playgroundMode === "chat"
        ? `"Authorization": \`Bearer \${process.env.ONEAI_API_KEY}\`,`
        : `"x-api-key": process.env.ONEAI_API_KEY,`;

    return `const res = await fetch("${endpoint}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ${authHeader}
  },
  body: JSON.stringify(${JSON.stringify(payload, null, 2)}),
});

const data = await res.json();
if (!res.ok || data.success === false) {
  throw new Error(data.error || "OneAI request failed");
}

console.log(data);`;
  }, [chatPayload, playgroundMode, taskPayload]);

  const pythonPreview = useMemo(() => {
    const endpoint =
      playgroundMode === "chat"
        ? "https://oneai-saas-api-production.up.railway.app/v1/chat/completions"
        : "https://oneai-saas-api-production.up.railway.app/v1/generate";
    const payload = playgroundMode === "chat" ? chatPayload : taskPayload;
    const authHeader =
      playgroundMode === "chat"
        ? `"Authorization": f"Bearer {os.environ['ONEAI_API_KEY']}",`
        : `"x-api-key": os.environ["ONEAI_API_KEY"],`;

    return `import os
import requests

res = requests.post(
    "${endpoint}",
    headers={
        "Content-Type": "application/json",
        ${authHeader}
    },
    json=${asPythonLiteral(payload)}
)

data = res.json()
if not res.ok or data.get("success") is False:
    raise RuntimeError(data.get("error", "OneAI request failed"))

print(data)`;
  }, [chatPayload, playgroundMode, taskPayload]);

  const routingWarning =
    playgroundMode === "task" && ["cheap", "auto"].includes(mode) && (!provider.trim() || !model.trim())
      ? "Cheap/auto routing without provider and model can select an unavailable provider. Use openai + gpt-4.1-mini for reliable testing."
      : "";

  function switchType(next: string) {
    const task = next as TaskKey;
    const live = taskOptions.find((item) => taskId(item) === task);
    const meta = live
      ? {
          input: live.exampleInput || fallbackTaskMeta(task).input,
        }
      : fallbackTaskMeta(task);

    setType(task);
    setInput(asJson(meta.input));
    setResult(null);
    setRaw("");
    setParseError("");
  }

  function applyPreset(preset: PlaygroundPreset) {
    setPlaygroundMode("task");
    setType(preset.task);
    setMode(preset.mode);
    setProvider(preset.provider);
    setModel(preset.model);
    setMaxCostUsd(preset.maxCostUsd);
    setInput(asJson(preset.input));
    setResult(null);
    setRaw("");
    setParseError("");
    setToast(`${preset.title} preset loaded.`);
  }

  async function copyText(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setToast(`${label} copied.`);
    } catch {
      setToast(`Could not copy ${label.toLowerCase()}.`);
    }
  }

  async function run() {
    setLoading(true);
    setResult(null);
    setRaw("");
    setParseError("");

    try {
      if (playgroundMode === "chat") {
        const parsedChat = JSON.parse(chatInput);

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(parsedChat),
        });

        const text = await res.text();
        setRaw(text);

        const json = text ? JSON.parse(text) : null;
        setResult(
          res.ok
            ? { success: true, ...json }
            : {
                success: false,
                ...json,
                error: json?.error?.message || json?.error || `HTTP ${res.status}`,
              }
        );

        return;
      }

      const parsedInput = JSON.parse(input);

      const options: Record<string, any> = {
        debug: true,
        llm: {
          mode,
          maxCostUsd: Number(maxCostUsd || DEFAULT_MAX_COST_USD),
        },
      };

      if (provider.trim()) options.llm.provider = provider.trim();
      if (model.trim()) options.llm.model = model.trim();

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type,
          input: parsedInput,
          options,
        }),
      });

      const text = await res.text();
      setRaw(text);

      const json = text ? JSON.parse(text) : null;
      setResult(json || { success: false, error: "empty_response" });
    } catch (e: any) {
      const message = e?.message || "Failed to run request";
      if (message.includes("JSON")) setParseError(message);
      setResult({ success: false, error: message, code: "PLAYGROUND_ERROR" });
      setRaw(asJson({ success: false, error: message }));
    } finally {
      setLoading(false);
    }
  }

  const usageCost =
    result?.usageTotal?.estimatedCostUSD ??
    result?.usageTotal?.estimatedCostUsd ??
    result?.usage?.estimatedCostUSD ??
    result?.usage?.estimatedCostUsd ??
    result?.usage?.estimated_cost_usd;

  const usageTokens =
    result?.usage?.totalTokens ??
    result?.usage?.total_tokens ??
    result?.usageTotal?.totalTokens ??
    result?.usageTotal?.total_tokens;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Console</Badge>
            <Badge>Playground</Badge>
            <span className="text-xs text-black/45">
              {playgroundMode === "task" ? "Structured generation tester" : "Model gateway tester"}
            </span>
            {taskLoadWarning ? <span className="text-xs text-amber-700">{taskLoadWarning}</span> : null}
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-black">Generate Playground</h1>
          <p className="mt-1 text-sm text-black/55">
            Test OneAI tasks, standard chat completions, model routing, usage, and traces.
          </p>
        </div>

        <Button onClick={run} disabled={loading}>
          {loading ? "Running..." : "Run request"}
        </Button>
      </div>

      {toast ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          {toast}
        </div>
      ) : null}

      <div className="inline-flex rounded-lg border border-black/10 bg-black/[0.03] p-1">
        <button
          type="button"
          onClick={() => {
            setPlaygroundMode("task");
            setResult(null);
            setRaw("");
            setParseError("");
          }}
          className={["rounded-md px-3 py-1.5 text-sm font-semibold", playgroundMode === "task" ? "bg-black text-white" : "text-black/60"].join(" ")}
        >
          Task API
        </button>

        <button
          type="button"
          onClick={() => {
            setPlaygroundMode("chat");
            setResult(null);
            setRaw("");
            setParseError("");
          }}
          className={["rounded-md px-3 py-1.5 text-sm font-semibold", playgroundMode === "chat" ? "bg-black text-white" : "text-black/60"].join(" ")}
        >
          Chat API
        </button>
      </div>

      {routingWarning ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {routingWarning}
        </div>
      ) : null}

      {playgroundMode === "task" ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle>Commercial presets</CardTitle>
                <CardDescription>
                  Load a real OneAI business task with recommended mode, model, input JSON, and cost guard.
                </CardDescription>
              </div>
              <div className="text-xs font-semibold text-black/45">
                Free tasks can run immediately. Pro/Team presets show paid-plan behavior.
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {playgroundPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={[
                    "rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-black/25 hover:bg-black/[0.02]",
                    type === preset.task ? "border-black bg-black/[0.03]" : "border-black/10 bg-white",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-extrabold text-black">{preset.title}</div>
                      <code className="mt-2 block text-xs font-semibold text-black/55">{preset.task}</code>
                    </div>
                    <span
                      className={[
                        "rounded-full px-2.5 py-1 text-[11px] font-bold",
                        preset.tier === "Free"
                          ? "bg-green-100 text-green-800"
                          : preset.tier === "Pro"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800",
                      ].join(" ")}
                    >
                      {preset.tier}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-black/60">{preset.desc}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-black/50">
                    <span className="rounded-lg bg-black/[0.05] px-2 py-1">{preset.mode}</span>
                    <span className="rounded-lg bg-black/[0.05] px-2 py-1">{preset.provider}</span>
                    <span className="rounded-lg bg-black/[0.05] px-2 py-1">{preset.model}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Request</CardTitle>
              <CardDescription>
                {playgroundMode === "task" ? selectedTask.description : "OpenAI-compatible chat completions through OneAI routing."}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {playgroundMode === "task" ? (
                <>
                  <div className="grid gap-3 md:grid-cols-3">
                    <Stat label="Selected task" value={<code>{type}</code>} />
                    <Stat label="Tier" value={selectedTask.tier || "-"} />
                    <Stat label="Maturity" value={selectedTask.maturity || "-"} />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block">
                      <div className="mb-1 text-xs text-black/50">Task</div>
                      <Select value={type} onChange={(e) => switchType(e.target.value)}>
                        {taskOptions.map((item) => {
                          const id = taskId(item);
                          return (
                            <option key={id} value={id}>
                              {taskLabel(item)}
                            </option>
                          );
                        })}
                      </Select>
                    </label>

                    <label className="block">
                      <div className="mb-1 text-xs text-black/50">Routing mode</div>
                      <Select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
                        {modes.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </Select>
                    </label>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="block">
                      <div className="mb-1 text-xs text-black/50">Provider override</div>
                      <Input
                        value={provider}
                        onChange={(e) => setProvider(e.target.value)}
                        placeholder="openai"
                        className="border-black/10 bg-white text-black placeholder:text-black/35"
                      />
                    </label>

                    <label className="block">
                      <div className="mb-1 text-xs text-black/50">Model override</div>
                      <Input
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="gpt-4.1-mini"
                        className="border-black/10 bg-white text-black placeholder:text-black/35"
                      />
                    </label>

                    <label className="block">
                      <div className="mb-1 text-xs text-black/50">Max cost USD</div>
                      <Input
                        value={maxCostUsd}
                        onChange={(e) => setMaxCostUsd(e.target.value)}
                        placeholder="0.03"
                        className="border-black/10 bg-white text-black placeholder:text-black/35"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs text-black/50">
                      <span>Input JSON</span>
                      <span className="flex items-center gap-3">
                        {parseError ? <span className="text-red-600">Invalid JSON: {parseError}</span> : null}
                        <button
                          type="button"
                          onClick={() => copyText("Input JSON", input)}
                          className="font-semibold text-black hover:underline"
                        >
                          Copy JSON
                        </button>
                      </span>
                    </div>
                    <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-[300px] font-mono text-xs" />
                  </label>
                </>
              ) : (
                <label className="block">
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs text-black/50">
                    <span>Chat completion JSON</span>
                    <span className="flex items-center gap-3">
                      {parseError ? <span className="text-red-600">Invalid JSON: {parseError}</span> : null}
                      <button
                        type="button"
                        onClick={() => copyText("Chat JSON", chatInput)}
                        className="font-semibold text-black hover:underline"
                      >
                        Copy JSON
                      </button>
                    </span>
                  </div>
                  <Textarea value={chatInput} onChange={(e) => setChatInput(e.target.value)} className="min-h-[410px] font-mono text-xs" />
                </label>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>cURL Preview</CardTitle>
                  <CardDescription>Same payload for external API callers.</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => copyText("cURL", curlPreview)}
                >
                  Copy cURL
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <PrettyJson value={curlPreview} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>Production Code</CardTitle>
                  <CardDescription>Copy server-side examples after your Playground request works.</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={() => copyText("Node.js", nodePreview)}>
                    Copy Node.js
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => copyText("Python", pythonPreview)}>
                    Copy Python
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 xl:grid-cols-2">
                <div>
                  <div className="mb-2 text-xs font-semibold text-black/50">Node.js</div>
                  <PrettyJson value={nodePreview} />
                </div>
                <div>
                  <div className="mb-2 text-xs font-semibold text-black/50">Python</div>
                  <PrettyJson value={pythonPreview} />
                </div>
              </div>
              <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-900">
                Keep <code>ONEAI_API_KEY</code> on the server. Do not expose it in browser or mobile client code.
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>Response</CardTitle>
                  <CardDescription>{explain(result)}</CardDescription>
                </div>

                <span
                  className={[
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    tone === "ok"
                      ? "bg-green-100 text-green-800"
                      : tone === "idle"
                        ? "bg-black/5 text-black/55"
                        : "bg-red-100 text-red-800",
                  ].join(" ")}
                >
                  {result ? (result.success ? "Success" : result.code || "Error") : "Idle"}
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <Stat label="Request ID" value={result?.requestId || result?.id ? <code>{String(result.requestId || result.id).slice(0, 12)}</code> : "-"} />
                <Stat label="Attempts" value={result?.attempts ?? "-"} />
                <Stat label="Latency" value={result?.latencyMs || result?.oneai?.trace?.latencyMs ? `${result.latencyMs || result.oneai.trace.latencyMs}ms` : "-"} />
                <Stat label="Cost" value={usageCost ? `$${Number(usageCost).toFixed(6)}` : "-"} />
              </div>

              {result?.usage ? (
                <div className="grid gap-3 md:grid-cols-3">
                  <Stat label="Provider" value={result.usage.provider || result.provider || "-"} />
                  <Stat label="Model" value={<code className="break-all">{result.usage.model || result.model || "-"}</code>} />
                  <Stat label="Tokens" value={usageTokens ?? "-"} />
                </div>
              ) : null}

              {(result?.llmTrace?.attempts?.length || result?.oneai?.trace?.attempts?.length) ? (
                <div className="rounded-lg border border-black/10 bg-white p-3">
                  <div className="mb-2 text-xs font-semibold text-black/55">LLM Trace</div>
                  <div className="space-y-2">
                    {(result.llmTrace?.attempts || result.oneai?.trace?.attempts || []).map((attempt: any, index: number) => (
                      <div key={`${attempt.provider}-${attempt.model}-${index}`} className="flex flex-wrap items-center gap-2 text-xs text-black/65">
                        <span className="rounded-full bg-black/5 px-2 py-0.5">#{index + 1}</span>
                        <code>
                          {attempt.provider}:{attempt.model}
                        </code>
                        <span>{attempt.ok ? "ok" : "failed"}</span>
                        <span>{attempt.latencyMs}ms</span>
                        {attempt.error ? <span className="text-red-600">{attempt.error}</span> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <PrettyJson value={result || raw || "Run a request to see structured output, usage, and llmTrace."} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
