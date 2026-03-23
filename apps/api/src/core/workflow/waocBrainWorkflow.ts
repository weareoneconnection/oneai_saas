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
export type WaocBrainEvidenceLevel = "weak" | "medium" | "strong";

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
  evidenceLevel: WaocBrainEvidenceLevel;
  summary: string;
  reasons: string[];
  riskNotes: string[];
  targetUserIds: number[];
  draftMessage: string;
  expectedOutcome: string;
  successSignal: string;
  failureSignal: string;
  observeWindowMinutes: number;
  cooldownMinutes: number;
  dedupeKey: string;
  managerPolicy: {
    allowRewriteDraft: boolean;
    mustUsePrivateIfTargeted: boolean;
    requiresHumanReview: boolean;
    skipIfSimilarActionRecentlyExecuted: boolean;
    maxDraftEdits: number;
  };
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
  "Use EXACT enum values only.",
  "The action field must be EXACTLY one of:",
  "stay_quiet, welcome_new_member, ask_open_question, summarize_thread, nudge_core_member, connect_members, launch_micro_mission, amplify_builder_signal, elevate_civilization_narrative, cool_down_thread, escalate_to_human.",
  "The missionType field must be EXACTLY one of:",
  "activate, connect, retain, guide, cool_down, mission_launch, observe.",
  "The evidenceLevel field must be EXACTLY one of:",
  "weak, medium, strong.",
  "For stay_quiet and escalate_to_human, draftMessage must be empty.",
  "For nudge_core_member and connect_members, targetUserIds must be present and valid.",
  "For nudge_core_member executionHints.surface must be private.",
  "For connect_members executionHints.surface must be private.",
  "For welcome_new_member, ask_open_question, summarize_thread, launch_micro_mission, amplify_builder_signal, elevate_civilization_narrative, cool_down_thread executionHints.surface must be public.",
  "For stay_quiet executionHints.surface must be none.",
  "For escalate_to_human executionHints.surface must be human_review.",
  "managerPolicy must always be present and internally consistent with action and surface.",
  "expectedOutcome, successSignal, failureSignal, observeWindowMinutes, cooldownMinutes, and dedupeKey are required.",
  "Do not invent synonyms, combined actions, or alternative labels.",
  "If a previous action is invalid or unjustified, replace it with the closest conservative valid action.",
  "Prefer stay_quiet over speculative or repetitive intervention.",
  "Ensure action, missionType, targetUserIds, draftMessage, managerPolicy, and executionHints are internally consistent."
].join(" ");

export const waocBrainWorkflowDef: WorkflowDefinition<Ctx> = {
  name: "waoc_brain_workflow",
  maxAttempts: 3,
  steps: [
    preparePromptStep<WaocBrainInput, WaocBrainData>({
      task: "waoc_brain",
      templateVersion: 2,
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