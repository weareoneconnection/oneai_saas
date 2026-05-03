// apps/api/scripts/syncConfiguredApiKeys.mjs
import "dotenv/config";
import crypto from "crypto";
import fs from "fs";
import pg from "pg";

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
    if (value) out[key] = value;
  }

  return out;
}

function sha256Hex(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function id() {
  return crypto.randomUUID();
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  const webEnvPath = process.argv[2] || "../web/.env.local";
  const webEnv = readEnvFile(webEnvPath);
  const entries = [
    { name: "ONEAI_API_KEY", value: webEnv.ONEAI_API_KEY, scopes: [] },
    { name: "ONEAI_ADMIN_API_KEY", value: webEnv.ONEAI_ADMIN_API_KEY, scopes: ["admin"] },
    { name: "ONEAI_ADMIN_KEY", value: webEnv.ONEAI_ADMIN_KEY, scopes: ["admin"] },
    { name: "API_ONEAI_ADMIN_API_KEY", value: process.env.ONEAI_ADMIN_API_KEY, scopes: ["admin"] },
  ].filter((entry) => !!entry.value);

  const unique = new Map();
  for (const entry of entries) unique.set(entry.value, entry);

  await pool.query(
    `INSERT INTO "Organization" ("id", "name", "slug", "createdAt", "updatedAt")
     VALUES ($1, 'OneAI', 'oneai', NOW(), NOW())
     ON CONFLICT ("slug") DO UPDATE SET "updatedAt" = NOW()`,
    [id()]
  );
  const orgRes = await pool.query(`SELECT "id" FROM "Organization" WHERE "slug" = 'oneai' LIMIT 1`);
  const orgId = orgRes.rows[0].id;

  for (const entry of unique.values()) {
    const rawKey = entry.value;
    const keyHash = sha256Hex(rawKey);
    const prefix = rawKey.slice(0, 6);
    const existing = await pool.query(
      `SELECT "id", "scopes" FROM "ApiKey" WHERE "keyHash" = $1 LIMIT 1`,
      [keyHash]
    );

    if (existing.rowCount) {
      const scopes = Array.from(new Set([...(existing.rows[0].scopes || []), ...entry.scopes]));
      await pool.query(
        `UPDATE "ApiKey"
         SET "scopes" = $1, "status" = 'ACTIVE', "revokedAt" = NULL, "updatedAt" = NOW()
         WHERE "id" = $2`,
        [scopes, existing.rows[0].id]
      );
      console.log(`updated ${entry.name}: ${prefix}...`);
      continue;
    }

    await pool.query(
      `INSERT INTO "ApiKey"
       ("id", "name", "keyHash", "createdAt", "allowedIps", "orgId", "prefix", "scopes", "status", "updatedAt", "userEmail")
       VALUES ($1, $2, $3, NOW(), ARRAY[]::TEXT[], $4, $5, $6, 'ACTIVE', NOW(), 'local@oneai.dev')`,
      [id(), `${entry.name} synced key`, keyHash, orgId, prefix, entry.scopes]
    );
    console.log(`inserted ${entry.name}: ${prefix}...`);
  }
} finally {
  await pool.end();
}
