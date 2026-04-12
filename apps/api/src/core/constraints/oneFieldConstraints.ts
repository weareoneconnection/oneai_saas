export function checkOneFieldConstraints(data: any) {
  const errors: string[] = [];

  if (!data?.pulse) errors.push("pulse required");
  if (!data?.summary) errors.push("summary required");

  if (!Array.isArray(data?.insights) || data.insights.length === 0) {
    errors.push("insights required");
  }

  for (const i of data.insights || []) {
    if (!i.title || i.title.length < 5) {
      errors.push("insight title too short");
    }

    if (!i.body || i.body.length < 20) {
      errors.push("insight body too short");
    }

    if (typeof i.confidence !== "number") {
      errors.push("confidence must be number");
    }

    if (i.confidence < 0 || i.confidence > 1) {
      errors.push("confidence must be 0-1");
    }
  }

  return { ok: errors.length === 0, errors };
}