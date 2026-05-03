import type { LLMOverrides, LLMRoutingMode } from "./types.js";

const PREMIUM_TASKS = new Set([
  "market_decision",
  "onefield_intelligence",
]);

const BALANCED_TASKS = new Set([
  "agent_plan",
  "market_analysis",
  "market_intelligence",
  "oneclaw_execute",
  "mission_os",
  "waoc_brain",
]);

const CHEAP_TASKS = new Set([
  "tweet",
  "lite_tweet",
  "lite_thread",
  "lite_reply",
  "lite_cta",
  "lite_viral_hook",
  "daily_vibe",
]);

function roughCharLength(value: unknown): number {
  try {
    return JSON.stringify(value ?? "").length;
  } catch {
    return String(value ?? "").length;
  }
}

export function inferRoutingMode(params: {
  task: string;
  input: unknown;
  overrides?: LLMOverrides;
}): LLMRoutingMode | undefined {
  if (params.overrides?.model || params.overrides?.provider) return undefined;

  const explicit = params.overrides?.mode;
  const shouldInfer =
    explicit === "auto" || process.env.ONEAI_LLM_AUTO_MODE === "1";

  if (!shouldInfer) return explicit;

  const chars = roughCharLength(params.input);

  if (chars > 12000) return "premium";
  if (chars > 5000) return "balanced";
  if (PREMIUM_TASKS.has(params.task)) return "premium";
  if (BALANCED_TASKS.has(params.task)) return "balanced";
  if (CHEAP_TASKS.has(params.task)) return "cheap";

  return "cheap";
}

export function applyTaskDifficultyRouting(params: {
  task: string;
  input: unknown;
  overrides?: LLMOverrides;
}): LLMOverrides | undefined {
  const mode = inferRoutingMode(params);
  if (!mode || mode === params.overrides?.mode) return params.overrides;

  return {
    ...(params.overrides ?? {}),
    mode,
  };
}
