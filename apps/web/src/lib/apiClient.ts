// apps/web/src/lib/apiClient.ts

/**
 * OneAI OS – Web API Client (v4, OS-ready)
 * ✅ Supports:
 * - x-api-key auth (dev)
 * - HTML/non-JSON responses (wrong route / fallback)
 * - Unified error messages (with debug payload)
 * - /v1/generate task-runner protocol: { type, input, options }
 *
 * ✅ Fixes included:
 * - Studio Lite workflows supported: viral_hook / controversial_take / trend_hijack / scarcity_launch / build_public / offer_landing
 * - Studio payload input is normalized (topic/context/extras/details/rewards/message)
 * - safeFetchJSON throws rich errors with {status, url, raw, json, details}
 * - Treats { success:false } as error (so UI can see real error content)
 */

export type StudioMode = "tweet" | "mission" | "command" | "thread";
export type Lang = "en" | "zh";

export type OutputItem = { title?: string; content: string };

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

/** ---------------------------------------
 * Helpers
 * ------------------------------------- */

function extractLink(s: string) {
  const m = (s || "").match(/https?:\/\/\S+/);
  return m ? m[0] : "";
}

function safeTrim(v: unknown) {
  return String(v ?? "").trim();
}

function normalizeLang(v: unknown, fallback: Lang = "en"): Lang {
  const s = safeTrim(v).toLowerCase();
  return s === "zh" ? "zh" : fallback;
}

/**
 * Fetch JSON with robust diagnostics.
 * - Attaches { status, url, raw, json, details } to thrown errors
 * - Detects HTML fallbacks (wrong route/proxy)
 * - Treats API { success:false } as failure
 */
async function safeFetchJSON(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  const contentType = res.headers.get("content-type") || "";
  const raw = await res.text();

  // ❌ If API returns HTML -> wrong route / proxy / fallback
  if (
    contentType.includes("text/html") ||
    raw.trim().startsWith("<!DOCTYPE html") ||
    raw.trim().startsWith("<html")
  ) {
    const err = new Error(
      `API returned HTML instead of JSON. URL: ${url} (check NEXT_PUBLIC_API_BASE_URL)`
    );
    (err as any).status = res.status;
    (err as any).url = url;
    (err as any).raw = raw.slice(0, 1200);
    throw err;
  }

  // ❌ Non JSON
  if (!contentType.includes("application/json")) {
    const err = new Error(
      `API returned non-JSON. URL: ${url} Content-Type: ${contentType}`
    );
    (err as any).status = res.status;
    (err as any).url = url;
    (err as any).raw = raw.slice(0, 1200);
    throw err;
  }

  let data: any = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    const err = new Error(`API JSON parse failed. URL: ${url}`);
    (err as any).status = res.status;
    (err as any).url = url;
    (err as any).raw = raw.slice(0, 1200);
    throw err;
  }

  // ❌ HTTP fail
  if (!res.ok) {
    const msg = data?.error || data?.message || `Request failed: ${res.status}`;
    const err = new Error(msg);
    (err as any).status = res.status;
    (err as any).url = url;
    (err as any).json = data;
    (err as any).details = data?.details ?? data?.error?.details ?? null; // ✅ PATCH
    (err as any).raw = raw.slice(0, 1200);
    throw err;
  }

  // ❌ API-level failure: { success:false }
  if (data && data.success === false) {
    const msg =
      data?.error?.message ||
      data?.error ||
      data?.message ||
      "Generate failed";
    const err = new Error(msg);
    (err as any).status = res.status;
    (err as any).url = url;
    (err as any).json = data;
    (err as any).details = data?.details ?? data?.error?.details ?? null; // ✅ PATCH
    (err as any).raw = raw.slice(0, 1200);
    throw err;
  }

  return data;
}

/** ---------------------------------------
 * Types (aligned with API workflows)
 * ------------------------------------- */

/**
 * IMPORTANT:
 * - mode: UI OS mode (tweet/mission/command/thread)
 * - workflowType: actual /v1/generate task type (tweet/mission/waoc_chat/mission_os/viral_hook/...)
 *
 * If workflowType is provided => it will be used as API `type` directly.
 */
