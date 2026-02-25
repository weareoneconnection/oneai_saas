export type TaskType = "mission" | "tweet";

export function resolveModel(task: TaskType) {
  switch (task) {
    case "mission":
      return { model: "gpt-4o-mini", temperature: 0.7 };

    case "tweet":
      return { model: "gpt-4o-mini", temperature: 0.8 };

    default:
      return { model: "gpt-4o-mini", temperature: 0.7 };
  }
}