import type { WorkflowContext } from "./types.js";
import type { WorkflowDefinition } from "./engine.js";

import { preparePromptStep } from "./steps/preparePromptStep.js";
import { generateLLMStep } from "./steps/generateLLMStep.js";
import { parseJsonStep } from "./steps/parseJsonStep.js";
import { validateSchemaStep } from "./steps/validateSchemaStep.js";
import { refineJsonStep } from "./steps/refineJsonStep.js";

import { oneMirrorValidator } from "../validators/oneMirrorValidator.js";
import { checkOneMirrorConstraints } from "../constraints/oneMirrorConstraints.js";
import { registerWorkflow } from "./registry.js";

type OneMirrorInput = {
  input: string;
};

type Ctx = WorkflowContext<OneMirrorInput, any>;

export const oneMirrorWorkflowDef: WorkflowDefinition<Ctx> = {
  name: "one_mirror_workflow",
  maxAttempts: 3,

  steps: [
    preparePromptStep({
      task: "one_mirror",
      templateVersion: 1,
      variables: (input) => ({
        input: input.input
      })
    }),

    generateLLMStep(),

    parseJsonStep(),

    validateSchemaStep(oneMirrorValidator),

    refineJsonStep({
      check: (ctx) => checkOneMirrorConstraints(ctx.data),
      extraInstruction:
        "Fix all validation errors. Keep the output sharp, public-facing, emotionally strong, and internally consistent. Return valid JSON only."
    }),

    parseJsonStep(),

    validateSchemaStep(oneMirrorValidator)
  ]
};

registerWorkflow({
  task: "one_mirror",
  def: oneMirrorWorkflowDef as any
});