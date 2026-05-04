"use client";

import React, { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

type TaskKey = "agent_plan" | "mission_os" | "waoc_chat" | "oneclaw_execute" | "market_decision";
type Mode = "cheap" | "balanced" | "fast" | "premium" | "auto";
type PlaygroundMode = "task" | "chat";

type Result = Record<string, any> | null;

const taskExamples: Record<TaskKey, { label: string; description: string; input: unknown }> = {
  agent_plan: {
    label: "Agent Plan",
    description: "Turn a goal into strategy, missions, actions, and reasoning.",
    input: {
      goal: "Create a simple launch plan for OneAI SaaS",
      brand: "OneAI SaaS",
      audience: "developers and AI builders",
      tone: "clear, practical, commercial",
    },
  },
  mission_os: {
    label: "Mission OS",
    description: "Generate a structured campaign mission with proof, review, rewards, and risk checks.",
    input: {
      goal: "Launch a WAOC builder campaign for OneAI SaaS",
      targetAudience: "builders, creators, founders",
      brand: "WAOC OneAI",
      lang: "en",
      missionType: "growth",
      difficulty: "easy",
    },
  },
  waoc_chat: {
    label: "WAOC Chat",
    description: "Community-aware chat reply for WAOC and related ecosystems.",
    input: {
      message: "What is OneAI and how can it help WAOC builders?",
      context: "community",
      lang: "en",
      recentMessages: "We are preparing builder missions. Need a simple explanation of OneAI.",
      threadMemory: {
        topic: "OneAI builder coordination",
        status: "explaining",
      },
      communityName: "WAOC",
    },
  },
  oneclaw_execute: {
    label: "OneClaw Execute",
    description: "Produce execution-ready action planning for OneClaw without executing inside OneAI.",
    input: {
      goal: "Create a safe execution checklist for publishing a OneAI launch update",
      target: "OneClaw",
      constraints: ["Do not execute directly", "Return structured actions", "Make every action verifiable"],
    },
  },
  market_decision: {
    label: "Market Decision",
    description: "Generate a structured market decision from context and constraints.",
    input: {
      asset: "BTC",
      timeframe: "24h",
      objective: "Decide whether to watch, enter, or avoid",
      riskTolerance: "medium",
      context: "Need a concise decision for a builder dashboard demo.",
    },
  },
};

const modes: Mode[] = ["cheap", "balanced", "fast", "premium", "auto"];

function asJson(value: unknown) {
  return JSON.stringify(value, null, 2);
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

  const details = String(result.details || result.error || "");
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
  const [type, setType] = useState<TaskKey>("agent_plan");
  const [mode, setMode] = useState<Mode>("cheap");
  const [provider, setProvider] = useState("");
  const [model, setModel] = useState("openai:gpt-5.2");
  const [maxCostUsd, setMaxCostUsd] = useState("0.03");
  const [input, setInput] = useState(asJson(taskExamples.agent_plan.input));
  const [chatInput, setChatInput] = useState(asJson({
    model: "openai:gpt-5.2",
    messages: [
      {
        role: "user",
        content: "Explain OneAI SaaS in one sentence.",
      },
    ],
    max_completion_tokens: 300,
  }));
  const [result, setResult] = useState<Result>(null);
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [parseError, setParseError] = useState("");

  const selectedTask = taskExamples[type];
  const tone = statusTone(result);
  const curlPreview = useMemo(() => {
    if (playgroundMode === "chat") {
      let parsed: unknown = {};
      try {
        parsed = JSON.parse(chatInput);
      } catch {
        parsed = "<invalid-json>";
      }

      return `curl -s https://oneai-saas-api-production.up.railway.app/v1/chat/completions \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -d '${JSON.stringify(parsed)}' | jq`;
    }

    let parsed: unknown = {};
    try {
      parsed = JSON.parse(input);
    } catch {
      parsed = "<invalid-json>";
    }
    return `curl -s https://oneai-saas-api-production.up.railway.app/v1/generate \\\n  -H "Content-Type: application/json" \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -d '${JSON.stringify({
    type,
    input: parsed,
    options: {
      debug: true,
      llm: {
        mode,
        ...(provider ? { provider } : {}),
        ...(model ? { model } : {}),
        maxCostUsd: Number(maxCostUsd || 0.03),
      },
    },
  })}' | jq`;
  }, [chatInput, input, maxCostUsd, mode, model, playgroundMode, provider, type]);

  function switchType(next: string) {
    const task = next as TaskKey;
    setType(task);
    setInput(asJson(taskExamples[task].input));
    setResult(null);
    setRaw("");
    setParseError("");
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
        setResult(res.ok ? { success: true, ...json } : { success: false, ...json, error: json?.error?.message || json?.error || `HTTP ${res.status}` });
        return;
      }

      const parsedInput = JSON.parse(input);
      const llm: Record<string, any> = {
        mode,
        maxCostUsd: Number(maxCostUsd || 0.03),
      };
      if (provider.trim()) llm.provider = provider.trim();
      if (model.trim()) llm.model = model.trim();

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type,
          input: parsedInput,
          options: { debug: true, llm },
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Console</Badge>
            <Badge>Playground</Badge>
            <span className="text-xs text-black/45">{playgroundMode === "task" ? "Structured generation tester" : "Model gateway tester"}</span>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-black">Generate Playground</h1>
          <p className="mt-1 text-sm text-black/55">Test OneAI tasks, standard chat completions, model routing, usage, and traces.</p>
        </div>
        <Button onClick={run} disabled={loading}>{loading ? "Running..." : "Run request"}</Button>
      </div>

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

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Request</CardTitle>
              <CardDescription>{playgroundMode === "task" ? selectedTask.description : "OpenAI-compatible chat completions through OneAI routing."}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {playgroundMode === "task" ? (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block">
                      <div className="mb-1 text-xs text-black/50">Task</div>
                      <Select value={type} onChange={(e) => switchType(e.target.value)}>
                        {Object.entries(taskExamples).map(([key, item]) => (
                          <option key={key} value={key}>{item.label}</option>
                        ))}
                      </Select>
                    </label>
                    <label className="block">
                      <div className="mb-1 text-xs text-black/50">Routing mode</div>
                      <Select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
                        {modes.map((item) => <option key={item} value={item}>{item}</option>)}
                      </Select>
                    </label>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="block">
                      <div className="mb-1 text-xs text-black/50">Provider override</div>
                      <Input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="openai / gemini / xai" className="border-black/10 bg-white text-black placeholder:text-black/35" />
                    </label>
                    <label className="block">
                      <div className="mb-1 text-xs text-black/50">Model override</div>
                      <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="gpt-5.2" className="border-black/10 bg-white text-black placeholder:text-black/35" />
                    </label>
                    <label className="block">
                      <div className="mb-1 text-xs text-black/50">Max cost USD</div>
                      <Input value={maxCostUsd} onChange={(e) => setMaxCostUsd(e.target.value)} placeholder="0.03" className="border-black/10 bg-white text-black placeholder:text-black/35" />
                    </label>
                  </div>

                  <label className="block">
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs text-black/50">
                      <span>Input JSON</span>
                      {parseError ? <span className="text-red-600">Invalid JSON: {parseError}</span> : null}
                    </div>
                    <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-[300px] font-mono text-xs" />
                  </label>
                </>
              ) : (
                <label className="block">
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs text-black/50">
                    <span>Chat completion JSON</span>
                    {parseError ? <span className="text-red-600">Invalid JSON: {parseError}</span> : null}
                  </div>
                  <Textarea value={chatInput} onChange={(e) => setChatInput(e.target.value)} className="min-h-[410px] font-mono text-xs" />
                </label>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>cURL Preview</CardTitle>
              <CardDescription>Same payload for external API callers.</CardDescription>
            </CardHeader>
            <CardContent>
              <PrettyJson value={curlPreview} />
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
                <span className={[
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  tone === "ok" ? "bg-green-100 text-green-800" : tone === "idle" ? "bg-black/5 text-black/55" : "bg-red-100 text-red-800",
                ].join(" ")}>{result ? (result.success ? "Success" : result.code || "Error") : "Idle"}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <Stat label="Request ID" value={result?.requestId || result?.id ? <code>{String(result.requestId || result.id).slice(0, 12)}</code> : "-"} />
                <Stat label="Attempts" value={result?.attempts ?? "-"} />
                <Stat label="Latency" value={result?.latencyMs || result?.oneai?.trace?.latencyMs ? `${result.latencyMs || result.oneai.trace.latencyMs}ms` : "-"} />
                <Stat label="Cost" value={result?.usageTotal?.estimatedCostUSD || result?.usage?.estimated_cost_usd ? `$${Number(result.usageTotal?.estimatedCostUSD || result.usage?.estimated_cost_usd).toFixed(6)}` : "-"} />
              </div>

              {result?.usage ? (
                <div className="grid gap-3 md:grid-cols-3">
                  <Stat label="Provider" value={result.usage.provider || result.provider || "-"} />
                  <Stat label="Model" value={<code className="break-all">{result.usage.model || result.model || "-"}</code>} />
                  <Stat label="Tokens" value={result.usage.totalTokens ?? result.usage.total_tokens ?? "-"} />
                </div>
              ) : null}

              {(result?.llmTrace?.attempts?.length || result?.oneai?.trace?.attempts?.length) ? (
                <div className="rounded-lg border border-black/10 bg-white p-3">
                  <div className="mb-2 text-xs font-semibold text-black/55">LLM Trace</div>
                  <div className="space-y-2">
                    {(result.llmTrace?.attempts || result.oneai?.trace?.attempts || []).map((attempt: any, index: number) => (
                      <div key={`${attempt.provider}-${attempt.model}-${index}`} className="flex flex-wrap items-center gap-2 text-xs text-black/65">
                        <span className="rounded-full bg-black/5 px-2 py-0.5">#{index + 1}</span>
                        <code>{attempt.provider}:{attempt.model}</code>
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
