import crypto from "crypto";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

config({ path: ".env" });
config({ path: "../../.env", override: false });

const rawKey = String(process.env.ONEAI_TARGET_API_KEY || process.argv[2] || "").trim();
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing. Run through Railway or set apps/api/.env.");
}

if (!rawKey) {
  throw new Error("ONEAI_TARGET_API_KEY is missing.");
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
      allowedTasks: true,
      allowedModels: true,
      status: true,
    },
  });

  if (!apiKey) {
    throw new Error("API key not found. Check ONEAI_TARGET_API_KEY.");
  }

  const scopes = unique([...(apiKey.scopes || []), "admin", "generate", "chat", "models"]);

  const updated = await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: {
      scopes,
      allowedTasks: [],
      allowedModels: [],
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
      status: true,
      updatedAt: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      ...(updated.orgId ? { org: { connect: { id: updated.orgId } } } : {}),
      apiKey: { connect: { id: updated.id } },
      action: "api_key.internal_workflows_enabled",
      target: updated.prefix,
      metadata: {
        name: updated.name,
        prefix: updated.prefix,
        userEmail: updated.userEmail,
        scopes: updated.scopes,
        allowedTasks: "ALL",
        allowedModels: "ALL",
      },
    } as any,
  });

  console.log(
    JSON.stringify(
      {
        success: true,
        apiKey: {
          id: updated.id,
          prefix: updated.prefix,
          userEmail: updated.userEmail,
          status: updated.status,
          scopes: updated.scopes,
          allowedTasks: "ALL",
          allowedModels: "ALL",
          updatedAt: updated.updatedAt,
        },
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
