// apps/api/scripts/syncConfiguredApiKeys.ts
import "dotenv/config";
import crypto from "crypto";
import fs from "fs";
import { prisma } from "../src/config/prisma.js";

function readEnvFile(path: string) {
  const out: Record<string, string> = {};
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

function sha256Hex(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function main() {
  const webEnvPath = process.argv[2] || "../web/.env.local";
  const webEnv = readEnvFile(webEnvPath);

  const entries = [
    { name: "ONEAI_API_KEY", value: webEnv.ONEAI_API_KEY, scopes: [] as string[] },
    {
      name: "ONEAI_ADMIN_API_KEY",
      value: webEnv.ONEAI_ADMIN_API_KEY,
      scopes: ["admin"],
    },
    { name: "ONEAI_ADMIN_KEY", value: webEnv.ONEAI_ADMIN_KEY, scopes: ["admin"] },
    {
      name: "API_ONEAI_ADMIN_API_KEY",
      value: process.env.ONEAI_ADMIN_API_KEY,
      scopes: ["admin"],
    },
  ].filter((entry) => !!entry.value);

  const unique = new Map<string, (typeof entries)[number]>();
  for (const entry of entries) unique.set(entry.value!, entry);

  const org = await prisma.organization.upsert({
    where: { slug: "oneai" },
    update: {},
    create: { name: "OneAI", slug: "oneai" },
  });

  for (const entry of unique.values()) {
    const rawKey = entry.value!;
    const keyHash = sha256Hex(rawKey);
    const prefix = rawKey.slice(0, 6);
    const existing = await prisma.apiKey.findUnique({ where: { keyHash } });

    if (existing) {
      await prisma.apiKey.update({
        where: { id: existing.id },
        data: {
          scopes: Array.from(new Set([...(existing.scopes || []), ...entry.scopes])),
          status: "ACTIVE",
          revokedAt: null,
        },
      });
      console.log(`updated ${entry.name}: ${prefix}...`);
      continue;
    }

    await prisma.apiKey.create({
      data: {
        name: `${entry.name} synced key`,
        keyHash,
        orgId: org.id,
        prefix,
        scopes: entry.scopes,
        status: "ACTIVE",
        userEmail: "local@oneai.dev",
        allowedIps: [],
      },
    });
    console.log(`inserted ${entry.name}: ${prefix}...`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
