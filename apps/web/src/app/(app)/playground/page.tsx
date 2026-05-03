// apps/web/src/app/(app)/playground/page.tsx
"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

const examples: Record<string, unknown> = {
  agent_plan: {
    goal: "Create a simple launch plan for OneAI API",
  },
  mission_os: {
    goal: "Launch a WAOC builder campaign for OneAI API",
    audience: "builders, creators, founders",
    brand: "WAOC OneAI",
    tone: "clear, practical, execution-focused",
  },
  waoc_chat: {
    message: "What is OneAI and how can it help WAOC builders?",
    context: "community",
    lang: "en",
    recentMessages:
      "We are preparing builder missions. Need a simple explanation of OneAI.",
    communityName: "WAOC",
  },
};

export default function PlaygroundPage() {
  const [type, setType] = useState("agent_plan");
  const [mode, setMode] = useState("cheap");
  const [input, setInput] = useState(JSON.stringify(examples.agent_plan, null, 2));
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  function switchType(next: string) {
    setType(next);
    setInput(JSON.stringify(examples[next] || {}, null, 2));
  }

  async function run() {
    setLoading(true);
    setResult("");
    try {
      const parsedInput = JSON.parse(input);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type,
          input: parsedInput,
          options: { debug: true, llm: { mode, maxCostUsd: 0.03 } },
        }),
      });
      const json = await res.json();
      setResult(JSON.stringify(json, null, 2));
    } catch (e: any) {
      setResult(JSON.stringify({ success: false, error: e?.message }, null, 2));
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
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-black">
            Generate Playground
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Test existing OneAI tasks without touching external callers.
          </p>
        </div>
        <Button onClick={run} disabled={loading}>
          {loading ? "Running..." : "Run request"}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <div className="mb-1 text-xs text-black/50">Task</div>
              <Select value={type} onChange={(e) => switchType(e.target.value)}>
                <option value="agent_plan">agent_plan</option>
                <option value="mission_os">mission_os</option>
                <option value="waoc_chat">waoc_chat</option>
              </Select>
            </label>
            <label className="block">
              <div className="mb-1 text-xs text-black/50">Routing mode</div>
              <Select value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="cheap">cheap</option>
                <option value="balanced">balanced</option>
                <option value="fast">fast</option>
                <option value="premium">premium</option>
                <option value="auto">auto</option>
              </Select>
            </label>
          </div>

          <label className="block">
            <div className="mb-1 text-xs text-black/50">Input JSON</div>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[360px] font-mono text-xs"
            />
          </label>
        </div>

        <div>
          <div className="mb-1 text-xs text-black/50">Response</div>
          <pre className="min-h-[430px] overflow-auto rounded-lg border border-black/10 bg-[#0f1115] p-4 text-xs leading-relaxed text-white/75">
            <code>{result || "Run a request to see structured output, usage, and llmTrace."}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
