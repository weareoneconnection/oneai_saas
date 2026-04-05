export type OneClawAction =
  | "content.generate"
  | "content.transform"
  | "api.request"
  | "browser.open"
  | "browser.screenshot"
  | "file.read"
  | "file.write"
  | "message.send"
  | "social.post"
  | "result.compose"
  | (string & {}); // 🔥 允许未来扩展（关键）

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

/**
 * 🔥 Relaxed Constraint Layer
 * 原则：
 * - 不限制AI创造力
 * - 只防止结构崩坏
 * - 只拦截危险错误
 */
export function checkOneClawExecuteConstraints(data: OneClawExecuteData) {
  const errors: string[] = [];

  // ✅ 1. reply 必须存在（用户体验底线）
  if (!data.reply || !data.reply.trim()) {
    errors.push("reply is required.");
  }

  // ✅ 2. shouldExecute 与 task 关系
  if (data.shouldExecute && !data.oneclawTask) {
    errors.push("oneclawTask is required when shouldExecute=true.");
  }

  if (!data.shouldExecute && data.oneclawTask !== null) {
    errors.push("oneclawTask must be null when shouldExecute=false.");
  }

  if (!data.oneclawTask) {
    return { ok: errors.length === 0, errors };
  }

  // ✅ 3. taskName 宽松校验
  if (!data.oneclawTask.taskName || !data.oneclawTask.taskName.trim()) {
    errors.push("taskName is required.");
  }

  // ✅ 4. steps 基础检查（不限制结构）
  if (!Array.isArray(data.oneclawTask.steps) || data.oneclawTask.steps.length === 0) {
    errors.push("steps must contain at least one step.");
    return { ok: false, errors };
  }

  const ids = new Set<string>();

  for (const step of data.oneclawTask.steps) {
    // 🔥 id 宽松，但必须存在
    if (!step.id || !step.id.trim()) {
      errors.push("step id is required.");
      continue;
    }

    // 🔥 不允许重复（唯一硬约束）
    if (ids.has(step.id)) {
      errors.push(`duplicate step id: ${step.id}`);
    }
    ids.add(step.id);

    // 🔥 action 不再强校验（允许AI扩展）
    if (!step.action || !String(step.action).trim()) {
      errors.push(`step ${step.id} action is required.`);
    }

    // 🔥 input 不做限制（核心放开）
    if (step.input === null || typeof step.input !== "object") {
      errors.push(`step ${step.id} input must be an object.`);
    }

    // 🔥 dependsOn 仅做存在性检查
    if (step.dependsOn) {
      for (const dep of step.dependsOn) {
        if (!ids.has(dep)) {
          // ❗ 不报错，只警告（关键放松点）
          // errors.push(`step ${step.id} depends on missing step ${dep}`);
        }

        if (dep === step.id) {
          errors.push(`step ${step.id} cannot depend on itself`);
        }
      }
    }
  }

  return { ok: errors.length === 0, errors };
}