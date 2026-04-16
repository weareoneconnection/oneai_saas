export function checkMarketAnalysisConstraints(data: any) {
  const errors: string[] = [];

  if (!data?.marketState) errors.push("marketState required");
  if (!data?.summary || data.summary.length < 5) {
    errors.push("summary too short");
  }

  if (typeof data?.marketState?.confidence !== "number") {
    errors.push("marketState.confidence must be number");
  }

  if (typeof data?.setup?.confidence !== "number") {
    errors.push("setup.confidence must be number");
  }

  if (!Array.isArray(data?.levels?.support)) {
    errors.push("support must be an array");
  }

  if (!Array.isArray(data?.levels?.resistance)) {
    errors.push("resistance must be an array");
  }

  if (!Array.isArray(data?.levels?.triggerZone)) {
    errors.push("triggerZone must be an array");
  }

  if (!Array.isArray(data?.risks)) {
    errors.push("risks must be an array");
  }

  if (!Array.isArray(data?.insights)) {
    errors.push("insights must be an array");
  }

  for (const i of data.insights || []) {
    if (!i.title || i.title.length < 3) {
      errors.push("insight title too short");
    }

    if (!i.body || i.body.length < 10) {
      errors.push("insight body too short");
    }

    if (typeof i.confidence !== "number") {
      errors.push("insight confidence must be number");
    }
  }

  return {
    ok: errors.length === 0,
    errors
  };
}