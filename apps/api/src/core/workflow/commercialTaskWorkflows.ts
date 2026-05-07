import type { WorkflowContext } from "./types.js";
import type { WorkflowDefinition } from "./engine.js";

import { preparePromptStep } from "./steps/preparePromptStep.js";
import { generateLLMStep } from "./steps/generateLLMStep.js";
import { parseJsonStep } from "./steps/parseJsonStep.js";
import { refineJsonStep } from "./steps/refineJsonStep.js";
import { validateSchemaStep } from "./steps/validateSchemaStep.js";
import { commercialTaskValidators } from "../validators/commercialTaskValidators.js";
import { registerWorkflow } from "./registry.js";

type CommercialTask =
  | "business_strategy"
  | "campaign_mission"
  | "content_engine"
  | "support_brain"
  | "market_research"
  | "decision_intelligence"
  | "execution_plan"
  | "custom_task_designer";

type CommercialInput = Record<string, unknown>;
type CommercialData = Record<string, unknown>;
type CommercialCtx = WorkflowContext<CommercialInput, CommercialData> & {
  templateVersion: number;
};

const commercialTasks: CommercialTask[] = [
  "business_strategy",
  "campaign_mission",
  "content_engine",
  "support_brain",
  "market_research",
  "decision_intelligence",
  "execution_plan",
  "custom_task_designer",
];

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return String(value ?? "");
  }
}

function normalizeCommercialOutput(task: CommercialTask) {
  return async (ctx: CommercialCtx) => {
    const data =
      ctx.data && typeof ctx.data === "object" && !Array.isArray(ctx.data)
        ? ctx.data
        : {};

    if (task === "execution_plan") {
      data.executionBoundary = "plans_only";
    }

    ctx.data = data;
    return { ok: true };
  };
}

function validationCheck(task: CommercialTask) {
  return (ctx: WorkflowContext<CommercialInput, CommercialData>) => {
    const result = commercialTaskValidators[task].validate(ctx.data);
    return {
      ok: result.ok,
      errors: result.ok ? [] : [JSON.stringify(result.errors ?? "Schema validation failed")],
    };
  };
}

function makeCommercialWorkflow(task: CommercialTask): WorkflowDefinition<CommercialCtx> {
  return {
    name: `${task}_workflow`,
    maxAttempts: 3,
    steps: [
      preparePromptStep({
        task,
        templateVersion: 1,
        variables: (input) => ({
          inputJson: safeJson(input),
        }),
      }),

      generateLLMStep<CommercialInput, CommercialData>(),
      parseJsonStep<CommercialInput, CommercialData>(),
      normalizeCommercialOutput(task),

      refineJsonStep({
        check: validationCheck(task),
        extraInstruction:
          "Fix the JSON so it matches the task output schema exactly. Return only strict JSON. Keep the same commercial meaning and do not claim that OneAI executed external actions.",
      }),

      parseJsonStep<CommercialInput, CommercialData>(),
      normalizeCommercialOutput(task),
      validateSchemaStep(commercialTaskValidators[task]),
    ],
  };
}

for (const task of commercialTasks) {
  registerWorkflow({
    task,
    def: makeCommercialWorkflow(task) as any,
  });
}
