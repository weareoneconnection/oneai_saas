import type { WorkflowContext } from "./types.js";
import type { WorkflowDefinition } from "./engine.js";

import { preparePromptStep } from "./steps/preparePromptStep.js";
import { generateLLMStep } from "./steps/generateLLMStep.js";
import { parseJsonStep } from "./steps/parseJsonStep.js";
import { validateSchemaStep } from "./steps/validateSchemaStep.js";
import { refineJsonStep } from "./steps/refineJsonStep.js";

import { identityValidator } from "../validators/identityValidator.js";
import { registerWorkflow } from "./registry.js";

export type IdentityInput = {
  source: "telegram" | "web" | "api";
  userId?: string;
  handle?: string;
  message: string;
  lang?: "en" | "zh";
};

export type IdentityData = {
  displayName: string;
  role: string;
  bio: string;
  strengths: string[];
  goals: string[];
  nextActions: string[];
  tags: string[];
};

type Ctx = WorkflowContext<IdentityInput, IdentityData> & { templateVersion: number };

function checkIdentityConstraints(data: IdentityData): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  const reqStr = (v: any, k: string) => {
    if (typeof v !== "string" || !v.trim()) errors.push(`${k} required`);
  };

  reqStr(data?.displayName, "displayName");
  reqStr(data?.role, "role");
  reqStr(data?.bio, "bio");

  const arrCheck = (arr: any, k: string, min: number, max: number) => {
    if (!Array.isArray(arr)) return errors.push(`${k} must be array`);
    if (arr.length < min || arr.length > max) errors.push(`${k} must be ${min}-${max}`);
  };

  arrCheck(data?.strengths, "strengths", 2, 6);
  arrCheck(data?.goals, "goals", 2, 6);
  arrCheck(data?.nextActions, "nextActions", 2, 6);
  arrCheck(data?.tags, "tags", 2, 10);

  return { ok: errors.length === 0, errors };
}

function normalizeList(list: string[], max: number) {
  const clean = list
    .map((s) => String(s ?? "").trim())
    .filter(Boolean)
    .map((s) => s.replace(/\s+/g, " "));
  return [...new Set(clean)].slice(0, max);
}

export const identityWorkflowDef: WorkflowDefinition<Ctx> = {
  name: "identity_workflow",
  maxAttempts: 3,
  steps: [
    preparePromptStep<IdentityInput, IdentityData>({
      task: "identity",
      templateVersion: 1,
      variables: (input) => ({
        source: input.source,
        userId: input.userId ?? "",
        handle: input.handle ?? "",
        message: input.message,
        lang: input.lang ?? "en"
      })
    }),

    generateLLMStep<IdentityInput, IdentityData>(),
    parseJsonStep<IdentityInput, IdentityData>(),
    validateSchemaStep<IdentityInput, IdentityData>(identityValidator),

    refineJsonStep<IdentityInput, IdentityData>({
      check: (ctx) => checkIdentityConstraints(ctx.data as any),
      extraInstruction:
        "Return ONLY valid JSON. Keep items short. strengths/goals/nextActions must be concrete. tags should be 1-2 words each."
    }),

    parseJsonStep<IdentityInput, IdentityData>(),
    validateSchemaStep<IdentityInput, IdentityData>(identityValidator),

    async (ctx: Ctx) => {
      const r = checkIdentityConstraints(ctx.data as any);
      if (!r.ok) return { ok: false, error: r.errors };

      // ✅ TS/运行时安全
      if (!ctx.data) return { ok: false, error: ["internal: data undefined"] };

      // ✅ 最终兜底清洗：去重、裁剪、保证不空
      ctx.data.displayName = String(ctx.data.displayName ?? "").trim() || (ctx.input.handle ? `@${ctx.input.handle}` : "WAOC Builder");
      ctx.data.role = String(ctx.data.role ?? "").trim() || "Community Builder";
      ctx.data.bio = String(ctx.data.bio ?? "").trim();

      ctx.data.strengths = normalizeList(ctx.data.strengths || [], 6);
      ctx.data.goals = normalizeList(ctx.data.goals || [], 6);
      ctx.data.nextActions = normalizeList(ctx.data.nextActions || [], 6);
      ctx.data.tags = normalizeList(ctx.data.tags || [], 10);

      // 保险：如果模型输出过短，补齐最低项（不改变结构）
      if (ctx.data.strengths.length < 2) ctx.data.strengths = normalizeList([...ctx.data.strengths, "Consistency", "Collaboration"], 6);
      if (ctx.data.goals.length < 2) ctx.data.goals = normalizeList([...ctx.data.goals, "Contribute to missions", "Help grow WAOC"], 6);
      if (ctx.data.nextActions.length < 2) ctx.data.nextActions = normalizeList([...ctx.data.nextActions, "Join the community chat", "Complete your first mission"], 6);
      if (ctx.data.tags.length < 2) ctx.data.tags = normalizeList([...ctx.data.tags, "WAOC", "Builder"], 10);
      (ctx.data as any).links = [
       process.env.WAOC_SITE_URL,
       process.env.WAOC_COMMUNITY_URL,
       process.env.ONE_MISSION_URL,
       process.env.ONE_FIELD_URL
       ].filter(Boolean).slice(0, 3);
      return { ok: true };
    }
  ]
};

registerWorkflow({
  task: "identity",
  def: identityWorkflowDef as any
});