export type StudioGeneratePayload = {
  mode: StudioMode;
  workflowType?: string; // ✅ direct API workflow type
  projectSlug: string;
  language: Lang;
  tone: string;
  goal: string;
  constraints: string;
  input: {
    // common
    topic?: string;

    // legacy studio
    details?: string;
    rewards?: string;

    // lite studio
    context?: string;
    extras?: string;

    // chat-like workflows
    message?: string;

    // optional meta
    projectVoice?: unknown;
    hint?: string;
  };
  options?: {
    templateVersion?: number;
    maxAttempts?: number;
    debug?: boolean;
  };
};

// --- API workflow inputs (apps/api) ---
type TweetInput = {
  topic: string;
  audience?: string;
  tone?: string;
  brand?: string;
  link?: string;
};

type MissionInput = {
  goal: string;
  targetAudience: string;
};

type WaocChatInput = {
  message: string;
  context?: string;
  lang?: Lang;
};

type WaocBrainInput = {
  question: string;
  lang?: Lang;
};

type WaocSocialPostInput = {
  topic: string;
  mode?: "tweet" | "thread" | "poster";
  brand?: string;
  link?: string;
  lang?: Lang;
};

type WaocNarrativeInput = {
  topic: string;
  depth?: "short" | "medium" | "deep";
  lang?: Lang;
};

type MissionOsInput = {
  goal: string;
  targetAudience: string;
  brand?: string;
  link?: string;
  lang?: Lang;
};

type MissionEnhancerInput = {
  title: string;
  description: string;
  goal: string;
  lang?: Lang;
};

type IdentityInput = {
  source: string;
  handle: string;
  message: string;
  lang?: Lang;
};

// --- Lite workflow input (recommended) ---
type LiteStudioInput = {
  topic: string;
  context?: string;
  extras?: string;
  lang?: Lang;
  tone?: string;
  goal?: string;
  constraints?: string;
  projectSlug?: string;
  mode?: StudioMode;
};

// --- API workflow outputs (apps/api) ---
export type TweetData = {
  tweet_zh: string;
  tweet_en: string;
  hashtags: string[];
  cta: string;
};

export type MissionData = {
  mission_title: string;
  objective: string;
  steps: string[];
  reward_structure: { top_reward: string; participation_reward: string };
  ranking_model: string;
  anti_sybil_mechanism: string;
};

export type GenerateResponse<TData = any> = {
  success: boolean;
  attempts: number;
  usage?: any;
  usageTotal?: any;
  usageSteps?: any;
  data: TData | null;
  latencyMs?: number;
  error?: any;
};

/** ---------------------------------------
 * Mapping: Studio -> workflow request
 * ------------------------------------- */

