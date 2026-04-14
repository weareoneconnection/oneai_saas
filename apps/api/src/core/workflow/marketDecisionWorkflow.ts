import type { WorkflowContext } from "./types.js";
import type { WorkflowDefinition } from "./engine.js";

import { preparePromptStep } from "./steps/preparePromptStep.js";
import { generateLLMStep } from "./steps/generateLLMStep.js";
import { parseJsonStep } from "./steps/parseJsonStep.js";
import { validateSchemaStep } from "./steps/validateSchemaStep.js";
import { refineJsonStep } from "./steps/refineJsonStep.js";

import { marketDecisionValidator } from "../validators/marketDecisionValidator.js";
import { checkMarketDecisionConstraints } from "../constraints/marketdecisionConstraints.js";
import { registerWorkflow } from "./registry.js";

type MarketDecisionInput = {
  marketIntelligence: any;
  assetAnalysis: any;
  account: {
    equity: number;
    freeBalance: number;
    accountMode: "spot" | "margin" | "futures";
    preferredSizeMode?: "quote" | "base";
    maxPositionSize?: number;
  };
  risk: {
    maxRiskPerTrade: number;
    dailyLossLimit: number;
    currentExposure?: number;
    maxExposure?: number;
    blockedSymbols?: string[];
    blockedDirections?: string[];
  };
  executionContext: {
    symbol: string;
    exchange: string;
    allowedOrderTypes?: Array<"MARKET" | "LIMIT">;
    minOrderSize?: number;
    maxOrderSize?: number;
    preferredTimeHorizon?: "scalp" | "intraday" | "swing";
  };
};

type Ctx = WorkflowContext<MarketDecisionInput, any>;

export const marketDecisionWorkflowDef: WorkflowDefinition<Ctx> = {
  name: "market_decision_workflow",
  maxAttempts: 3,

  steps: [
    preparePromptStep({
      task: "market_decision",
      templateVersion: 1,
      variables: (input) => ({
        marketIntelligence: JSON.stringify(input.marketIntelligence ?? {}),
        assetAnalysis: JSON.stringify(input.assetAnalysis ?? {}),
        account: JSON.stringify(input.account ?? {}),
        risk: JSON.stringify(input.risk ?? {}),
        executionContext: JSON.stringify(input.executionContext ?? {})
      })
    }),

    generateLLMStep(),

    parseJsonStep(),

    validateSchemaStep(marketDecisionValidator),

    refineJsonStep({
      check: (ctx) => checkMarketDecisionConstraints(ctx.data),
      extraInstruction:
        "Fix all validation errors. If the setup is weak or constraints fail, prefer WAIT with approved=false. Ensure execution plan is realistic, numerically coherent, and consistent with risk limits."
    }),

    parseJsonStep(),

    validateSchemaStep(marketDecisionValidator)
  ]
};

registerWorkflow({
  task: "market_decision",
  def: marketDecisionWorkflowDef as any
});