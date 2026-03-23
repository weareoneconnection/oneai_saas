// src/core/constraints/waocBrainConstraints.ts

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

const ACTIONS_REQUIRING_DRAFT = new Set<WaocBrainAction>([
  "welcome_new_member",
  "ask_open_question",
  "summarize_thread",
  "nudge_core_member",
  "connect_members",
  "launch_micro_mission",
  "amplify_builder_signal",
  "elevate_civilization_narrative",
  "cool_down_thread",
]);

const TARGETED_ACTIONS = new Set<WaocBrainAction>([
  "nudge_core_member",
  "connect_members",
]);

const PUBLIC_ACTIONS = new Set<WaocBrainAction>([
  "welcome_new_member",
  "ask_open_question",
  "summarize_thread",
  "launch_micro_mission",
  "amplify_builder_signal",
  "elevate_civilization_narrative",
  "cool_down_thread",
]);

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function isNonNegativeInteger(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && Number.isFinite(v) && v >= 0;
}

function isPositiveInteger(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && Number.isFinite(v) && v > 0;
}

function isValid01(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1;
}

function isIntArray(arr: unknown): arr is number[] {
  return (
    Array.isArray(arr) &&
    arr.every((x) => typeof x === "number" && Number.isInteger(x) && Number.isFinite(x))
  );
}

function lower(s?: string) {
  return (s || "").toLowerCase();
}

function includesAny(text: string, needles: string[]) {
  return needles.some((n) => text.includes(n));
}

function isValidEvidenceLevel(v: unknown): v is WaocBrainEvidenceLevel {
  return v === "weak" || v === "medium" || v === "strong";
}

function isValidPriority(v: unknown): v is WaocBrainPriority {
  return v === "low" || v === "medium" || v === "high";
}

function isValidSurface(v: unknown): v is WaocBrainSurface {
  return v === "none" || v === "public" || v === "private" || v === "human_review";
}

function makeExpectedSurface(action: WaocBrainAction): WaocBrainSurface {
  if (action === "stay_quiet") return "none";
  if (action === "escalate_to_human") return "human_review";
  if (TARGETED_ACTIONS.has(action)) return "private";
  return "public";
}

