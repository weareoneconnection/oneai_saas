// apps/api/scripts/checkLaunchEnv.mjs
import fs from "fs";

function readEnvFile(path) {
  const out = {};
  if (!fs.existsSync(path)) return out;
  for (const line of fs.readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed
      .slice(idx + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
    out[key] = value;
  }
  return out;
}

function status(value) {
  if (!value) return "missing";
  if (/xxx|yyy|placeholder|replace|your_/i.test(value)) return "placeholder";
  return "set";
}

function safeUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}`;
  } catch {
    return "invalid";
  }
}

function firstExisting(paths) {
  return paths.find((path) => fs.existsSync(path)) || paths[0];
}

const apiEnvPath = firstExisting(["apps/api/.env", ".env"]);
const webEnvPath = firstExisting(["apps/web/.env.local", "../web/.env.local"]);
const api = readEnvFile(apiEnvPath);
const web = readEnvFile(webEnvPath);

const checks = {
  files: {
    apiEnvPath,
    webEnvPath,
  },
  database: {
    api: status(api.DATABASE_URL),
    web: status(web.DATABASE_URL),
    same: !!api.DATABASE_URL && api.DATABASE_URL === web.DATABASE_URL,
  },
  apiBase: {
    web: safeUrl(web.ONEAI_API_BASE_URL),
  },
  stripe: {
    STRIPE_SECRET_KEY: status(api.STRIPE_SECRET_KEY),
    STRIPE_WEBHOOK_SECRET: status(api.STRIPE_WEBHOOK_SECRET),
    STRIPE_PRICE_PRO: status(api.STRIPE_PRICE_PRO),
    STRIPE_PRICE_TEAM: status(api.STRIPE_PRICE_TEAM),
    NEXT_PUBLIC_STRIPE_PRICE_PRO: status(web.NEXT_PUBLIC_STRIPE_PRICE_PRO),
    NEXT_PUBLIC_STRIPE_PRICE_TEAM: status(web.NEXT_PUBLIC_STRIPE_PRICE_TEAM),
    proMatches:
      !!api.STRIPE_PRICE_PRO &&
      !!web.NEXT_PUBLIC_STRIPE_PRICE_PRO &&
      api.STRIPE_PRICE_PRO === web.NEXT_PUBLIC_STRIPE_PRICE_PRO,
    teamMatches:
      !!api.STRIPE_PRICE_TEAM &&
      !!web.NEXT_PUBLIC_STRIPE_PRICE_TEAM &&
      api.STRIPE_PRICE_TEAM === web.NEXT_PUBLIC_STRIPE_PRICE_TEAM,
  },
};

console.log(JSON.stringify(checks, null, 2));

const stripeOk =
  Object.entries(checks.stripe)
    .filter(([key]) => !["proMatches", "teamMatches"].includes(key))
    .every(([, value]) => value === "set") &&
  checks.stripe.proMatches &&
  checks.stripe.teamMatches;

if (!checks.database.same || !stripeOk) {
  process.exitCode = 1;
}
