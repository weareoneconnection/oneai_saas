import type { WorkflowContext } from "./types.js";
import type { WorkflowDefinition } from "./engine.js";

import { preparePromptStep } from "./steps/preparePromptStep.js";
import { generateLLMStep } from "./steps/generateLLMStep.js";
import { parseJsonStep } from "./steps/parseJsonStep.js";
import { validateSchemaStep } from "./steps/validateSchemaStep.js";
import { refineJsonStep } from "./steps/refineJsonStep.js";

import { marketAnalysisValidator } from "../validators/marketAnalysisValidator.js";
import { checkMarketAnalysisConstraints } from "../constraints/marketAnalysisConstraints.js";
import { registerWorkflow } from "./registry.js";

type MarketAnalysisInput = {
  symbol: string;
  timeframe: string;
  quote: any;
  candles: any[];
  indicators: any;
  orderbook?: any;
  flow?: any;
  news?: any[];
  context?: any;
};

type Ctx = WorkflowContext<MarketAnalysisInput, any>;

export const marketAnalysisWorkflowDef: WorkflowDefinition<Ctx> = {
  name: "market_analysis_workflow",
  maxAttempts: 3,

  steps: [
    preparePromptStep({
      task: "market_analysis",
      templateVersion: 1,
      variables: (input) => ({
        symbol: input.symbol,
        timeframe: input.timeframe,
        quote: JSON.stringify(input.quote ?? {}),
        candles: JSON.stringify(input.candles ?? []),
        indicators: JSON.stringify(input.indicators ?? {}),
        orderbook: JSON.stringify(input.orderbook ?? {}),
        flow: JSON.stringify(input.flow ?? {}),
        news: JSON.stringify(input.news ?? []),
        context: JSON.stringify(input.context ?? {})
      })
    }),

    generateLLMStep(),

    parseJsonStep(),

    validateSchemaStep(marketAnalysisValidator),

    refineJsonStep({
      check: (ctx) => checkMarketAnalysisConstraints(ctx.data),
      extraInstruction:
        "Fix all validation errors. Ensure the analysis is concrete, data-grounded, execution-aware, and not generic. Keep levels numerically consistent and setup logic realistic."
    }),

    parseJsonStep(),

    validateSchemaStep(marketAnalysisValidator)
  ]
};

registerWorkflow({
  task: "market_analysis",
  def: marketAnalysisWorkflowDef as any
});