export function checkWaocBrainConstraints(
  data: WaocBrainData,
  input?: WaocBrainInput
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!isFiniteNumber(data?.confidence) || data.confidence < 0 || data.confidence > 1) {
    errors.push("confidence must be between 0 and 1");
  }

  if (!isValidEvidenceLevel(data?.evidenceLevel)) {
    errors.push("evidenceLevel must be one of weak | medium | strong");
  }

  if (!isNonEmptyString(data?.summary)) {
    errors.push("summary is required");
  }

  if (!Array.isArray(data?.reasons) || data.reasons.length === 0) {
    errors.push("reasons must contain at least 1 item");
  } else if (data.reasons.some((x) => !isNonEmptyString(x))) {
    errors.push("reasons must only contain non-empty strings");
  }

  if (!Array.isArray(data?.riskNotes)) {
    errors.push("riskNotes must be an array");
  } else if (data.riskNotes.some((x) => !isNonEmptyString(x))) {
    errors.push("riskNotes must only contain non-empty strings");
  }

  if (!isIntArray(data?.targetUserIds)) {
    errors.push("targetUserIds must be an array of integers");
  }

  if (!isNonEmptyString(data?.expectedOutcome)) {
    errors.push("expectedOutcome is required");
  }

  if (!isNonEmptyString(data?.successSignal)) {
    errors.push("successSignal is required");
  }

  if (!isNonEmptyString(data?.failureSignal)) {
    errors.push("failureSignal is required");
  }

  if (!isPositiveInteger(data?.observeWindowMinutes)) {
    errors.push("observeWindowMinutes must be a positive integer");
  }

  if (!isNonNegativeInteger(data?.cooldownMinutes)) {
    errors.push("cooldownMinutes must be a non-negative integer");
  }
  if (data.action === "ask_open_question" && data.cooldownMinutes < 20) {
  errors.push("ask_open_question should use cooldownMinutes >= 20");
  }
  if (!isNonEmptyString(data?.dedupeKey)) {
    errors.push("dedupeKey is required");
  }

  if (!data?.managerPolicy) {
    errors.push("managerPolicy is required");
  } else {
    if (typeof data.managerPolicy.allowRewriteDraft !== "boolean") {
      errors.push("managerPolicy.allowRewriteDraft must be boolean");
    }
    if (typeof data.managerPolicy.mustUsePrivateIfTargeted !== "boolean") {
      errors.push("managerPolicy.mustUsePrivateIfTargeted must be boolean");
    }
    if (typeof data.managerPolicy.requiresHumanReview !== "boolean") {
      errors.push("managerPolicy.requiresHumanReview must be boolean");
    }
    if (typeof data.managerPolicy.skipIfSimilarActionRecentlyExecuted !== "boolean") {
      errors.push("managerPolicy.skipIfSimilarActionRecentlyExecuted must be boolean");
    }
    if (
      !Number.isInteger(data.managerPolicy.maxDraftEdits) ||
      data.managerPolicy.maxDraftEdits < 0 ||
      data.managerPolicy.maxDraftEdits > 3
    ) {
      errors.push("managerPolicy.maxDraftEdits must be an integer between 0 and 3");
    }
  }

  if (!data?.executionHints) {
    errors.push("executionHints is required");
  } else {
    if (!isValidPriority(data.executionHints.priority)) {
      errors.push("executionHints.priority must be one of low | medium | high");
    }
    if (!isValidSurface(data.executionHints.surface)) {
      errors.push("executionHints.surface must be one of none | public | private | human_review");
    }
    if (!isNonEmptyString(data.executionHints.timing)) {
      errors.push("executionHints.timing is required");
    }
    if (!isNonEmptyString(data.executionHints.style)) {
      errors.push("executionHints.style is required");
    }
    if (!isNonEmptyString(data.executionHints.goal)) {
      errors.push("executionHints.goal is required");
    }
  }

  if (
    data.evidenceLevel === "weak" &&
    data.confidence > 0.65
  ) {
    errors.push("confidence is too high for weak evidenceLevel");
  }

  if (
    data.evidenceLevel === "medium" &&
    data.confidence > 0.85
  ) {
    errors.push("confidence is too high for medium evidenceLevel");
  }

  const expectedSurface = makeExpectedSurface(data.action);
  if (data.executionHints?.surface !== expectedSurface) {
    errors.push(`${data.action} requires executionHints.surface = ${expectedSurface}`);
  }

  if (data.action === "stay_quiet") {
    if (isNonEmptyString(data.draftMessage)) {
      errors.push("stay_quiet requires empty draftMessage");
    }
    if ((data.targetUserIds?.length ?? 0) > 0) {
      errors.push("stay_quiet requires empty targetUserIds");
    }
    if (data.missionType !== "observe") {
      errors.push("stay_quiet should use missionType observe");
    }
    if (data.managerPolicy.requiresHumanReview) {
      errors.push("stay_quiet should not require human review");
    }
    if (data.managerPolicy.maxDraftEdits !== 0) {
      errors.push("stay_quiet should use managerPolicy.maxDraftEdits = 0");
    }
  }

  if (data.action === "escalate_to_human") {
    if (isNonEmptyString(data.draftMessage)) {
      errors.push("escalate_to_human requires empty draftMessage");
    }
    if ((data.targetUserIds?.length ?? 0) > 0) {
      errors.push("escalate_to_human should not include targetUserIds");
    }
    if (!data.managerPolicy.requiresHumanReview) {
      errors.push("escalate_to_human requires managerPolicy.requiresHumanReview = true");
    }
    if (data.managerPolicy.maxDraftEdits !== 0) {
      errors.push("escalate_to_human should use managerPolicy.maxDraftEdits = 0");
    }
  }

  if (ACTIONS_REQUIRING_DRAFT.has(data.action) && !isNonEmptyString(data.draftMessage)) {
    errors.push(`${data.action} requires non-empty draftMessage`);
  }

  if (!ACTIONS_REQUIRING_DRAFT.has(data.action) && isNonEmptyString(data.draftMessage)) {
    errors.push(`${data.action} should not include draftMessage`);
  }

  if (TARGETED_ACTIONS.has(data.action) && (data.targetUserIds?.length ?? 0) === 0) {
    errors.push(`${data.action} requires targetUserIds`);
  }

  if (!TARGETED_ACTIONS.has(data.action) && (data.targetUserIds?.length ?? 0) > 0) {
    errors.push(`${data.action} should not include targetUserIds`);
  }

  if (data.action === "nudge_core_member" && (data.targetUserIds?.length ?? 0) !== 1) {
    errors.push("nudge_core_member should target exactly 1 user");
  }

  if (data.action === "connect_members" && (data.targetUserIds?.length ?? 0) < 2) {
    errors.push("connect_members should target at least 2 users");
  }

  if (TARGETED_ACTIONS.has(data.action)) {
    if (!data.managerPolicy.mustUsePrivateIfTargeted) {
      errors.push(`${data.action} requires managerPolicy.mustUsePrivateIfTargeted = true`);
    }
  } else {
    if (data.managerPolicy.mustUsePrivateIfTargeted && !TARGETED_ACTIONS.has(data.action)) {
      errors.push(`${data.action} should not force private targeting policy`);
    }
  }

  if (
    !data.managerPolicy.skipIfSimilarActionRecentlyExecuted &&
    data.action !== "escalate_to_human"
  ) {
    errors.push("skipIfSimilarActionRecentlyExecuted should usually be true");
  }

  if (
    (data.action === "stay_quiet" || data.action === "escalate_to_human") &&
    data.managerPolicy.allowRewriteDraft
  ) {
    errors.push(`${data.action} should not allow draft rewrites`);
  }

  if (PUBLIC_ACTIONS.has(data.action) && data.managerPolicy.mustUsePrivateIfTargeted) {
    errors.push(`${data.action} is public and should not set mustUsePrivateIfTargeted`);
  }

  if (data.action === "launch_micro_mission" && data.missionType !== "mission_launch") {
    errors.push("launch_micro_mission should use missionType mission_launch");
  }

  if (data.action === "cool_down_thread" && data.missionType !== "cool_down") {
    errors.push("cool_down_thread should use missionType cool_down");
  }

  if (data.action === "connect_members" && data.missionType !== "connect") {
    errors.push("connect_members should use missionType connect");
  }

  if (data.action === "nudge_core_member" && data.missionType !== "retain") {
    errors.push("nudge_core_member should usually use missionType retain");
  }

  if (
    input?.metrics?.builderDensity !== undefined &&
    !isValid01(input.metrics.builderDensity)
  ) {
    errors.push("input.metrics.builderDensity must be between 0 and 1");
  }

  if (
    input?.metrics?.tensionLevel !== undefined &&
    !isValid01(input.metrics.tensionLevel)
  ) {
    errors.push("input.metrics.tensionLevel must be between 0 and 1");
  }

  if (
    input?.metrics?.missionReadiness !== undefined &&
    !isValid01(input.metrics.missionReadiness)
  ) {
    errors.push("input.metrics.missionReadiness must be between 0 and 1");
  }

  if (
    input?.metrics?.botExposureRisk !== undefined &&
    !isValid01(input.metrics.botExposureRisk)
  ) {
    errors.push("input.metrics.botExposureRisk must be between 0 and 1");
  }

  const recentActions = input?.recentInterventions ?? [];
  const recentSameActionCount = recentActions.filter((x) => x.action === data.action).length;
  const recentFailedSameActionCount = recentActions.filter(
    (x) =>
      x.action === data.action &&
      typeof x.outcome === "string" &&
      ["none", "no_response", "failed", "ignored", "low_uptake"].includes(lower(x.outcome))
  ).length;

  if (recentSameActionCount >= 2 && data.cooldownMinutes < 30) {
    errors.push("cooldownMinutes should be >= 30 when the same action has been used repeatedly");
  }

  if (
    recentFailedSameActionCount >= 1 &&
    data.action !== "stay_quiet" &&
    data.action !== "escalate_to_human" &&
    data.cooldownMinutes < 45
  ) {
    errors.push("cooldownMinutes should be >= 45 after a recent failed same action");
  }

  if (
    recentFailedSameActionCount >= 2 &&
    data.action !== "stay_quiet" &&
    data.evidenceLevel === "weak"
  ) {
    errors.push("do not repeat a recently failed weak-evidence action");
  }

  if (data.action === "welcome_new_member") {
    const newMemberCount = input?.metrics?.newMemberCount ?? 0;
    const botExposureRisk = input?.metrics?.botExposureRisk ?? 0;

    if (newMemberCount < 1) {
      errors.push("welcome_new_member requires newMemberCount >= 1");
    }
    if (botExposureRisk > 0.7) {
      errors.push("welcome_new_member blocked by high botExposureRisk");
    }
  }

  if (data.action === "ask_open_question") {
    const botExposureRisk = input?.metrics?.botExposureRisk ?? 0;

    if (botExposureRisk > 0.7) {
      errors.push("ask_open_question blocked by high botExposureRisk");
    }
    if (recentFailedSameActionCount >= 2) {
      errors.push("ask_open_question should not repeat after multiple recent failed prompts");
    }
  }

  if (data.action === "summarize_thread") {
    const summaryText = lower(input?.summaries?.recentThreadSummary);
    const messageCount = input?.metrics?.messageCount ?? 0;

    if (!summaryText && messageCount < 8) {
      errors.push("summarize_thread requires meaningful prior discussion");
    }
  }

  if (data.action === "amplify_builder_signal") {
    const topContributorIds = input?.candidates?.topContributorUserIds ?? [];
    const builderDensity = input?.metrics?.builderDensity ?? 0;

    if (topContributorIds.length === 0 && builderDensity < 0.12) {
      errors.push("amplify_builder_signal requires visible contributor signal or sufficient builder density");
    }
  }

  if (data.action === "elevate_civilization_narrative") {
    const tensionLevel = input?.metrics?.tensionLevel ?? 0;
    const botExposureRisk = input?.metrics?.botExposureRisk ?? 0;

    if (tensionLevel > 0.45) {
      errors.push("elevate_civilization_narrative should not be used in elevated tension");
    }
    if (botExposureRisk > 0.6) {
      errors.push("elevate_civilization_narrative blocked by high botExposureRisk");
    }
  }

  if (data.action === "nudge_core_member") {
    const silentIds = input?.candidates?.silentCoreUserIds ?? [];
    const builderDensity = input?.metrics?.builderDensity ?? 0;
    const messageCount = input?.metrics?.messageCount ?? 0;
    const botExposureRisk = input?.metrics?.botExposureRisk ?? 0;
    const newMemberCount = input?.metrics?.newMemberCount ?? 0;
    const tensionLevel = input?.metrics?.tensionLevel ?? 0;
    const hasConflictRisk = input?.riskContext?.hasConflictRisk ?? false;
    const hasTrustRisk = input?.riskContext?.hasTrustRisk ?? false;
    const recentThreadSummary = lower(input?.summaries?.recentThreadSummary);
    const notableTopics = input?.summaries?.notableTopics ?? [];

    if (!silentIds.length) {
      errors.push("nudge_core_member requires input.candidates.silentCoreUserIds");
    }

    if (builderDensity < 0.15) {
      errors.push("nudge_core_member requires builderDensity >= 0.15");
    }

    if (messageCount < 10) {
      errors.push("nudge_core_member requires messageCount >= 10");
    }

    if (botExposureRisk > 0.6) {
      errors.push("nudge_core_member blocked by high botExposureRisk");
    }

    if (
      data.targetUserIds.length > 0 &&
      silentIds.length > 0 &&
      !data.targetUserIds.every((id) => silentIds.includes(id))
    ) {
      errors.push("nudge_core_member targetUserIds must be chosen from silentCoreUserIds");
    }

    if (
      includesAny(recentThreadSummary, ["unstructured", "lacks structure", "drifting"])
    ) {
      errors.push(
        "nudge_core_member should not be chosen when thread is explicitly unstructured; prefer summarize_thread or ask_open_question"
      );
    }

    if (newMemberCount > 0) {
      errors.push(
        "nudge_core_member should not outrank public newcomer-friendly activation when new members are present"
      );
    }

    if (
      tensionLevel < 0.2 &&
      !hasConflictRisk &&
      !hasTrustRisk &&
      notableTopics.length >= 2
    ) {
      errors.push(
        "nudge_core_member is too targeted for a low-risk multi-topic discussion; prefer a public coordination action"
      );
    }

    if (data.cooldownMinutes < 60) {
      errors.push("nudge_core_member should use cooldownMinutes >= 60");
    }
  }

  if (data.action === "connect_members") {
    const allowedTargets = input?.candidates?.targetUserIds ?? [];

    if (
      allowedTargets.length > 0 &&
      !data.targetUserIds.every((id) => allowedTargets.includes(id))
    ) {
      errors.push("connect_members targetUserIds must come from input.candidates.targetUserIds");
    }

    if (data.cooldownMinutes < 60) {
      errors.push("connect_members should use cooldownMinutes >= 60");
    }
  }

  if (data.action === "launch_micro_mission") {
    const missionReadiness = input?.metrics?.missionReadiness ?? 0;
    const builderDensity = input?.metrics?.builderDensity ?? 0;

    if (missionReadiness < 0.35) {
      errors.push("launch_micro_mission requires missionReadiness >= 0.35");
    }

    if (builderDensity < 0.12) {
      errors.push("launch_micro_mission requires builderDensity >= 0.12");
    }

    if (data.cooldownMinutes < 45) {
      errors.push("launch_micro_mission should use cooldownMinutes >= 45");
    }
  }

  if (data.action === "cool_down_thread") {
    const tensionLevel = input?.metrics?.tensionLevel ?? 0;
    const hasConflictRisk = input?.riskContext?.hasConflictRisk ?? false;

    if (tensionLevel < 0.25 && !hasConflictRisk) {
      errors.push("cool_down_thread requires elevated tensionLevel or hasConflictRisk");
    }

    if (data.cooldownMinutes < 30) {
      errors.push("cool_down_thread should use cooldownMinutes >= 30");
    }
  }

  if (data.action === "escalate_to_human") {
    const hasConflictRisk = input?.riskContext?.hasConflictRisk ?? false;
    const hasSafetyAmbiguity = input?.riskContext?.hasSafetyAmbiguity ?? false;
    const hasTrustRisk = input?.riskContext?.hasTrustRisk ?? false;
    const tensionLevel = input?.metrics?.tensionLevel ?? 0;

    if (!hasConflictRisk && !hasSafetyAmbiguity && !hasTrustRisk && tensionLevel < 0.5) {
      errors.push(
        "escalate_to_human requires conflict risk, safety ambiguity, trust risk, or high tension"
      );
    }
  }

  const platform = input?.platform ?? "telegram";
  if (platform === "x" && data.action === "nudge_core_member") {
    errors.push("nudge_core_member is not suitable for x platform workflow");
  }

  if (platform === "x" && data.executionHints.surface === "private") {
    errors.push("private executionHints.surface is not suitable for x platform workflow");
  }

  const channelType = input?.channelType ?? "unknown";
  if (channelType === "channel" && data.executionHints.surface === "public") {
    if (
      data.action !== "summarize_thread" &&
      data.action !== "launch_micro_mission" &&
      data.action !== "amplify_builder_signal" &&
      data.action !== "elevate_civilization_narrative"
    ) {
      errors.push("announcement/channel-like contexts should avoid chatty public actions");
    }
  }

  if (!data.dedupeKey.startsWith(data.action)) {
    errors.push("dedupeKey should start with action for stable deduplication");
  }

  return { ok: errors.length === 0, errors };
}