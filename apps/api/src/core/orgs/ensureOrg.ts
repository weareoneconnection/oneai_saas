// apps/api/src/core/orgs/ensureOrg.ts
import crypto from "crypto";
import { prisma } from "../../config/prisma.js";

function normalizeEmail(email: string) {
  return String(email || "").trim().toLowerCase();
}

function slugBaseFromEmail(email: string) {
  const base = normalizeEmail(email)
    .replace(/@/g, "-")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 44);

  return base || "customer";
}

function emailHash(email: string) {
  return crypto.createHash("sha256").update(normalizeEmail(email)).digest("hex").slice(0, 10);
}

export async function getOrCreateOrgForUserEmail(emailRaw: string) {
  const email = normalizeEmail(emailRaw);
  if (!email) throw new Error("userEmail required");

  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: {
        include: { org: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const existingMembership = existingUser?.memberships?.[0];
  if (existingMembership?.org) return existingMembership.org;

  const slug = `${slugBaseFromEmail(email)}-${emailHash(email)}`;
  const name = email.split("@")[0] || "Customer";

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { email },
      update: {},
      create: { email, name },
    });

    const existing = await tx.membership.findFirst({
      where: { userId: user.id },
      include: { org: true },
      orderBy: { createdAt: "asc" },
    });
    if (existing?.org) return existing.org;

    const org = await tx.organization.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        name: `${name}'s Organization`,
      },
    });

    await tx.membership.upsert({
      where: { orgId_userId: { orgId: org.id, userId: user.id } },
      update: { role: "OWNER" },
      create: {
        orgId: org.id,
        userId: user.id,
        role: "OWNER",
      },
    });

    await tx.orgBilling.upsert({
      where: { orgId: org.id },
      update: {},
      create: {
        orgId: org.id,
        plan: "free",
        status: "inactive",
      },
    });

    return org;
  });
}
