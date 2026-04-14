export function checkMarketDecisionConstraints(data: any) {
  const errors: string[] = [];

  if (!data?.decision) errors.push("decision required");
  if (!data?.executionPlan) errors.push("executionPlan required");
  if (!data?.riskCheck) errors.push("riskCheck required");
  if (!data?.rationale) errors.push("rationale required");

  const action = data?.decision?.action;
  const approved = data?.decision?.approved;

  if (typeof data?.decision?.confidence !== "number") {
    errors.push("decision.confidence must be number");
  } else if (data.decision.confidence < 0 || data.decision.confidence > 1) {
    errors.push("decision.confidence must be 0-1");
  }

  if (!Array.isArray(data?.alternatives) || data.alternatives.length === 0) {
    errors.push("alternatives required");
  }

  if (!Array.isArray(data?.insights) || data.insights.length === 0) {
    errors.push("insights required");
  }

  for (const i of data.insights || []) {
    if (!i.title || i.title.length < 4) {
      errors.push("insight title too short");
    }
    if (!i.body || i.body.length < 15) {
      errors.push("insight body too short");
    }
    if (typeof i.confidence !== "number") {
      errors.push("insight confidence must be number");
    } else if (i.confidence < 0 || i.confidence > 1) {
      errors.push("insight confidence must be 0-1");
    }
  }

  if (approved === false || action === "WAIT") {
    if (data.executionPlan?.side !== "NONE") {
      errors.push("executionPlan.side must be NONE when not approved");
    }
    if (data.executionPlan?.orderType !== "NONE") {
      errors.push("executionPlan.orderType must be NONE when not approved");
    }
    if (data.executionPlan?.sizeMode !== "none") {
      errors.push("executionPlan.sizeMode must be none when not approved");
    }
  }

  if (approved === true && (action === "BUY" || action === "SELL")) {
    if (data.executionPlan?.side !== action) {
      errors.push("executionPlan.side must match decision.action");
    }
    if (!data.executionPlan?.symbol) {
      errors.push("executionPlan.symbol required when approved");
    }
    if (
      typeof data.executionPlan?.sizeValue !== "number" ||
      data.executionPlan.sizeValue <= 0
    ) {
      errors.push("executionPlan.sizeValue must be > 0 when approved");
    }
  }

  if (
    typeof data?.riskCheck?.maxRiskAllowed !== "number" ||
    typeof data?.riskCheck?.estimatedRisk !== "number"
  ) {
    errors.push("riskCheck risk values must be numeric");
  }

  return {
    ok: errors.length === 0,
    errors
  };
}