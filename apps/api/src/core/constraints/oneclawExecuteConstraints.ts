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
  | (string & {});

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

type ConstraintResult = {
  ok: boolean;
  errors: string[];
  warnings?: string[];
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

/**
 * Apex Relaxed Constraint Layer
 *
 * 目标：
 * - 最大化 AI 规划自由
 * - 只守住结构底线
 * - 不限制 action 扩展
 * - 不限制 input 字段设计
 * - 只拦截会导致运行时明显崩坏的错误
 *
 * 原则：
 * - structure first
 * - creativity allowed
 * - safety floor only
 */
export function checkOneClawExecuteConstraints(
  data: OneClawExecuteData,
): ConstraintResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. reply 基础要求
  if (!isNonEmptyString(data.reply)) {
    errors.push("reply is required.");
  }

  // 2. shouldExecute / oneclawTask 联动底线
  if (data.shouldExecute === true && data.oneclawTask == null) {
    errors.push("oneclawTask is required when shouldExecute=true.");
  }

  if (data.shouldExecute === false && data.oneclawTask !== null) {
    errors.push("oneclawTask must be null when shouldExecute=false.");
  }

  // shouldExecute=false 时无需继续检查 task
  if (data.oneclawTask == null) {
    return { ok: errors.length === 0, errors, warnings };
  }

  // 3. taskName 基础要求
  if (!isNonEmptyString(data.oneclawTask.taskName)) {
    errors.push("taskName is required.");
  }

  // 4. steps 结构底线
  if (!Array.isArray(data.oneclawTask.steps) || data.oneclawTask.steps.length === 0) {
    errors.push("steps must contain at least one step.");
    return { ok: false, errors, warnings };
  }

  const ids = new Set<string>();

  for (const step of data.oneclawTask.steps) {
    // 5. id 必须存在
    if (!isNonEmptyString(step.id)) {
      errors.push("step id is required.");
      continue;
    }

    // 6. id 不允许重复
    if (ids.has(step.id)) {
      errors.push(`duplicate step id: ${step.id}`);
    } else {
      ids.add(step.id);
    }

    // 7. action 只要求存在，不限制取值
    if (!isNonEmptyString(step.action)) {
      errors.push(`step ${step.id} action is required.`);
    }

    // 8. input 只要求是 object
    if (!isObjectRecord(step.input)) {
      errors.push(`step ${step.id} input must be an object.`);
    }

    // 9. dependsOn 只做最小约束
    if (step.dependsOn !== undefined) {
      if (!Array.isArray(step.dependsOn)) {
        errors.push(`step ${step.id} dependsOn must be an array if provided.`);
      } else {
        const seenDeps = new Set<string>();

        for (const dep of step.dependsOn) {
          if (!isNonEmptyString(dep)) {
            errors.push(`step ${step.id} has invalid dependency id.`);
            continue;
          }

          if (dep === step.id) {
            errors.push(`step ${step.id} cannot depend on itself.`);
          }

          if (seenDeps.has(dep)) {
            warnings.push(`step ${step.id} has duplicate dependsOn value: ${dep}`);
          } else {
            seenDeps.add(dep);
          }
        }
      }
    }
  }

  // 10. 缺失依赖不报错，只警告
  for (const step of data.oneclawTask.steps) {
    for (const dep of step.dependsOn ?? []) {
      if (!ids.has(dep)) {
        warnings.push(`step ${step.id} depends on missing step ${dep}`);
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}