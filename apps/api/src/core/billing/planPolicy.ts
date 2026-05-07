export type PlanPolicy = {
  monthlyRequestLimit: number;
  monthlyCostLimitUsd: number;
  rateLimitRpm: number;
  maxCostPerRequestUsd: number;
  allowedTiers: string[];
  allowedModes: string[];
  allowDebug: boolean;
  allowExplicitModelSelection: boolean;
  allowModelRegistry: boolean;
};

const POLICIES: Record<string, PlanPolicy> = {
  free: {
    monthlyRequestLimit: 1_000,
    monthlyCostLimitUsd: 10,
    rateLimitRpm: 30,
    maxCostPerRequestUsd: 0.05,
    allowedTiers: ["free"],
    allowedModes: ["cheap", "balanced"],
    allowDebug: false,
    allowExplicitModelSelection: false,
    allowModelRegistry: false,
  },
  pro: {
    monthlyRequestLimit: 50_000,
    monthlyCostLimitUsd: 500,
    rateLimitRpm: 120,
    maxCostPerRequestUsd: 1,
    allowedTiers: ["free", "pro"],
    allowedModes: ["cheap", "balanced", "fast", "auto"],
    allowDebug: false,
    allowExplicitModelSelection: false,
    allowModelRegistry: false,
  },
  team: {
    monthlyRequestLimit: 250_000,
    monthlyCostLimitUsd: 2_500,
    rateLimitRpm: 600,
    maxCostPerRequestUsd: 5,
    allowedTiers: ["free", "pro", "team"],
    allowedModes: ["cheap", "balanced", "fast", "premium", "auto"],
    allowDebug: true,
    allowExplicitModelSelection: true,
    allowModelRegistry: true,
  },
  enterprise: {
    monthlyRequestLimit: 10_000_000,
    monthlyCostLimitUsd: 100_000,
    rateLimitRpm: 5_000,
    maxCostPerRequestUsd: 100,
    allowedTiers: ["free", "pro", "team", "enterprise"],
    allowedModes: ["cheap", "balanced", "fast", "premium", "auto"],
    allowDebug: true,
    allowExplicitModelSelection: true,
    allowModelRegistry: true,
  },
  custom: {
    monthlyRequestLimit: 10_000_000,
    monthlyCostLimitUsd: 100_000,
    rateLimitRpm: 5_000,
    maxCostPerRequestUsd: 100,
    allowedTiers: ["free", "pro", "team", "enterprise"],
    allowedModes: ["cheap", "balanced", "fast", "premium", "auto"],
    allowDebug: true,
    allowExplicitModelSelection: true,
    allowModelRegistry: true,
  },
};

export function getPlanPolicy(plan?: string | null): PlanPolicy {
  return POLICIES[String(plan || "free").toLowerCase()] ?? POLICIES.free;
}

export function applyPlanPolicyOverrides(
  policy: PlanPolicy,
  overrides?: {
    monthlyRequestLimit?: number | null;
    monthlyCostLimitUsd?: number | null;
    rateLimitRpm?: number | null;
  } | null
): PlanPolicy {
  if (!overrides) return policy;

  return {
    ...policy,
    monthlyRequestLimit:
      typeof overrides.monthlyRequestLimit === "number" && overrides.monthlyRequestLimit > 0
        ? overrides.monthlyRequestLimit
        : policy.monthlyRequestLimit,
    monthlyCostLimitUsd:
      typeof overrides.monthlyCostLimitUsd === "number" && overrides.monthlyCostLimitUsd > 0
        ? overrides.monthlyCostLimitUsd
        : policy.monthlyCostLimitUsd,
    rateLimitRpm:
      typeof overrides.rateLimitRpm === "number" && overrides.rateLimitRpm > 0
        ? overrides.rateLimitRpm
        : policy.rateLimitRpm,
  };
}

export function canUseTaskTier(plan: string | null | undefined, tier: string) {
  return getPlanPolicy(plan).allowedTiers.includes(tier);
}
