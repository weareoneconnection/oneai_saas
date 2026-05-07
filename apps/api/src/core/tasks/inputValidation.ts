import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { createAjvValidator } from "../validators/createAjvValidator.js";
import { getTaskCatalogItem } from "./catalog.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiSrcRoot = path.resolve(__dirname, "../..");

const validatorCache = new Map<string, ReturnType<typeof createAjvValidator> | null>();

function loadInputValidator(task: string) {
  if (validatorCache.has(task)) return validatorCache.get(task) ?? null;

  const item = getTaskCatalogItem(task);
  if (!item?.inputSchema) {
    validatorCache.set(task, null);
    return null;
  }

  const schemaPath = path.join(apiSrcRoot, item.inputSchema);
  if (!fs.existsSync(schemaPath)) {
    validatorCache.set(task, null);
    return null;
  }

  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
  const validator = createAjvValidator(schema);
  validatorCache.set(task, validator);
  return validator;
}

export function validateTaskInput(task: string, input: unknown) {
  const validator = loadInputValidator(task);
  if (!validator) return { ok: true, errors: null };
  return validator.validate(input);
}
