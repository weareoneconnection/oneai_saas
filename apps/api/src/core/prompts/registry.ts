import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type PromptTemplate = {
  id: string;
  version: number;
  system: string;
  userTemplate: string;
};

export function loadTemplate(task: string, version = 1): PromptTemplate {
  const filePath = path.join(
    __dirname,
    "templates",
    task,
    `v${version}.json`
  );

  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}