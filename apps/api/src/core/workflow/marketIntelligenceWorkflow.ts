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
    volatility: "low" | "normal" | "high" | "expansion";
    liquidityCondition: "tight" | "normal" | "loose";
  };
  benchmarks: {
    BTC: any;
    ETH: any;
  };
  sectors?: any[];
  topAssets: any[];
  flows: any;
  derivatives?: any;
  dominance?: any;
  macro: any;
  news?: any[];
  context: any;
};

type Ctx = WorkflowContext<MarketIntelligenceInput, any>;

export const marketIntelligenceWorkflowDef: WorkflowDefinition<Ctx> = {
  name: "market_intelligence_workflow",
  maxAttempts: 3,

  steps: [
    preparePromptStep({
      task: "market_intelligence",
      templateVersion: 2,
      variables: (input) => ({
        market: JSON.stringify(input.market ?? {}),
        benchmarks: JSON.stringify(input.benchmarks ?? {}),
        sectors: JSON.stringify(input.sectors ?? []),
        topAssets: JSON.stringify(input.topAssets ?? []),
        flows: JSON.stringify(input.flows ?? {}),
        derivatives: JSON.stringify(input.derivatives ?? {}),
        dominance: JSON.stringify(input.dominance ?? {}),
        macro: JSON.stringify(input.macro ?? {}),
        news: JSON.stringify(input.news ?? []),
        context: JSON.stringify(input.context ?? {})
      })
    }),

    generateLLMStep(),

    parseJsonStep(),

    validateSchemaStep(marketIntelligenceValidator),

    refineJsonStep({
      check: (ctx) => checkMarketIntelligenceConstraints(ctx.data),
      extraInstruction:
        "Fix all validation errors. Ensure outputs are market-level, grounded in the full crypto market context, and not single-asset commentary. Keep observations distinct from interpretation and avoid generic statements."
    }),

    parseJsonStep(),

    validateSchemaStep(marketIntelligenceValidator)
  ]
};

registerWorkflow({
  task: "market_intelligence",
  def: marketIntelligenceWorkflowDef as any
});