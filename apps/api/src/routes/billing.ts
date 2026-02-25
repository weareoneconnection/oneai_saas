// apps/api/src/routes/billing.ts
import { Router } from "express";
import Stripe from "stripe";
import { prisma } from "../config/prisma.js";
import { requireAdminKey } from "../core/security/admin.js";

const router = Router();

// ✅ Stripe SDK（你的版本要求 apiVersion = "2026-01-28.clover"）
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-01-28.clover",
});

function appUrl() {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

/**
 * ✅ 先沿用你 admin.ts 的 default org 策略（后续再做 user->org / RBAC）
 */
async function getOrCreateDefaultOrg() {
  const bySlug = await prisma.organization.findUnique({
    where: { slug: "default" },
    select: { id: true, slug: true, name: true },
  });
  if (bySlug) return bySlug;

  const any = await prisma.organization.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true, slug: true, name: true },
  });
  if (any) return any;

  const created = await prisma.organization.create({
    data: { slug: "default", name: "Default Org" } as any,
    select: { id: true, slug: true, name: true },
  });

  return created;
}

async function getOrCreateBilling(orgId: string) {
  const existing = await prisma.orgBilling.findUnique({
    where: { orgId },
  });
  if (existing) return existing;

  return prisma.orgBilling.create({
    data: { orgId, plan: "free", status: "inactive" } as any,
  });
}

/**
 * GET /v1/billing/status?userEmail=...
 * 用于 web 展示 plan/status
 */
router.get("/status", requireAdminKey, async (req, res) => {
  const userEmail = String(req.query.userEmail || "").trim().toLowerCase();
  if (!userEmail) return res.status(400).json({ success: false, error: "userEmail required" });

  const org = await getOrCreateDefaultOrg();
  const billing = await getOrCreateBilling(org.id);

  return res.json({ success: true, data: billing, org });
});

/**
 * POST /v1/billing/checkout
 * body: { userEmail, priceId }
 * 返回 checkout session url
 */
router.post("/checkout", requireAdminKey, async (req, res) => {
  const userEmail = String(req.body?.userEmail || "").trim().toLowerCase();
  const priceId = String(req.body?.priceId || "").trim();
  if (!userEmail || !priceId) {
    return res.status(400).json({ success: false, error: "userEmail & priceId required" });
  }

  const org = await getOrCreateDefaultOrg();
  const billing = await getOrCreateBilling(org.id);

  // ✅ customer
  let customerId = billing.stripeCustomerId || null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: { orgId: org.id, orgSlug: org.slug },
    });
    customerId = customer.id;

    await prisma.orgBilling.update({
      where: { orgId: org.id },
      data: { stripeCustomerId: customerId },
    });
  }

  // ✅ checkout session
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl()}/billing?success=1`,
    cancel_url: `${appUrl()}/billing?canceled=1`,
    allow_promotion_codes: true,
    metadata: { orgId: org.id, userEmail },
  } as any);

  return res.json({ success: true, data: { url: (session as any).url } });
});

/**
 * POST /v1/billing/portal
 * body: { userEmail }
 * 返回 customer portal url
 */
router.post("/portal", requireAdminKey, async (req, res) => {
  const userEmail = String(req.body?.userEmail || "").trim().toLowerCase();
  if (!userEmail) return res.status(400).json({ success: false, error: "userEmail required" });

  const org = await getOrCreateDefaultOrg();
  const billing = await getOrCreateBilling(org.id);

  if (!billing.stripeCustomerId) {
    return res.status(400).json({ success: false, error: "no stripe customer yet" });
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: billing.stripeCustomerId,
    return_url: `${appUrl()}/billing`,
  } as any);

  return res.json({ success: true, data: { url: (portal as any).url } });
});

export default router;

/**
 * ✅ Webhook handler
 * 注意：index.ts 里必须用 express.raw({ type: "application/json" }) 绑定这个 handler
 */
export async function handleStripeWebhook(req: any, res: any) {
  const sig = req.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET || "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 订阅创建/更新：同步到 OrgBilling
  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;

    const orgId = String((sub as any).metadata?.orgId || "");
    if (orgId) {
      const priceId = String((sub as any).items?.data?.[0]?.price?.id || "");

      const plan =
        priceId === process.env.STRIPE_PRICE_TEAM
          ? "team"
          : priceId === process.env.STRIPE_PRICE_PRO
          ? "pro"
          : "custom";

      // ✅ Stripe types 在你版本里不暴露 current_period_end：用 any 读取
      const cpe = (sub as any).current_period_end as number | undefined;

      await prisma.orgBilling.upsert({
        where: { orgId },
        update: {
          stripeCustomerId: String((sub as any).customer),
          stripeSubId: String((sub as any).id),
          plan,
          status: String((sub as any).status),
          currentPeriodEnd: cpe ? new Date(cpe * 1000) : null,
        } as any,
        create: {
          orgId,
          stripeCustomerId: String((sub as any).customer),
          stripeSubId: String((sub as any).id),
          plan,
          status: String((sub as any).status),
          currentPeriodEnd: cpe ? new Date(cpe * 1000) : null,
        } as any,
      });
    }
  }

  // 订阅取消：标记状态
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const orgId = String((sub as any).metadata?.orgId || "");
    if (orgId) {
      await prisma.orgBilling.update({
        where: { orgId },
        data: { status: "canceled" } as any,
      });
    }
  }

  return res.json({ received: true });
}