function toWorkflowRequest(p: StudioGeneratePayload): { type: string; input: any } {
  const lang = normalizeLang(p.language, "en");

  // Normalize various input names into a single view
  const topic = safeTrim(p.input.topic);
  const context = safeTrim(p.input.context ?? p.input.details);
  const extras = safeTrim(p.input.extras ?? p.input.rewards);
  const message = safeTrim(p.input.message ?? p.input.topic);
  const link = extractLink(`${extras} ${context}`);

  // ✅ 1) OS path: workflowType specified => direct type, build best-effort input
  const wf = safeTrim(p.workflowType);
  if (wf) {
    // ✅ Studio Lite workflows (supported)
    if (
      wf === "viral_hook" ||
      wf === "controversial_take" ||
      wf === "trend_hijack" ||
      wf === "scarcity_launch" ||
      wf === "build_public" ||
      wf === "offer_landing"
    ) {
      const input: LiteStudioInput = {
        topic,
        context,
        extras,
        lang,
        tone: safeTrim(p.tone),
        goal: safeTrim(p.goal),
        constraints: safeTrim(p.constraints),
        projectSlug: safeTrim(p.projectSlug),
        mode: p.mode,
      };
      return { type: wf, input };
    }

    // --- WAOC Chat ---
    if (wf === "waoc_chat") {
      const input: WaocChatInput = { message: message || topic, context: context || "general", lang };
      return { type: wf, input };
    }

    // --- WAOC Brain ---
    if (wf === "waoc_brain") {
      const input: WaocBrainInput = { question: topic || message, lang };
      return { type: wf, input };
    }

    // --- WAOC Social Post (tweet/thread/poster) ---
    if (wf === "waoc_social_post") {
      const mode: WaocSocialPostInput["mode"] =
        p.mode === "thread" ? "thread" : p.mode === "command" ? "tweet" : "tweet";

      const input: WaocSocialPostInput = {
        topic,
        mode,
        brand: safeTrim(p.projectSlug || "WAOC"),
        link,
        lang,
      };
      return { type: wf, input };
    }

    // --- WAOC Narrative ---
    if (wf === "waoc_narrative") {
      const input: WaocNarrativeInput = { topic, depth: "medium", lang };
      return { type: wf, input };
    }

    // --- Mission OS ---
    if (wf === "mission_os") {
      const input: MissionOsInput = {
        goal: safeTrim(p.goal || topic || "growth"),
        targetAudience: context || "builders / creators / founders",
        brand: safeTrim(p.projectSlug || "WAOC"),
        link,
        lang,
      };
      return { type: wf, input };
    }

    // --- Mission Enhancer ---
    if (wf === "mission_enhancer") {
      const input: MissionEnhancerInput = {
        title: topic || "Mission",
        description: context,
        goal: safeTrim(p.goal || "growth"),
        lang,
      };
      return { type: wf, input };
    }

    // --- Identity ---
    if (wf === "identity") {
      const input: IdentityInput = {
        source: "telegram",
        handle: "unknown",
        message: message || topic || "",
        lang,
      };
      return { type: wf, input };
    }

    // --- tweet / mission direct passthrough ---
    if (wf === "tweet") {
      const input: TweetInput = {
        topic: topic || "OneAI OS update",
        audience: context || "builders / creators / founders",
        tone: safeTrim(p.tone || "civilization-scale but practical"),
        brand: safeTrim(p.projectSlug || "OneAI"),
        link,
      };
      return { type: wf, input };
    }

    if (wf === "mission") {
      const input: MissionInput = {
        goal: safeTrim(p.goal || topic || "growth"),
        targetAudience: context || "builders / creators / founders",
      };
      return { type: wf, input };
    }

    // --- default: send generic payload for unknown future workflows ---
    return {
      type: wf,
      input: {
        topic,
        context,
        extras,
        lang,
        tone: p.tone,
        goal: p.goal,
        constraints: p.constraints,
        projectSlug: p.projectSlug,
        __meta: {
          mode: p.mode,
          hint: p.input.hint,
          projectVoice: p.input.projectVoice,
        },
      },
    };
  }

  // ✅ 2) Legacy path: no workflowType => map StudioMode to tweet/mission
  if (p.mode === "mission") {
    const goal = safeTrim(topic || p.goal) || "growth";
    const targetAudience = context || "builders / creators / founders";
    const input: MissionInput = { goal, targetAudience };
    return { type: "mission", input };
  }

  // Default to tweet
  const input: TweetInput = {
    topic: topic || "OneAI OS update",
    audience: context || "builders / creators / founders",
    tone: safeTrim(p.tone) || "civilization-scale but practical",
    brand: safeTrim(p.projectSlug || "OneAI"),
    link,
  };
  return { type: "tweet", input };
}

/** ---------------------------------------
 * API Calls
 * ------------------------------------- */

export async function generate(p: StudioGeneratePayload): Promise<GenerateResponse> {
  if (!API_BASE) throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");

  const url = `${API_BASE}/v1/generate`;
  const mapped = toWorkflowRequest(p);

  // ✅ PATCH: do NOT auto-enable debug in dev (server requires admin for debug)
  const debug = p.options?.debug === true;

  return safeFetchJSON(url, {
    method: "POST",
    body: JSON.stringify({
      type: mapped.type,
      input: mapped.input,
      options: {
        maxAttempts: p.options?.maxAttempts ?? 3,
        templateVersion: p.options?.templateVersion ?? 1,
        ...(debug ? { debug: true } : {}),
      },
    }),
  });
}

/** Optional: health check */
export async function health() {
  if (!API_BASE) throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
  return safeFetchJSON(`${API_BASE}/`, { method: "GET" });
}

/** Optional: billing helpers (if you use them later) */
export async function billingStatus() {
  if (!API_BASE) throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
  return safeFetchJSON(`${API_BASE}/v1/billing/status`, { method: "GET" });
}
