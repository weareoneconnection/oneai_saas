import businessStrategySchema from "../../schemas/outputs/business_strategy.schema.json" with { type: "json" };
import campaignMissionSchema from "../../schemas/outputs/campaign_mission.schema.json" with { type: "json" };
import contentEngineSchema from "../../schemas/outputs/content_engine.schema.json" with { type: "json" };
import supportBrainSchema from "../../schemas/outputs/support_brain.schema.json" with { type: "json" };
import marketResearchSchema from "../../schemas/outputs/market_research.schema.json" with { type: "json" };
import decisionIntelligenceSchema from "../../schemas/outputs/decision_intelligence.schema.json" with { type: "json" };
import executionPlanSchema from "../../schemas/outputs/execution_plan.schema.json" with { type: "json" };
import customTaskDesignerSchema from "../../schemas/outputs/custom_task_designer.schema.json" with { type: "json" };
import { createAjvValidator } from "./createAjvValidator.js";

export const commercialTaskValidators = {
  business_strategy: createAjvValidator(businessStrategySchema),
  campaign_mission: createAjvValidator(campaignMissionSchema),
  content_engine: createAjvValidator(contentEngineSchema),
  support_brain: createAjvValidator(supportBrainSchema),
  market_research: createAjvValidator(marketResearchSchema),
  decision_intelligence: createAjvValidator(decisionIntelligenceSchema),
  execution_plan: createAjvValidator(executionPlanSchema),
  custom_task_designer: createAjvValidator(customTaskDesignerSchema),
};
