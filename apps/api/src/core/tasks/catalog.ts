import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { listTasks } from "../workflow/registry.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiSrcRoot = path.resolve(__dirname, "../..");

type TaskTier = "free" | "pro" | "team" | "enterprise";

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
};

const TASK_TIERS: Record<string, TaskTier> = {
  market_decision: "pro",
  onefield_intelligence: "pro",
  oneclaw_execute: "pro",
};

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
        tier: TASK_TIERS[task] ?? "free",
        templateVersions: versions,
        defaultTemplateVersion: versions.at(-1) ?? 1,
        inputSchema,
        outputSchema,
        supportsDebug: true,
        supportsLLMOptions: true,
      };
    });
}

export function getTaskCatalogItem(type: string) {
  return getTaskCatalog().find((task) => task.type === type) ?? null;
}
