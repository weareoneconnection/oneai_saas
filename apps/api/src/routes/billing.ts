// apps/api/src/routes/billing.ts
import { Router } from "express";
import Stripe from "stripe";
import { prisma } from "../config/prisma.js";
import { requireAdminKey } from "../core/security/admin.js";
import { getOrCreateOrgForUserEmail } from "../core/orgs/ensureOrg.js";
import { applyPlanPolicyOverrides, getPlanPolicy } from "../core/billing/planPolicy.js";

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

function planFromPriceId(priceId: string) {
  return allowedPriceIds().get(priceId) || "custom";
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

function clientMeta(req: any) {
  return {
    ip: String(req?.ip || req?.headers?.["x-forwarded-for"] || "").slice(0, 120) || null,
    userAgent: String(req?.headers?.["user-agent"] || "").slice(0, 500) || null,
  };
}

async function writeBillingAudit(params: {
  orgId?: string | null;
  userEmail?: string | null;
  action: string;
  target?: string | null;
  metadata?: Record<string, unknown>;
  req?: any;
}) {
  try {
    const meta = params.req ? clientMeta(params.req) : { ip: null, userAgent: null };
    await prisma.auditLog.create({
      data: {
        ...(params.orgId ? { org: { connect: { id: params.orgId } } } : {}),
        action: params.action,
        target: params.target || params.userEmail || null,
        metadata: {
          ...(params.metadata || {}),
          ...(params.userEmail ? { userEmail: String(params.userEmail).toLowerCase() } : {}),
        },
        ip: meta.ip,
        userAgent: meta.userAgent,
      } as any,
    });
  } catch (err) {
    console.error("[billing] failed to write audit log", err);
  }
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

async function syncSubscriptionToBilling(
  subscription: any,
  fallback?: { orgId?: string; userEmail?: string; plan?: string }
) {
  const orgId = String(subscription?.metadata?.orgId || fallback?.orgId || "");
  if (!orgId) {
    console.warn("[billing] Stripe subscription event has no orgId", {
      subscriptionId: subscription?.id,
      customer: subscription?.customer,
    });
    return null;
  }

  const priceId = String(subscription?.items?.data?.[0]?.price?.id || "");
  const plan = String(subscription?.metadata?.plan || fallback?.plan || planFromPriceId(priceId));
  const currentPeriodStart = subscription?.current_period_start
    ? new Date(Number(subscription.current_period_start) * 1000)
    : null;
  const currentPeriodEnd = subscription?.current_period_end
    ? new Date(Number(subscription.current_period_end) * 1000)
    : null;

  const billing = await prisma.orgBilling.upsert({
    where: { orgId },
    update: {
      stripeCustomerId: String(subscription.customer || ""),
      stripeSubId: String(subscription.id || ""),
      plan,
      status: String(subscription.status || "inactive"),
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    } as any,
    create: {
      orgId,
      stripeCustomerId: String(subscription.customer || ""),
      stripeSubId: String(subscription.id || ""),
      plan,
      status: String(subscription.status || "inactive"),
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    } as any,
  });

  await writeBillingAudit({
    orgId,
    userEmail: String(subscription?.metadata?.userEmail || fallback?.userEmail || ""),
    action: "billing.subscription.synced",
    target: String(subscription.id || ""),
    metadata: {
      plan,
      status: String(subscription.status || "inactive"),
      stripeCustomerId: String(subscription.customer || ""),
      stripeSubId: String(subscription.id || ""),
      currentPeriodEnd: currentPeriodEnd?.toISOString() || null,
      cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    },
  });

  return billing;
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
  const billingIsActive = ["active", "trialing"].includes(String(billing.status));
  const plan = billingIsActive ? billing.plan || "free" : "free";
  const policy = applyPlanPolicyOverrides(getPlanPolicy(plan), billingIsActive ? billing : null);
  const from = monthStartUtc();

  const [usage, activeKeys, auditLogs] = await Promise.all([
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
    prisma.auditLog.findMany({
      where: {
        orgId: org.id,
        action: {
          in: [
            "billing.checkout.requested",
            "billing.checkout.session_created",
            "billing.checkout.completed",
            "billing.portal.opened",
            "billing.subscription.synced",
            "billing.subscription.deleted",
            "billing.stripe.customer_created",
          ],
        },
      } as any,
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        action: true,
        target: true,
        metadata: true,
        createdAt: true,
      } as any,
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
      checkout: {
        enabled: stripeConfigStatus().secretKey && stripeConfigStatus().pricePro && stripeConfigStatus().priceTeam,
        portalAvailable: Boolean(billing.stripeCustomerId),
      },
      auditLogs,
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

  await writeBillingAudit({
    orgId: org.id,
    userEmail,
    action: "billing.checkout.requested",
    target: pricePlan,
    metadata: { priceId, plan: pricePlan },
    req,
  });

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

    await writeBillingAudit({
      orgId: org.id,
      userEmail,
      action: "billing.stripe.customer_created",
      target: customerId,
      metadata: { plan: pricePlan },
      req,
    });
  }

  // ✅ checkout session
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: org.id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl()}/billing?success=1`,
    cancel_url: `${appUrl()}/billing?canceled=1`,
    allow_promotion_codes: true,
    metadata: { orgId: org.id, userEmail, plan: pricePlan },
    subscription_data: {
      metadata: { orgId: org.id, userEmail, plan: pricePlan },
    },
  } as any);

  await writeBillingAudit({
    orgId: org.id,
    userEmail,
    action: "billing.checkout.session_created",
    target: String((session as any).id || ""),
    metadata: {
      priceId,
      plan: pricePlan,
      stripeCustomerId: customerId,
      urlCreated: Boolean((session as any).url),
    },
    req,
  });

  return res.json({
    success: true,
    data: {
      url: (session as any).url,
      plan: pricePlan,
      sessionId: (session as any).id,
    },
  });
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

  if (!stripeConfigStatus().secretKey) {
    return res.status(500).json({
      success: false,
      error: "Stripe portal is not configured: secretKey",
      code: "STRIPE_CONFIG_MISSING",
      retryable: false,
    });
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: billing.stripeCustomerId,
    return_url: `${appUrl()}/billing`,
  } as any);

  await writeBillingAudit({
    orgId: org.id,
    userEmail,
    action: "billing.portal.opened",
    target: billing.stripeCustomerId,
    metadata: {
      plan: billing.plan,
      status: billing.status,
    },
    req,
  });

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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const subscriptionId = String(session.subscription || "");
    const orgId = String(session.metadata?.orgId || session.client_reference_id || "");
    const userEmail = String(session.metadata?.userEmail || "");

    await writeBillingAudit({
      orgId,
      userEmail,
      action: "billing.checkout.completed",
      target: String(session.id || ""),
      metadata: {
        plan: String(session.metadata?.plan || ""),
        subscriptionId,
        stripeCustomerId: String(session.customer || ""),
        paymentStatus: String(session.payment_status || ""),
      },
    });

    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await syncSubscriptionToBilling(subscription as any, {
        orgId,
        userEmail,
        plan: String(session.metadata?.plan || ""),
      });
    }
  }

  // 订阅创建/更新：同步到 OrgBilling
  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    await syncSubscriptionToBilling(sub as any);
  }

  // 订阅取消：标记状态
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const orgId = String((sub as any).metadata?.orgId || "");
    if (orgId) {
      await prisma.orgBilling.update({
        where: { orgId },
        data: {
          status: "canceled",
          cancelAtPeriodEnd: Boolean((sub as any).cancel_at_period_end),
        } as any,
      });
      await writeBillingAudit({
        orgId,
        userEmail: String((sub as any).metadata?.userEmail || ""),
        action: "billing.subscription.deleted",
        target: String((sub as any).id || ""),
        metadata: {
          status: "canceled",
          cancelAtPeriodEnd: Boolean((sub as any).cancel_at_period_end),
        },
      });
    } else if ((sub as any).id) {
      await prisma.orgBilling.updateMany({
        where: { stripeSubId: String((sub as any).id) },
        data: {
          status: "canceled",
          cancelAtPeriodEnd: Boolean((sub as any).cancel_at_period_end),
        } as any,
      });
      await writeBillingAudit({
        action: "billing.subscription.deleted",
        target: String((sub as any).id || ""),
        metadata: {
          status: "canceled",
          cancelAtPeriodEnd: Boolean((sub as any).cancel_at_period_end),
          matchedBy: "stripeSubId",
        },
      });
    }
  }

  return res.json({ received: true });
}
