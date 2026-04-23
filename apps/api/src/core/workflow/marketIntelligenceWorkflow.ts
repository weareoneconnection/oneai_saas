import type { WorkflowContext } from "./types.js";
import type { WorkflowDefinition } from "./engine.js";

import { preparePromptStep } from "./steps/preparePromptStep.js";
import { generateLLMStep } from "./steps/generateLLMStep.js";
import { parseJsonStep } from "./steps/parseJsonStep.js";
import { validateSchemaStep } from "./steps/validateSchemaStep.js";
import { refineJsonStep } from "./steps/refineJsonStep.js";

import { marketIntelligenceValidator } from "../validators/marketIntelligenceValidator.js";
import { checkMarketIntelligenceConstraints } from "../constraints/marketIntelligenceConstraints.js";
import { registerWorkflow } from "./registry.js";

type MarketIntelligenceInput = {
  market: {
    regime: "bull" | "bear" | "range" | "transition";
    volatility: "low" | "normal" | "high" | "expanding";
    liquidityCondition: "tight" | "normal" | "loose";
  };
  benchmarks: {
    BTC: Record<string, unknown>;
    ETH: Record<string, unknown>;
  };
  sectors?: Array<Record<string, unknown>>;
  topAssets: Array<Record<string, unknown>>;
  flows: {
    stablecoinFlow?: "inflow" | "outflow" | "neutral" | "unknown";
    crossExchangeBias?: "risk_on" | "risk_off" | "neutral" | "unknown";
    breadth?: Record<string, unknown>;
    [key: string]: unknown;
  };
  derivatives?: {
    fundingRegime?: "positive" | "negative" | "neutral" | "unknown";
    openInterestTrend?: "rising" | "falling" | "flat" | "unknown";
    liquidationsBias?: "longs_hit" | "shorts_hit" | "balanced" | "unknown";
    [key: string]: unknown;
  };
  dominance?: {
    btcDominancePct?: number;
    altRotation?: "active" | "early" | "late" | "none" | "mixed" | "unknown";
    [key: string]: unknown;
  };
  macro: Record<string, unknown>;
  news?: Array<Record<string, unknown>>;
  context: Record<string, unknown>;
};

type Ctx = WorkflowContext<MarketIntelligenceInput, any>;

export const marketIntelligenceWorkflowDef: WorkflowDefinition<Ctx> = {
  name: "market_intelligence_workflow",
  maxAttempts: 3,

  steps: [
    preparePromptStep({
      task: "market_intelligence",
      templateVersion: 1,
      variables: (input) => ({
        market: JSON.stringify(input.market ?? {}),
        benchmarks: JSON.stringify(input.benchmarks ?? {}),
        sectors: JSON.stringify(input.sectors ?? []),
        topAssets: JSON.stringify(input.topAssets ?? []),
        flows: JSON.stringify(
          input.flows ?? {
            stablecoinFlow: "neutral",
          }
        ),
        derivatives: JSON.stringify(
          input.derivatives ?? {
            fundingRegime: "neutral",
            openInterestTrend: "flat",
          }
        ),
        dominance: JSON.stringify(
          input.dominance ?? {
            altRotation: "mixed",
          }
        ),
        macro: JSON.stringify(input.macro ?? {}),
        news: JSON.stringify(input.news ?? []),
        context: JSON.stringify(input.context ?? {}),
      }),
    }),

    generateLLMStep(),

    parseJsonStep(),

    validateSchemaStep(marketIntelligenceValidator),

    refineJsonStep({
      check: (ctx) => checkMarketIntelligenceConstraints(ctx.data),
      extraInstruction:
        "Fix all validation errors. Ensure outputs are market-level, grounded in full crypto market context, and not single-asset commentary. Keep observations distinct from interpretation, avoid generic statements, and preserve strict JSON shape."
    }),

    parseJsonStep(),

    validateSchemaStep(marketIntelligenceValidator),
  ],
};

registerWorkflow({
  task: "market_intelligence",
  def: marketIntelligenceWorkflowDef as any,
});