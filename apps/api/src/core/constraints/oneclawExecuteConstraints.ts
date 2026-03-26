export type OneClawAction =
  | "api.request"
  | "browser.open"
  | "browser.screenshot"
  | "file.read"
  | "file.write"
  | "message.send"
  | "social.post";

export type OneClawStep = {
  id: string;
  action: OneClawAction;
  input: Record<string, unknown>;
  dependsOn?: string[];
};

export type OneClawTask = {
  taskName: string;
  steps: OneClawStep[];
};

export type OneClawExecuteData = {
  reply: string;
  shouldExecute: boolean;
  oneclawTask: OneClawTask | null;
};

export function checkOneClawExecuteConstraints(data: OneClawExecuteData) {
  const errors: string[] = [];

  if (!data.reply || !data.reply.trim()) {
    errors.push("reply is required.");
  }

  if (data.shouldExecute && !data.oneclawTask) {
    errors.push("oneclawTask is required when shouldExecute=true.");
  }

  if (!data.shouldExecute && data.oneclawTask !== null) {
    errors.push("oneclawTask must be null when shouldExecute=false.");
  }

  if (!data.oneclawTask) {
    return { ok: errors.length === 0, errors };
  }

  const ids = new Set<string>();

  for (const step of data.oneclawTask.steps) {
    if (ids.has(step.id)) {
      errors.push(`duplicate step id: ${step.id}`);
    }
    ids.add(step.id);
  }

  for (const step of data.oneclawTask.steps) {
    for (const dep of step.dependsOn ?? []) {
      if (!ids.has(dep)) {
        errors.push(`step ${step.id} depends on missing step ${dep}`);
      }
      if (dep === step.id) {
        errors.push(`step ${step.id} cannot depend on itself`);
      }
    }
  }

  return { ok: errors.length === 0, errors };
}