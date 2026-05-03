// apps/api/src/routes/billing.ts
import { Router } from "express";
import Stripe from "stripe";
import { prisma } from "../config/prisma.js";
import { requireAdminKey } from "../core/security/admin.js";
import { getOrCreateOrgForUserEmail } from "../core/orgs/ensureOrg.js";
import { getPlanPolicy } from "../core/billing/planPolicy.js";

const router = Router();

// ✅ Stripe SDK（你的版本要求 apiVersion = "2026-01-28.clover"）
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-01-28.clover",
});

function isPlaceholder(value?: string | null) {
  return !value || /xxx|yyy|placeholder|replace|your_/i.test(String(value));
}

function stripeConfigStatus() {
  return {
    secretKey: !isPlaceholder(process.env.STRIPE_SECRET_KEY),
    webhookSecret: !isPlaceholder(process.env.STRIPE_WEBHOOK_SECRET),
    pricePro: !isPlaceholder(process.env.STRIPE_PRICE_PRO),
    priceTeam: !isPlaceholder(process.env.STRIPE_PRICE_TEAM),
  };
}

function assertStripeReadyForCheckout() {
  const status = stripeConfigStatus();
  if (!status.secretKey || !status.pricePro || !status.priceTeam) {
    const missing = Object.entries(status)
      .filter(([key, ok]) => key !== "webhookSecret" && !ok)
      .map(([key]) => key);
    const err = new Error(`Stripe checkout is not configured: ${missing.join(", ")}`);
    (err as any).code = "STRIPE_CONFIG_MISSING";
    throw err;
  }
}

function allowedPriceIds() {
  return new Map<string, string>([
    [String(process.env.STRIPE_PRICE_PRO || ""), "pro"],
    [String(process.env.STRIPE_PRICE_TEAM || ""), "team"],
  ]);
}

function appUrl() {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

function monthStartUtc() {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
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

  const org = await getOrCreateOrgForUserEmail(userEmail);
  const billing = await getOrCreateBilling(org.id);
  const plan =
    ["active", "trialing"].includes(String(billing.status))
      ? billing.plan || "free"
      : "free";
  const policy = getPlanPolicy(plan);
  const from = monthStartUtc();

  const [usage, activeKeys] = await Promise.all([
    prisma.request.aggregate({
      where: {
        orgId: org.id,
        createdAt: { gte: from },
      },
      _count: { _all: true },
      _sum: {
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
        estimatedCostUsd: true,
      },
    }),
    prisma.apiKey.count({
      where: {
        orgId: org.id,
        status: "ACTIVE",
        revokedAt: null,
      },
    }),
  ]);

  const requestCount = usage._count._all || 0;
  const costUsd = Number(usage._sum.estimatedCostUsd || 0);

  return res.json({
    success: true,
    data: {
      ...billing,
      effectivePlan: plan,
      policy,
      monthUsage: {
        fromISO: from.toISOString(),
        requestCount,
        promptTokens: usage._sum.promptTokens || 0,
        completionTokens: usage._sum.completionTokens || 0,
        totalTokens: usage._sum.totalTokens || 0,
        costUsd,
        activeKeys,
      },
      remaining: {
        requests: Math.max(0, policy.monthlyRequestLimit - requestCount),
        costUsd: Math.max(0, policy.monthlyCostLimitUsd - costUsd),
      },
      stripeConfig: stripeConfigStatus(),
    },
    org,
  });
});

router.get("/config", requireAdminKey, (_req, res) => {
  return res.json({
    success: true,
    data: stripeConfigStatus(),
  });
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

  try {
    assertStripeReadyForCheckout();
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || "Stripe checkout is not configured",
      code: err?.code || "STRIPE_CONFIG_MISSING",
      retryable: false,
    });
  }

  const pricePlan = allowedPriceIds().get(priceId);
  if (!pricePlan) {
    return res.status(400).json({
      success: false,
      error: "priceId is not allowed for this OneAI environment",
      code: "STRIPE_PRICE_NOT_ALLOWED",
      retryable: false,
    });
  }

  const org = await getOrCreateOrgForUserEmail(userEmail);
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
    metadata: { orgId: org.id, userEmail, plan: pricePlan },
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

  const org = await getOrCreateOrgForUserEmail(userEmail);
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

  if (isPlaceholder(secret)) {
    return res.status(500).send("Webhook Error: STRIPE_WEBHOOK_SECRET is not configured");
  }

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
