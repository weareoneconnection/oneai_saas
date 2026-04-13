const WORLD_TYPES = new Set([
  "fragmented-collapse",
  "guarded-tribalism",
  "cold-efficiency-state",
  "extractive-economy",
  "hyper-competitive-order",
  "cooperative-civilization",
  "compassion-network",
  "resilient-open-world"
]);

const SCORE_KEYS = [
  "trust",
  "cooperation",
  "empathy",
  "stability",
  "conflict",
  "openness",
  "extraction",
  "longTermism"
] as const;

export function checkOneMirrorConstraints(data: any) {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { ok: false, errors: ["output must be object"] };
  }

  if (!data.worldType || !WORLD_TYPES.has(data.worldType)) {
    errors.push("worldType invalid");
  }

  if (!data.summary || typeof data.summary !== "string" || data.summary.length < 20) {
    errors.push("summary too short");
  }

  if (!data.shockLine || typeof data.shockLine !== "string" || data.shockLine.length < 12) {
    errors.push("shockLine too short");
  }

  if (!Array.isArray(data.consequences) || data.consequences.length !== 3) {
    errors.push("consequences must contain exactly 3 items");
  } else {
    for (const item of data.consequences) {
      if (typeof item !== "string" || item.length < 12) {
        errors.push("each consequence must be meaningful");
      }
    }
  }

  if (!data.scores || typeof data.scores !== "object") {
    errors.push("scores required");
  } else {
    for (const key of SCORE_KEYS) {
      const value = data.scores[key];
      if (typeof value !== "number" || Number.isNaN(value)) {
        errors.push(`scores.${key} must be number`);
        continue;
      }
      if (value < 0 || value > 100) {
        errors.push(`scores.${key} must be 0-100`);
      }
    }
  }

  // stronger semantic consistency checks
  if (data.worldType === "fragmented-collapse") {
    if ((data.scores?.trust ?? 100) > 40) errors.push("fragmented-collapse trust too high");
    if ((data.scores?.conflict ?? 0) < 55) errors.push("fragmented-collapse conflict too low");
  }

  if (data.worldType === "cooperative-civilization") {
    if ((data.scores?.trust ?? 0) < 60) errors.push("cooperative-civilization trust too low");
    if ((data.scores?.cooperation ?? 0) < 60) errors.push("cooperative-civilization cooperation too low");
  }

  if (data.worldType === "extractive-economy") {
    if ((data.scores?.extraction ?? 0) < 60) errors.push("extractive-economy extraction too low");
  }

  return {
    ok: errors.length === 0,
    errors
  };
}