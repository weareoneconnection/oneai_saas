import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { createAjvValidator } from "./createAjvValidator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, "../../schemas/outputs/missionEnhancer.schema.json");
const schemaObject = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));

export const missionEnhancerValidator = createAjvValidator(schemaObject);