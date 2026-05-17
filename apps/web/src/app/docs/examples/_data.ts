export type ExampleKey =
  | "business-strategy"
  | "content-engine"
  | "support-brain"
  | "market-research";

export type TaskExample = {
  slug: ExampleKey;
  title: string;
  task: string;
  tier: "Free" | "Pro";
  mode: "cheap" | "balanced";
  maxCostUsd: number;
  summary: string;
  bestFor: string[];
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  costAdvice: string;
  commonErrors: string[];
  prev?: { href: string; label: string };
  next?: { href: string; label: string };
};

export const examples: Record<ExampleKey, TaskExample> = {
  "business-strategy": {
    slug: "business-strategy",
    title: "Business Strategy Example",
    task: "business_strategy",
    tier: "Free",
    mode: "cheap",
    maxCostUsd: 0.03,
    summary:
      "Turn a business goal into strategy, milestones, risks, next actions, success metrics, and assumptions.",
    bestFor: ["AI feature launches", "SaaS validation", "Founder planning", "Customer-facing strategy tools"],
    input: {
      goal: "Launch a B2B AI API product in 30 days",
      audience: "SaaS builders and small teams",
      constraints: ["Keep it practical", "Prioritize fast validation", "Include risks"],
    },
    output: {
      summary: "Launch a focused B2B AI API product for SaaS builders with a 30-day validation plan.",
      strategy: ["Define the ICP and first use case", "Ship a narrow MVP", "Recruit early builders", "Measure activation and cost"],
      milestones: ["Day 5: customer interviews", "Day 15: MVP ready", "Day 25: beta feedback", "Day 30: public launch"],
      risks: ["Unclear positioning", "Unexpected model cost", "Low activation"],
      nextActions: ["Pick one landing use case", "Create demo payloads", "Invite 10 target users"],
      successMetrics: ["50 signups", "20 activated users", "cost per request below target"],
    },
    costAdvice: "Use cheap mode for first drafts and balanced mode for customer-facing strategy output.",
    commonErrors: ["Missing goal", "Audience too broad", "Constraints are vague"],
    next: { href: "/docs/examples/content-engine", label: "Content Engine" },
  },
  "content-engine": {
    slug: "content-engine",
    title: "Content Engine Example",
    task: "content_engine",
    tier: "Free",
    mode: "cheap",
    maxCostUsd: 0.03,
    summary:
      "Generate hooks, posts, CTAs, hashtags, and content variants from a product or campaign topic.",
    bestFor: ["Product launches", "Social posts", "Campaign copy", "Founder-led marketing"],
    input: {
      topic: "Announce OneAI Task Intelligence API",
      audience: "developers and SaaS builders",
      tone: "clear and practical",
      brand: "OneAI",
    },
    output: {
      angle: "Task Intelligence turns model access into business-ready AI workflows.",
      hooks: ["Stop selling raw prompts. Ship structured AI workflows.", "One API for model access and business intelligence."],
      posts: ["OneAI now turns business goals into structured Task Intelligence API outputs for SaaS teams."],
      cta: "Try the free Business Strategy and Content Engine tasks.",
      hashtags: ["#OneAI", "#AISaaS", "#TaskIntelligence"],
      variants: ["Developer launch", "Founder launch", "Enterprise trust angle"],
    },
    costAdvice: "Use cheap mode for bulk content variants. Use balanced mode when the output will be published directly.",
    commonErrors: ["Missing audience", "Tone is too generic", "Topic does not include the product or offer"],
    prev: { href: "/docs/examples/business-strategy", label: "Business Strategy" },
    next: { href: "/docs/examples/support-brain", label: "Support Brain" },
  },
  "support-brain": {
    slug: "support-brain",
    title: "Support Brain Example",
    task: "support_brain",
    tier: "Pro",
    mode: "balanced",
    maxCostUsd: 0.05,
    summary:
      "Draft customer or community replies with intent, confidence, suggested action, and context update.",
    bestFor: ["Customer support", "Community operations", "SaaS onboarding", "Knowledge-base assisted replies"],
    input: {
      message: "What is OneAI and how can my product use it?",
      context: "customer support",
      customer: "new SaaS builder",
      recentMessages: "The user is asking for a simple explanation and next step.",
    },
    output: {
      reply: "OneAI helps your product call multiple models and package common workflows into structured AI tasks.",
      intent: "product_explanation",
      confidence: 0.86,
      suggestedAction: "Offer the quickstart and invite the user to test business_strategy in Playground.",
      memoryUpdate: "Customer is evaluating OneAI for SaaS product integration.",
    },
    costAdvice: "Use balanced mode for customer-facing replies. Keep maxCostUsd low and store requestId for support audits.",
    commonErrors: ["Message is missing", "No customer context", "Expecting OneAI to execute an external action directly"],
    prev: { href: "/docs/examples/content-engine", label: "Content Engine" },
    next: { href: "/docs/examples/market-research", label: "Market Research" },
  },
  "market-research": {
    slug: "market-research",
    title: "Market Research Example",
    task: "market_research",
    tier: "Pro",
    mode: "balanced",
    maxCostUsd: 0.05,
    summary:
      "Create a structured market brief from product, audience, competitors, objective, and constraints.",
    bestFor: ["Launch positioning", "Competitor analysis", "Investor prep", "Product strategy"],
    input: {
      product: "Unified model gateway plus Task Intelligence API",
      audience: "SaaS builders",
      competitors: ["generic model gateways", "AI workflow tools"],
      objective: "Find a practical launch wedge",
    },
    output: {
      marketSummary: "SaaS builders need more than model access; they need governed task outputs they can sell.",
      targetSegments: ["AI SaaS founders", "developer tools", "support automation teams"],
      competitors: ["Model gateways", "prompt workflow tools", "agent frameworks"],
      wedge: "Position OneAI as Task Intelligence plus cost-controlled model gateway.",
      risks: ["Crowded model gateway market", "Need proof from real customer workflows"],
      recommendedNextSteps: ["Publish use cases", "Run customer pilots", "Measure task adoption"],
    },
    costAdvice: "Use balanced mode for structured research. Upgrade to premium only for high-value enterprise briefs.",
    commonErrors: ["No competitors provided", "Objective is too broad", "Expecting live web research from this task"],
    prev: { href: "/docs/examples/support-brain", label: "Support Brain" },
  },
};

export const exampleOrder: ExampleKey[] = [
  "business-strategy",
  "content-engine",
  "support-brain",
  "market-research",
];

export function makeCurl(example: TaskExample) {
  return `curl -s https://oneai-saas-api-production.up.railway.app/v1/generate \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_ONEAI_API_KEY" \\
  -H "Idempotency-Key: ${example.slug}-001" \\
  -d '${JSON.stringify({
    type: example.task,
    input: example.input,
    options: {
      llm: {
        mode: example.mode,
        maxCostUsd: example.maxCostUsd,
      },
    },
  })}' | jq`;
}
