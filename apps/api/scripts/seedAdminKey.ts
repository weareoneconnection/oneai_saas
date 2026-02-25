// apps/api/scripts/seedAdminKey.ts
import "dotenv/config";
import crypto from "crypto";
import { prisma } from "../src/config/prisma.js";

function sha256Hex(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

async function main() {
  const rawKey = process.env.ONEAI_ADMIN_API_KEY || "admin_key_1";
  const keyHash = sha256Hex(rawKey);

  // 1) ensure org
  const org = await prisma.organization.upsert({
    where: { slug: "oneai" },
    update: {},
    create: {
      name: "OneAI",
      slug: "oneai",
    },
  });

  // 2) ensure api key
  const existing = await prisma.apiKey.findUnique({ where: { keyHash } });

  if (!existing) {
    const prefix = rawKey.slice(0, 6);

    await prisma.apiKey.create({
      data: {
        name: "Local Admin Key",
        keyHash,
        orgId: org.id,
        prefix,
        scopes: ["admin"], // ✅ 让 debug 也能开
        status: "ACTIVE",
        userEmail: "local@oneai.dev",
        allowedIps: [],
      },
    });

    console.log("✅ Admin ApiKey inserted:", { orgId: org.id, prefix });
  } else {
    console.log("ℹ️ ApiKey already exists:", { id: existing.id });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });