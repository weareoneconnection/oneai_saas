import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { createAjvValidator } from "./createAjvValidator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 这里读的是「输出」schema（因为 validateSchemaStep 通常验证 ctx.data）
const schemaPath = path.join(__dirname, "../../schemas/outputs/waocChat.schema.json");
const schemaObject = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));

export const waocChatValidator = createAjvValidator(schemaObject);