import type { WorkflowContext } from "./types.js";
import type { WorkflowDefinition } from "./engine.js";

import { preparePromptStep } from "./steps/preparePromptStep.js";
import { generateLLMStep } from "./steps/generateLLMStep.js";
import { parseJsonStep } from "./steps/parseJsonStep.js";
import { validateSchemaStep } from "./steps/validateSchemaStep.js";

import { missionValidator } from "../validators/missionValidator.js";
import { registerWorkflow } from "./registry.js";

export type MissionInput = {
  goal: string;
  targetAudience: string;
};

export type MissionData = {
  mission_title: string;
  objective: string;
  steps: string[];
  reward_structure: { top_reward: string; participation_reward: string };
  ranking_model: string;
  anti_sybil_mechanism: string;
};

type MissionCtx = WorkflowContext<MissionInput, MissionData> & { templateVersion: number };

export const missionWorkflowDef: WorkflowDefinition<MissionCtx> = {
  name: "mission_workflow",
  maxAttempts: 3,
  steps: [
    preparePromptStep<MissionInput, MissionData>({
      task: "mission",
      templateVersion: 1,
      variables: (input) => ({
        goal: input.goal,
        targetAudience: input.targetAudience
      })
    }),
    generateLLMStep<MissionInput, MissionData>(),
    parseJsonStep<MissionInput, MissionData>(),
    validateSchemaStep<MissionInput, MissionData>(missionValidator)
  ]
};

// ✅ 注册到任务中心
registerWorkflow({
  task: "mission",
  def: missionWorkflowDef as any
});