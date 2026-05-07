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

const publicTasks = [
  {
    task: "business_strategy",
    displayName: "Business Strategy Planner",
    description:
      "Turn a business goal into a practical strategy, milestones, risks, next actions, and success metrics.",
    category: "business",
    tier: "free",
    maturity: "STABLE" as const,
    defaultMode: "structured",
    exampleInput: {
      goal: "Launch a B2B AI API product in 30 days",
      audience: "SaaS builders and small teams",
      constraints: ["Keep it practical", "Prioritize fast validation", "Include risks"],
    },
  },
  {
    task: "campaign_mission",
    displayName: "Campaign Mission Builder",
    description:
      "Design a campaign mission with steps, proof, review policy, rewards, growth loops, and risk controls.",
    category: "growth",
    tier: "pro",
    maturity: "STABLE" as const,
    defaultMode: "structured",
    exampleInput: {
      goal: "Launch a referral campaign for an AI SaaS product",
      audience: "builders, creators, and founders",
      brand: "Customer Brand",
      constraints: ["Keep actions verifiable", "Avoid hype", "Control reward budget"],
    },
  },
  {
    task: "content_engine",
    displayName: "Content Engine",
    description:
      "Generate hooks, social posts, CTAs, hashtags, and content variants for product launches and campaigns.",
    category: "marketing",
    tier: "free",
    maturity: "STABLE" as const,
    defaultMode: "structured",
    exampleInput: {
      topic: "Announce a new model routing API",
      audience: "developers",
      tone: "concise and practical",
      brand: "Customer Brand",
    },
  },
  {
    task: "support_brain",
    displayName: "Customer Support Brain",
    description:
      "Generate customer support or community replies with intent, confidence, suggested action, and memory update.",
    category: "support",
    tier: "pro",
    maturity: "STABLE" as const,
    defaultMode: "chat",
    exampleInput: {
      message: "What does this product do and how can my team use it?",
      context: "community",
      customer: "new developer user",
      recentMessages: "The user is asking for a simple explanation and next step.",
    },
  },
  {
    task: "market_research",
    displayName: "Market Research Brief",
    description:
      "Create a structured market brief from a product, audience, competitors, context, and constraints.",
    category: "research",
    tier: "pro",
    maturity: "STABLE" as const,
    defaultMode: "structured",
    exampleInput: {
      product: "Unified model gateway plus task intelligence API",
      audience: "SaaS builders",
      competitors: ["generic model gateways", "AI workflow tools"],
      objective: "Find a practical launch wedge",
    },
  },
  {
    task: "decision_intelligence",
    displayName: "Decision Intelligence",
    description:
      "Turn context and options into a clear recommendation with rationale, confidence, tradeoffs, risks, and next steps.",
    category: "decision",
    tier: "pro",
    maturity: "STABLE" as const,
    defaultMode: "structured",
    exampleInput: {
      question: "Should we launch publicly or run a private beta first?",
      options: ["public launch", "private beta"],
      context: "Small team, limited support capacity, strong early interest.",
      riskTolerance: "medium",
    },
  },
  {
    task: "execution_plan",
    displayName: "Execution Plan Builder",
    description:
      "Convert a goal into a safe execution-ready plan for external tools, agents, teams, or OneClaw. OneAI does not execute actions directly.",
    category: "operations",
    tier: "team",
    maturity: "STABLE" as const,
    defaultMode: "structured",
    exampleInput: {
      goal: "Prepare a production release checklist",
      actor: "external agent or operations team",
      constraints: ["Do not execute directly", "Every action must be verifiable"],
    },
  },
  {
    task: "custom_task_designer",
    displayName: "Custom Task Intelligence Designer",
    description:
      "Design a custom Task Intelligence specification for a customer's workflow, including input contract, output contract, policy, and rollout plan.",
    category: "custom",
    tier: "team",
    maturity: "STABLE" as const,
    defaultMode: "structured",
    exampleInput: {
      business: "AI customer support SaaS",
      workflow: "Classify tickets and draft replies with escalation rules",
      users: "support agents and customer success managers",
    },
  },
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
