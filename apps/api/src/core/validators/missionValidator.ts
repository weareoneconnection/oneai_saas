import missionSchema from "../../schemas/mission.schema.json" with { type: "json" };
import { createAjvValidator } from "./createAjvValidator.js";

export const missionValidator = createAjvValidator(missionSchema);