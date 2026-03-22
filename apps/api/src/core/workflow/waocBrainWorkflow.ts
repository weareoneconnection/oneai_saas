// apps/api/src/core/workflows/waoc_brain.workflow.ts

import type { WorkflowContext } from "./types.js";
import type { WorkflowDefinition } from "./engine.js";

import { preparePromptStep } from "./steps/preparePromptStep.js";
import { generateLLMStep } from "./steps/generateLLMStep.js";
import { parseJsonStep } from "./steps/parseJsonStep.js";
import { validateSchemaStep } from "./steps/validateSchemaStep.js";
import { refineJsonStep } from "./steps/refineJsonStep.js";

import { waocBrainValidator } from "../validators/waocBrainValidator.js";
import { checkWaocBrainConstraints } from "../constraints/waocBrainConstraints.js";
import { registerWorkflow } from "./registry.js";

export type WaocBrainPhase =
  | "cold_start"
  | "early_growth"
  | "stable_engagement"
  | "fatigue"
  | "fragmented"
  | "conflict"
  | "mission_ready"
  | "dormant";

export type WaocBrainMomentum =
  | "rising"
  | "stable"
  | "weakening"
  | "dormant"
  | "fake_active";

export type WaocBrainPosture =
  | "silent_watch"
  | "gentle_activation"
  | "mission_push"
  | "social_repair"
  | "safe_mode";

export type WaocBrainEmotion =
  | "calm"
  | "curious"
  | "focused"
  | "excited"
  | "confused"
  | "conflict";

export type WaocBrainMissionType =
  | "activate"
  | "connect"
  | "retain"
  | "guide"
  | "cool_down"
  | "mission_launch"
  | "observe";

export type WaocBrainAction =
  | "stay_quiet"
  | "welcome_new_member"
  | "ask_open_question"
  | "summarize_thread"
  | "nudge_core_member"
  | "connect_members"
  | "launch_micro_mission"
  | "amplify_builder_signal"
  | "elevate_civilization_narrative"
  | "cool_down_thread"
  | "escalate_to_human";

export type WaocBrainPriority = "low" | "medium" | "high";
export type WaocBrainSurface = "none" | "public" | "private" | "human_review";

export type WaocBrainInput = {
  communityId?: string;
  communityName?: string;
  communityType?:
    | "general"
    | "builder"
    | "social"
    | "support"
    | "announcement"
    | "governance"
    | "partner";
  channelType?: "group" | "channel" | "forum" | "feed" | "dm" | "unknown";
  platform: "telegram" | "discord" | "slack" | "x" | "web";
  resolvedLanguage: "en" | "zh" | "mixed";
  communityStage?: WaocBrainPhase;
  metrics?: {
    messageCount?: number;
    activeUserCount?: number;
    newMemberCount?: number;
    builderDensity?: number;
    tensionLevel?: number;
    missionReadiness?: number;
    botExposureRisk?: number;
  };
  candidates?: {
    targetUserIds?: number[];
    silentCoreUserIds?: number[];
    topContributorUserIds?: number[];
  };
  summaries?: {
    recentThreadSummary?: string;
    notableTopics?: string[];
    notes?: string[];
  };
  recentInterventions?: Array<{
    action: WaocBrainAction;
    ts?: number;
    outcome?: string;
  }>;
  riskContext?: {
    hasConflictRisk?: boolean;
    hasSafetyAmbiguity?: boolean;
    hasTrustRisk?: boolean;
  };
  timeContext?: {
    windowLabel?: string;
    recentWindowMs?: number;
    comparisonWindowMs?: number;
  };
  notes?: string[];
};

export type WaocBrainData = {
  phase: WaocBrainPhase;
  momentum: WaocBrainMomentum;
  posture: WaocBrainPosture;
  emotion: WaocBrainEmotion;
  missionType: WaocBrainMissionType;
  action: WaocBrainAction;
  confidence: number;
  summary: string;
  reasons: string[];
  riskNotes: string[];
  targetUserIds: number[];
  draftMessage: string;
  executionHints: {
    priority: WaocBrainPriority;
    timing: string;
    surface: WaocBrainSurface;
    style: string;
    goal: string;
  };
};

type Ctx = WorkflowContext<WaocBrainInput, WaocBrainData> & {
  templateVersion: number;
};

const REFINE_INSTRUCTION = [
  "Return ONLY valid JSON matching the waocBrain output schema.",
  "Do not add extra fields.",
  "The action field must be EXACTLY one of these enum values:",
  "stay_quiet, welcome_new_member, ask_open_question, summarize_thread, nudge_core_member, connect_members, launch_micro_mission, amplify_builder_signal, elevate_civilization_narrative, cool_down_thread, escalate_to_human.",
  "Do not invent synonyms, paraphrases, combined actions, or alternative labels for action.",
  "The missionType field must be EXACTLY one of these enum values:",
  "activate, connect, retain, guide, cool_down, mission_launch, observe.",
  "If the previous action is invalid or unjustified, replace it with the single closest valid enum value.",
  "Prefer conservative valid actions when uncertain.",
  "Ensure action, missionType, targetUserIds, draftMessage, and executionHints are internally consistent.",
  "For stay_quiet and escalate_to_human, draftMessage must be empty.",
  "For nudge_core_member and connect_members, targetUserIds must be present and valid.",
  "For public actions, executionHints.surface must be public.",
  "For targeted actions, executionHints.surface must be private.",
].join(" ");

export const waocBrainWorkflowDef: WorkflowDefinition<Ctx> = {
  name: "waoc_brain_workflow",
  maxAttempts: 3,
  steps: [
    preparePromptStep<WaocBrainInput, WaocBrainData>({
      task: "waoc_brain",
      templateVersion: 1,
      variables: (input) => ({
        input: JSON.stringify(input, null, 2),
      }),
    }),

    generateLLMStep<WaocBrainInput, WaocBrainData>(),

    parseJsonStep<WaocBrainInput, WaocBrainData>(),

    validateSchemaStep<WaocBrainInput, WaocBrainData>(waocBrainValidator),

    refineJsonStep<WaocBrainInput, WaocBrainData>({
      check: (ctx) =>
        checkWaocBrainConstraints(
          ctx.data as WaocBrainData,
          ctx.input as WaocBrainInput
        ),
      extraInstruction: REFINE_INSTRUCTION,
    }),

    parseJsonStep<WaocBrainInput, WaocBrainData>(),

    validateSchemaStep<WaocBrainInput, WaocBrainData>(waocBrainValidator),

    async (ctx: Ctx) => {
      const result = checkWaocBrainConstraints(
        ctx.data as WaocBrainData,
        ctx.input as WaocBrainInput
      );

      if (!result.ok) {
        return {
          ok: false,
          error: result.errors,
        };
      }

      return { ok: true };
    },
  ],
};

registerWorkflow({
  task: "waoc_brain",
  def: waocBrainWorkflowDef as any,
});