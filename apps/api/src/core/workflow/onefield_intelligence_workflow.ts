import type { WorkflowContext } from "./types.js";
import type { WorkflowDefinition } from "./engine.js";

import { preparePromptStep } from "./steps/preparePromptStep.js";
import { generateLLMStep } from "./steps/generateLLMStep.js";
import { parseJsonStep } from "./steps/parseJsonStep.js";
import { validateSchemaStep } from "./steps/validateSchemaStep.js";
import { refineJsonStep } from "./steps/refineJsonStep.js";

import { oneFieldValidator } from "../validators/oneFieldValidator.js";
import { checkOneFieldConstraints } from "../constraints/oneFieldConstraints.js";
import { registerWorkflow } from "./registry.js";

type OneFieldInput = {
  builders: any[];
  edges: any[];
  stats: any;
};

type Ctx = WorkflowContext<OneFieldInput, any>;

export const oneFieldWorkflowDef: WorkflowDefinition<Ctx> = {
  name: "onefield_intelligence_workflow",
  maxAttempts: 3,

  steps: [
    preparePromptStep({
      task: "onefield_intelligence",
      templateVersion: 1,
      variables: (input) => ({
        builders: JSON.stringify(input.builders),
        edges: JSON.stringify(input.edges),
        stats: JSON.stringify(input.stats)
      })
    }),

    generateLLMStep(),

    parseJsonStep(),

    validateSchemaStep(oneFieldValidator),

    refineJsonStep({
      check: (ctx) => checkOneFieldConstraints(ctx.data),
      extraInstruction:
        "Fix all validation errors. Ensure insights are concrete, actionable, and grounded in the graph."
    }),

    parseJsonStep(),

    validateSchemaStep(oneFieldValidator)
  ]
};

registerWorkflow({
  task: "onefield_intelligence",
  def: oneFieldWorkflowDef as any
});