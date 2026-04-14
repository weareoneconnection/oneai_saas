export function checkMarketIntelligenceConstraints(data: any) {
  const errors: string[] = [];

  if (!data?.marketRegime) errors.push("marketRegime required");
  if (!data?.tradability) errors.push("tradability required");
  if (!data?.observations) errors.push("observations required");
  if (!data?.interpretation) errors.push("interpretation required");
  if (!data?.outlook) errors.push("outlook required");

  if (
    typeof data?.marketRegime?.confidence !== "number" ||
    data.marketRegime.confidence < 0 ||
    data.marketRegime.confidence > 1
  ) {
    errors.push("marketRegime.confidence must be 0-1");
  }

  if (
    typeof data?.tradability?.confidence !== "number" ||
    data.tradability.confidence < 0 ||
    data.tradability.confidence > 1
  ) {
    errors.push("tradability.confidence must be 0-1");
  }

  if (
    typeof data?.outlook?.confidence !== "number" ||
    data.outlook.confidence < 0 ||
    data.outlook.confidence > 1
  ) {
    errors.push("outlook.confidence must be 0-1");
  }

  if (!Array.isArray(data?.sectorAnalysis)) {
    errors.push("sectorAnalysis must be an array");
  }

 if (!Array.isArray(data?.keyDrivers)) {
  errors.push("keyDrivers must be an array");
}

if (!Array.isArray(data?.risks)) {
  errors.push("risks must be an array");
}

if (!Array.isArray(data?.insights)) {
  errors.push("insights must be an array");
}

  if (!Array.isArray(data?.risks) || data.risks.length === 0) {
    errors.push("risks required");
  }

  if (!Array.isArray(data?.insights) || data.insights.length === 0) {
    errors.push("insights required");
  }

  for (const i of data.insights || []) {
    if (!i.title || i.title.length < 4) {
      errors.push("insight title too short");
    }

    if (!i.body || i.body.length < 20) {
      errors.push("insight body too short");
    }

    if (typeof i.confidence !== "number") {
      errors.push("insight confidence must be number");
    } else if (i.confidence < 0 || i.confidence > 1) {
      errors.push("insight confidence must be 0-1");
    }
  }

  return { ok: errors.length === 0, errors };
}