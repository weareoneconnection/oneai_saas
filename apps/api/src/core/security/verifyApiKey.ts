// apps/api/src/core/security/verifyApiKey.ts
import crypto from "crypto";
import { prisma } from "../../config/prisma.js";

function hashKey(plain: string) {
  return crypto.createHash("sha256").update(plain).digest("hex");
}

export async function verifyApiKey(plainKey: string) {
  const hashedKey = hashKey(plainKey);

  const row = await prisma.apiKey.findFirst({
    where: { keyHash: hashedKey, revokedAt: null },
    select: { id: true, userEmail: true },
  });

  if (!row) return null;

  // best-effort 更新 lastUsedAt
  prisma.apiKey
    .update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  return row; // { id, userEmail }
}