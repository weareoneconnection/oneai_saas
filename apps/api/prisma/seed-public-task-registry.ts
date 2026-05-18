import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

config({ path: ".env" });
config({ path: "../../.env", override: false });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing. Add it to apps/api/.env or the repo root .env.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

type PublicTask = {
  task: string;
  displayName: string;
  description: string;
  category: string;
  tier: "free";
  maturity: "STABLE";
  defaultMode: "structured" | "chat";
  exampleInput: Record<string, unknown>;
};

function publicTask(
  task: string,
  displayName: string,
  description: string,
  category: string,
  defaultMode: "structured" | "chat",
  exampleInput: Record<string, unknown>
): PublicTask {
  return {
    task,
    displayName,
    description,
    category,
    tier: "free",
    maturity: "STABLE",
    defaultMode,
    exampleInput,
  };
}

const publicTasks: PublicTask[] = [
  publicTask(
    "business_strategy",
    "Business Strategy Planner",
    "Turn a business goal into a practical strategy, milestones, risks, next actions, and success metrics.",
    "business",
    "structured",
    {
      goal: "Launch a B2B AI API product in 30 days",
      audience: "SaaS builders and small teams",
      constraints: ["Keep it practical", "Prioritize fast validation", "Include risks"],
    }
  ),
  publicTask(
    "agent_plan",
    "Agent Plan",
    "Turn a goal into structured agent-ready strategy, missions, actions, and reasoning.",
    "agent",
    "structured",
    {
      goal: "Prepare a launch plan for a new AI workflow product",
      audience: "builders and operators",
    }
  ),
  publicTask(
    "mission_os",
    "Mission OS",
    "Generate a complete mission with execution, proof, review, reward, growth, and risk design.",
    "operations",
    "structured",
    {
      goal: "Launch a builder campaign for an AI product",
      audience: "builders, creators, founders",
      brand: "Customer Brand",
      constraints: ["Keep missions simple", "Make actions verifiable", "Avoid hype"],
    }
  ),
  publicTask(
    "mission",
    "Mission Builder",
    "Convert a goal into a clear mission with objective, steps, proof, and success criteria.",
    "operations",
    "structured",
    {
      goal: "Create a simple community onboarding mission",
      audience: "new users",
    }
  ),
  publicTask(
    "mission_enhancer",
    "Mission Enhancer",
    "Improve an existing mission with clearer copy, rewards, social hooks, and execution guidance.",
    "operations",
    "structured",
    {
      title: "Invite three builders",
      description: "Ask users to invite builders and submit proof.",
      goal: "Make the mission more clear and shareable",
    }
  ),
  publicTask(
    "content_engine",
    "Content Engine",
    "Generate hooks, social posts, CTAs, hashtags, and content variants for product launches and campaigns.",
    "marketing",
    "structured",
    {
      topic: "Announce a new model routing API",
      audience: "developers",
      tone: "concise and practical",
      brand: "Customer Brand",
    }
  ),
  publicTask(
    "tweet",
    "Tweet Generator",
    "Generate structured short-form social content for product, community, or launch messaging.",
    "marketing",
    "structured",
    {
      topic: "Launch a practical AI workflow API",
      tone: "clear and founder-led",
      lang: "en",
    }
  ),
  publicTask(
    "daily_vibe",
    "Daily Vibe",
    "Create a concise daily update, reflection, or community signal from a short prompt.",
    "marketing",
    "structured",
    {
      mood: "focused",
      context: "Preparing a product launch",
      lang: "en",
    }
  ),
  publicTask(
    "support_brain",
    "Customer Support Brain",
    "Generate customer support or community replies with intent, confidence, suggested action, and memory update.",
    "support",
    "chat",
    {
      message: "What does this product do and how can my team use it?",
      context: "customer support",
      customer: "new developer user",
      recentMessages: "The user is asking for a simple explanation and next step.",
    }
  ),
  publicTask(
    "identity",
    "Identity Builder",
    "Create a structured user, builder, or project identity profile from a short message.",
    "profile",
    "structured",
    {
      source: "api",
      handle: "builder_team",
      message: "We build AI tools for small SaaS teams.",
      lang: "en",
    }
  ),
  publicTask(
    "one_mirror",
    "One Mirror",
    "Reflect a product, strategy, or message into clearer positioning, risks, and next moves.",
    "strategy",
    "structured",
    {
      input: "We are building an AI brain API for model routing, task intelligence, and agent handoff.",
    }
  ),
  publicTask(
    "market_research",
    "Market Research Brief",
    "Create a structured market brief from a product, audience, competitors, context, and constraints.",
    "research",
    "structured",
    {
      product: "Unified model gateway plus task intelligence API",
      audience: "SaaS builders",
      competitors: ["generic model gateways", "AI workflow tools"],
      objective: "Find a practical launch wedge",
    }
  ),
  publicTask(
    "decision_intelligence",
    "Decision Intelligence",
    "Turn context and options into a clear recommendation with rationale, confidence, tradeoffs, risks, and next steps.",
    "decision",
    "structured",
    {
      question: "Should we launch publicly or run a private beta first?",
      options: ["public launch", "private beta"],
      context: "Small team, limited support capacity, strong early interest.",
      riskTolerance: "medium",
    }
  ),
  publicTask(
    "campaign_mission",
    "Campaign Mission Builder",
    "Design a campaign mission with steps, proof, review policy, rewards, growth loops, and risk controls.",
    "growth",
    "structured",
    {
      goal: "Launch a referral campaign for an AI SaaS product",
      audience: "builders, creators, and founders",
      brand: "Customer Brand",
      constraints: ["Keep actions verifiable", "Avoid hype", "Control reward budget"],
    }
  ),
  publicTask(
    "execution_plan",
    "Execution Plan Builder",
    "Convert a goal into a safe execution-ready plan for external tools, agents, teams, or operators. OneAI does not execute actions directly.",
    "agent",
    "structured",
    {
      goal: "Prepare a production release checklist",
      actor: "external agent or operations team",
      constraints: ["Do not execute directly", "Every action must be verifiable"],
    }
  ),
  publicTask(
    "custom_task_designer",
    "Custom Task Intelligence Designer",
    "Design a custom Task Intelligence specification for a customer's workflow, including input contract, output contract, policy, and rollout plan.",
    "custom",
    "structured",
    {
      business: "AI customer support SaaS",
      workflow: "Classify tickets and draft replies with escalation rules",
      users: "support agents and customer success managers",
    }
  ),
  publicTask(
    "market_intelligence",
    "Market Intelligence",
    "Summarize market context, sentiment, risk, and scenarios for analysis only. Not financial advice.",
    "market",
    "structured",
    {
      asset: "BTC",
      market: "crypto",
      timeframe: "short-term",
      context: "BTC is moving near a key resistance area. Analyze sentiment, risk, and possible scenarios.",
      lang: "en",
    }
  ),
  publicTask(
    "market_analysis",
    "Market Analysis",
    "Create a structured market analysis with trend, levels, risk, and scenario framing. Not financial advice.",
    "market",
    "structured",
    {
      asset: "ETH",
      market: "crypto",
      timeframe: "1D",
      priceContext: "ETH is consolidating after a strong move.",
      objective: "Provide trend, support/resistance, risks, and scenarios.",
      lang: "en",
    }
  ),
  publicTask(
    "market_decision",
    "Market Decision Support",
    "Generate decision support with action, confidence, rationale, and risk framing. Not financial advice.",
    "market",
    "structured",
    {
      asset: "BTC",
      market: "crypto",
      question: "Should I enter a trade now or wait?",
      options: ["enter now", "wait for confirmation", "avoid trade"],
      context: "BTC is near resistance, volume is mixed, and volatility is increasing.",
      riskTolerance: "medium",
      lang: "en",
    }
  ),
  publicTask(
    "lite/viral_hook",
    "Viral Hook",
    "Generate concise hooks for social posts, launches, and creator campaigns.",
    "marketing",
    "structured",
    {
      topic: "AI workflows for SaaS teams",
      audience: "founders",
      language: "en",
    }
  ),
  publicTask(
    "lite/tweet",
    "Insight Tweet",
    "Generate founder-style short social posts from a topic, audience, and tone.",
    "marketing",
    "structured",
    {
      topic: "Why AI workflows matter more than prompts",
      audience: "builders",
      language: "en",
    }
  ),
  publicTask(
    "lite/thread",
    "Social Thread",
    "Generate a structured social thread for product education, launch storytelling, or thought leadership.",
    "marketing",
    "structured",
    {
      topic: "Model routing plus task intelligence",
      audience: "developers",
      language: "en",
    }
  ),
  publicTask(
    "lite/cta",
    "CTA Generator",
    "Generate concise calls to action for landing pages, launches, and community campaigns.",
    "marketing",
    "structured",
    {
      topic: "Try the OneAI Task Intelligence API",
      audience: "SaaS builders",
      language: "en",
    }
  ),
  publicTask(
    "lite/reply",
    "Social Reply",
    "Generate helpful replies for social or community conversations.",
    "marketing",
    "structured",
    {
      message: "Someone asked what OneAI does.",
      tone: "helpful and concise",
      language: "en",
    }
  ),
  publicTask(
    "lite/debate",
    "Debate Reply",
    "Generate constructive debate responses with a clear point of view.",
    "marketing",
    "structured",
    {
      topic: "AI tools versus AI workflows",
      stance: "workflows create more leverage",
      language: "en",
    }
  ),
  publicTask(
    "lite/launch",
    "Launch Copy",
    "Generate launch posts for products, waitlists, and early access campaigns.",
    "marketing",
    "structured",
    {
      topic: "OneAI Task Intelligence API",
      audience: "developers",
      goal: "announce early access",
      language: "en",
    }
  ),
  publicTask(
    "studio_lite_strategy",
    "Studio Lite Strategy",
    "Create a lightweight content strategy for launch, distribution, and audience development.",
    "marketing",
    "structured",
    {
      product: "AI workflow API",
      audience: "SaaS builders",
      goal: "build launch awareness",
      language: "en",
    }
  ),
  publicTask(
    "studio_lite_distribution",
    "Studio Lite Distribution",
    "Create a practical distribution plan for content, launch posts, and community channels.",
    "marketing",
    "structured",
    {
      content: "Launch announcement for an AI workflow API",
      channels: ["x", "community", "email"],
      language: "en",
    }
  ),
  publicTask(
    "studio_lite_feedback",
    "Studio Lite Feedback",
    "Review content and provide concise improvement feedback.",
    "marketing",
    "structured",
    {
      draft: "We built an AI API for smarter workflows.",
      goal: "make it clearer and more specific",
      language: "en",
    }
  ),
  publicTask(
    "studio_lite_pack",
    "Studio Lite Pack",
    "Generate a complete lightweight social content pack with hooks, posts, threads, replies, and CTAs.",
    "marketing",
    "structured",
    {
      topic: "Launch a task intelligence API",
      audience: "founders and developers",
      language: "en",
    }
  ),
];

async function main() {
  await prisma.taskRegistry.updateMany({
    data: {
      enabled: false,
    },
  });

  for (const item of publicTasks) {
    await prisma.taskRegistry.upsert({
      where: {
        task: item.task,
      },
      update: {
        ...item,
        enabled: true,
      },
      create: {
        ...item,
        enabled: true,
      },
    });
  }

  console.log(`Enabled ${publicTasks.length} public commercial task records.`);
  console.log("All other TaskRegistry records are hidden from /v1/tasks.");
  console.log("Existing internal workflows remain callable by their original task type.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
