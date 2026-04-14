export function checkMarketAnalysisConstraints(data: any) {
  const errors: string[] = [];

  if (!data?.marketState) errors.push("marketState required");
  if (!data?.summary || data.summary.length < 20) {
    errors.push("summary too short");
  }

  if (typeof data?.marketState?.confidence !== "number") {
    errors.push("marketState.confidence must be number");
  } else if (
    data.marketState.confidence < 0 ||
    data.marketState.confidence > 1
  ) {
    errors.push("marketState.confidence must be 0-1");
  }

  if (typeof data?.setup?.confidence !== "number") {
    errors.push("setup.confidence must be number");
  } else if (
    data.setup.confidence < 0 ||
    data.setup.confidence > 1
  ) {
    errors.push("setup.confidence must be 0-1");
  }

  if (!Array.isArray(data?.levels?.support) || data.levels.support.length === 0) {
    errors.push("support levels required");
  }

  if (!Array.isArray(data?.levels?.resistance) || data.levels.resistance.length === 0) {
    errors.push("resistance levels required");
  }

  if (
    !Array.isArray(data?.levels?.triggerZone) ||
    data.levels.triggerZone.length !== 2
  ) {
    errors.push("triggerZone must have exactly 2 values");
  }

  if (!Array.isArray(data?.risks) || data.risks.length === 0) {
    errors.push("risks required");
  }

  if (!Array.isArray(data?.insights) || data.insights.length < 2) {
    errors.push("at least 2 insights required");
  }

  for (const r of data.risks || []) {
    if (!r.title || r.title.length < 4) errors.push("risk title too short");
    if (!r.body || r.body.length < 20) errors.push("risk body too short");
  }

  for (const i of data.insights || []) {
    if (!i.title || i.title.length < 4) errors.push("insight title too short");
    if (!i.body || i.body.length < 20) errors.push("insight body too short");

    if (typeof i.confidence !== "number") {
      errors.push("insight confidence must be number");
    } else if (i.confidence < 0 || i.confidence > 1) {
      errors.push("insight confidence must be 0-1");
    }
  }

  return {
    ok: errors.length === 0,
    errors
  };
}