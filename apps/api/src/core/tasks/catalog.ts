import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { listTasks } from "../workflow/registry.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiSrcRoot = path.resolve(__dirname, "../..");

type TaskTier = "free" | "pro" | "team" | "enterprise";
type TaskCategory = "core" | "community" | "growth" | "market" | "execution_planning" | "studio" | "utility";

const TASK_DESCRIPTIONS: Record<string, string> = {
  agent_plan: "Turn a goal into structured agent-ready strategy, missions, actions, and reasoning.",
  mission_os: "Generate a complete mission with execution, proof, review, reward, growth, and risk design.",
  waoc_chat: "Community-aware chat intelligence for WAOC and related ecosystems.",
  oneclaw_execute: "Plan OneClaw-compatible execution tasks without executing them inside OneAI.",
  market_analysis: "Structured market analysis.",
  market_decision: "Decision intelligence for market actions.",
  market_intelligence: "Market intelligence synthesis.",
  onefield_intelligence: "Coordination intelligence over builder/network fields.",
  tweet: "Generate structured tweet content.",
  business_strategy: "Turn a business goal into structured strategy, milestones, risks, and next actions.",
  campaign_mission: "Build a commercial campaign mission with proof, review, rewards, growth loops, and risk controls.",
  content_engine: "Generate launch-ready content assets, hooks, social posts, CTAs, hashtags, and variants.",
  support_brain: "Generate customer support or community replies with intent, confidence, suggested action, and memory update.",
  market_research: "Create a structured market research brief from product, audience, competitors, and constraints.",
  decision_intelligence: "Turn context and options into a structured decision recommendation.",
  execution_plan: "Create a safe execution-ready plan for external agents, tools, or teams without executing actions.",
  custom_task_designer: "Design a custom Task Intelligence specification for a customer workflow.",
};

const TASK_TIERS: Record<string, TaskTier> = {
  market_decision: "pro",
  onefield_intelligence: "pro",
  oneclaw_execute: "pro",
  campaign_mission: "pro",
  support_brain: "pro",
  market_research: "pro",
  decision_intelligence: "pro",
  execution_plan: "team",
  custom_task_designer: "team",
};

const TASK_CATEGORIES: Record<string, TaskCategory> = {
  agent_plan: "core",
  mission: "core",
  mission_os: "core",
  mission_enhancer: "core",
  identity: "core",
  oneclaw_execute: "execution_planning",
  waoc_chat: "community",
  waoc_brain: "community",
  waoc_narrative: "community",
  waoc_social_post: "community",
  onefield_intelligence: "community",
  one_mirror: "community",
  tweet: "growth",
  business_strategy: "core",
  campaign_mission: "growth",
  content_engine: "growth",
  support_brain: "community",
  market_research: "market",
  decision_intelligence: "core",
  execution_plan: "execution_planning",
  custom_task_designer: "core",
  daily_vibe: "growth",
  "lite/cta": "growth",
  "lite/debate": "growth",
  "lite/launch": "growth",
  "lite/reply": "growth",
  "lite/thread": "growth",
  "lite/tweet": "growth",
  "lite/viral_hook": "growth",
  market_analysis: "market",
  market_decision: "market",
  market_intelligence: "market",
  price_agent: "market",
  news_agent: "utility",
  web_agent: "utility",
  x_agent: "utility",
  studio_lite_distribution: "studio",
  studio_lite_feedback: "studio",
  studio_lite_pack: "studio",
  studio_lite_strategy: "studio",
};

const STABLE_TASKS = new Set([
  "agent_plan",
  "mission_os",
  "waoc_chat",
  "oneclaw_execute",
  "market_decision",
  "tweet",
  "mission",
  "business_strategy",
  "campaign_mission",
  "content_engine",
  "support_brain",
  "market_research",
  "decision_intelligence",
  "execution_plan",
  "custom_task_designer",
]);

function titleize(task: string): string {
  return task
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function fileExists(rel: string): boolean {
  return fs.existsSync(path.join(apiSrcRoot, rel));
}

function templateVersions(task: string): number[] {
  const dir = path.join(apiSrcRoot, "core/prompts/templates", task);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .map((name) => {
      const match = /^v(\d+)\.json$/.exec(name);
      return match ? Number(match[1]) : null;
    })
    .filter((x): x is number => typeof x === "number")
    .sort((a, b) => a - b);
}

function schemaPathFor(task: string, kind: "input" | "output"): string | null {
  const candidates =
    kind === "input"
      ? [
          `schemas/inputs/${task}.schema.json`,
          `schemas/${task}.schema.json`,
          `schemas/${task.replace(/_/g, "-")}.schema.json`,
        ]
      : [
          `schemas/outputs/${task}.schema.json`,
          `schemas/${task}.schema.json`,
          `schemas/${task.replace(/_/g, "-")}.schema.json`,
        ];

  return candidates.find(fileExists) ?? null;
}

export function getTaskCatalog() {
  return listTasks()
    .sort()
    .map((task) => {
      const versions = templateVersions(task);
      const inputSchema = schemaPathFor(task, "input");
      const outputSchema = schemaPathFor(task, "output");

      return {
        type: task,
        name: titleize(task),
        description: TASK_DESCRIPTIONS[task] ?? `${titleize(task)} workflow.`,
        category: TASK_CATEGORIES[task] ?? "utility",
        tier: TASK_TIERS[task] ?? "free",
        route: "/v1/generate",
        executionBoundary: task === "oneclaw_execute" ? "plans_only" : "intelligence_only",
        maturity: STABLE_TASKS.has(task) ? "stable" : "experimental",
        templateVersions: versions,
        defaultTemplateVersion: versions.at(-1) ?? 1,
        inputSchema,
        outputSchema,
        hasInputSchema: !!inputSchema,
        hasOutputSchema: !!outputSchema,
        supportsDebug: true,
        supportsLLMOptions: true,
      };
    });
}

export function getTaskCatalogItem(type: string) {
  return getTaskCatalog().find((task) => task.type === type) ?? null;
}
