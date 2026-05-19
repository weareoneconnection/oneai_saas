import crypto from "crypto";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

config({ path: ".env" });
config({ path: "../../.env", override: false });

const rawKey = String(process.env.ONEAI_TARGET_API_KEY || process.argv[2] || "").trim();
const connectionString = process.env.DATABASE_URL;

const ENTERPRISE_LIMITS = {
  monthlyRequestLimit: 10_000_000,
  monthlyCostLimitUsd: 100_000,
  rateLimitRpm: 5_000,
};

if (!connectionString) {
  throw new Error("DATABASE_URL is missing. Run through Railway or set apps/api/.env.");
}

if (!rawKey) {
  throw new Error("ONEAI_TARGET_API_KEY is missing. Pass it as env or first argument.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

async function main() {
  const keyHash = sha256(rawKey);
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    select: {
      id: true,
      orgId: true,
      name: true,
      prefix: true,
      userEmail: true,
      scopes: true,
      status: true,
      allowedTasks: true,
      allowedModels: true,
      monthlyBudgetUsd: true,
      rateLimitRpm: true,
      org: {
        select: {
          id: true,
          name: true,
          slug: true,
          billing: true,
        },
      },
    },
  });

  if (!apiKey) {
    throw new Error("API key not found. Check ONEAI_TARGET_API_KEY.");
  }

  if (apiKey.status !== "ACTIVE") {
    throw new Error(`API key is not ACTIVE. Current status: ${apiKey.status}`);
  }

  const scopes = unique([...(apiKey.scopes || []), "admin", "generate", "chat", "models"]);

  const [updatedKey, billing] = await prisma.$transaction([
    prisma.apiKey.update({
      where: { id: apiKey.id },
      data: {
        scopes,
        allowedTasks: [],
        allowedModels: [],
        monthlyBudgetUsd: ENTERPRISE_LIMITS.monthlyCostLimitUsd,
        rateLimitRpm: ENTERPRISE_LIMITS.rateLimitRpm,
      },
      select: {
        id: true,
        orgId: true,
        name: true,
        prefix: true,
        userEmail: true,
        scopes: true,
        allowedTasks: true,
        allowedModels: true,
        monthlyBudgetUsd: true,
        rateLimitRpm: true,
        status: true,
        updatedAt: true,
      },
    }),
    prisma.orgBilling.upsert({
      where: { orgId: apiKey.orgId },
      update: {
        plan: "enterprise",
        status: "active",
        monthlyRequestLimit: ENTERPRISE_LIMITS.monthlyRequestLimit,
        monthlyCostLimitUsd: ENTERPRISE_LIMITS.monthlyCostLimitUsd,
        rateLimitRpm: ENTERPRISE_LIMITS.rateLimitRpm,
      },
      create: {
        orgId: apiKey.orgId,
        plan: "enterprise",
        status: "active",
        monthlyRequestLimit: ENTERPRISE_LIMITS.monthlyRequestLimit,
        monthlyCostLimitUsd: ENTERPRISE_LIMITS.monthlyCostLimitUsd,
        rateLimitRpm: ENTERPRISE_LIMITS.rateLimitRpm,
      },
      select: {
        orgId: true,
        plan: true,
        status: true,
        monthlyRequestLimit: true,
        monthlyCostLimitUsd: true,
        rateLimitRpm: true,
        updatedAt: true,
      },
    }),
  ]);

  await prisma.auditLog.create({
    data: {
      org: { connect: { id: updatedKey.orgId } },
      apiKey: { connect: { id: updatedKey.id } },
      action: "api_key.enterprise_access_enabled",
      target: updatedKey.prefix,
      metadata: {
        name: updatedKey.name,
        prefix: updatedKey.prefix,
        userEmail: updatedKey.userEmail,
        scopes: updatedKey.scopes,
        allowedTasks: "ALL",
        allowedModels: "ALL",
        monthlyBudgetUsd: updatedKey.monthlyBudgetUsd,
        rateLimitRpm: updatedKey.rateLimitRpm,
        billing,
      },
    } as any,
  });

  console.log(
    JSON.stringify(
      {
        success: true,
        apiKey: {
          id: updatedKey.id,
          prefix: updatedKey.prefix,
          userEmail: updatedKey.userEmail,
          status: updatedKey.status,
          scopes: updatedKey.scopes,
          allowedTasks: "ALL",
          allowedModels: "ALL",
          monthlyBudgetUsd: updatedKey.monthlyBudgetUsd,
          rateLimitRpm: updatedKey.rateLimitRpm,
          updatedAt: updatedKey.updatedAt,
        },
        org: {
          id: apiKey.org.id,
          name: apiKey.org.name,
          slug: apiKey.org.slug,
        },
        billing,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
