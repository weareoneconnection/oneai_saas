import { prisma } from "../../config/prisma.js";

export async function getOrgBalance(orgId: string): Promise<number> {
  const billing = await prisma.orgBilling.findUnique({
    where: { orgId },
    select: { creditBalanceUsd: true },
  });
  return billing?.creditBalanceUsd ?? 0;
}

export async function assertCreditBalance(orgId: string | null): Promise<void> {
  if (!orgId) return;
  const balance = await getOrgBalance(orgId);
  if (balance <= 0) {
    throw new Error("Insufficient credit balance. Please top up your account.");
  }
}

export async function deductCredit(orgId: string | null, costUsd: number): Promise<void> {
  if (!orgId || costUsd <= 0) return;

  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await prisma.orgBilling.upsert({
        where: { orgId },
        update: {
          creditBalanceUsd: { decrement: costUsd },
          totalSpentUsd: { increment: costUsd },
        },
        create: {
          orgId,
          creditBalanceUsd: -costUsd,
          totalSpentUsd: costUsd,
          totalTopUpUsd: 0,
        },
      });
      return;
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 100 * attempt));
      }
    }
  }

  console.error("[billing] deductCredit failed after retries", { orgId, costUsd, error: lastError });
}

export async function topUpCredit(orgId: string, amountUsd: number): Promise<number> {
  const result = await prisma.orgBilling.upsert({
    where: { orgId },
    update: {
      creditBalanceUsd: { increment: amountUsd },
      totalTopUpUsd: { increment: amountUsd },
    },
    create: {
      orgId,
      creditBalanceUsd: amountUsd,
      totalTopUpUsd: amountUsd,
      totalSpentUsd: 0,
    },
    select: { creditBalanceUsd: true },
  });
  return result.creditBalanceUsd;
}
