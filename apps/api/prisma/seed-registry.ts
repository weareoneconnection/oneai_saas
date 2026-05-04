import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Load env from both possible locations.
// This makes the script work whether you run it from apps/api or repo root.
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

const models = [
  {
    provider: "openai",
    model: "gpt-4.1-mini",
    displayName: "GPT-4.1 Mini",
    description: "Fast, cost-efficient OpenAI model for production workloads.",
    status: "ACTIVE" as const,
    contextTokens: 1047576,
    supportsStreaming: true,
    supportsJson: true,
    supportsTools: true,
    supportsVision: true,
    configured: false,
    available: true,
    hasPricing: true,
  },
  {
    provider: "openai",
    model: "gpt-4.1",
    displayName: "GPT-4.1",
    description: "High-capability OpenAI model for complex reasoning and generation.",
    status: "ACTIVE" as const,
    supportsStreaming: true,
    supportsJson: true,
    supportsTools: true,
    supportsVision: true,
    configured: false,
    available: true,
    hasPricing: true,
  },
  {
    provider: "anthropic",
    model: "claude-3-5-sonnet",
    displayName: "Claude 3.5 Sonnet",
    description: "Anthropic model for reasoning, coding, and structured outputs.",
    status: "ACTIVE" as const,
    supportsStreaming: true,
    supportsJson: true,
    supportsTools: true,
    supportsVision: true,
    configured: false,
    available: true,
    hasPricing: true,
  },
  {
    provider: "google",
    model: "gemini-1.5-pro",
    displayName: "Gemini 1.5 Pro",
    description: "Google Gemini model for long-context and multimodal tasks.",
    status: "ACTIVE" as const,
    supportsStreaming: true,
    supportsJson: true,
    supportsTools: true,
    supportsVision: true,
    configured: false,
    available: true,
    hasPricing: true,
  },
  {
    provider: "deepseek",
    model: "deepseek-chat",
    displayName: "DeepSeek Chat",
    description: "DeepSeek chat model for cost-efficient general generation.",
    status: "ACTIVE" as const,
    supportsStreaming: true,
    supportsJson: true,
    supportsTools: false,
    supportsVision: false,
    configured: false,
    available: true,
    hasPricing: true,
  },
  {
    provider: "openrouter",
    model: "auto",
    displayName: "OpenRouter Auto",
    description: "OpenRouter automatic routing profile.",
    status: "ACTIVE" as const,
    supportsStreaming: true,
    supportsJson: true,
    supportsTools: false,
    supportsVision: false,
    configured: false,
    available: true,
    hasPricing: false,
  },
];

const tasks = [
  {
    task: "agent_plan",
    displayName: "Agent Plan",
    description: "Convert a user goal into a structured execution plan.",
    category: "planning",
    tier: "free",
    maturity: "STABLE" as const,
    enabled: true,
    defaultMode: "structured",
    exampleInput: {
      goal: "Launch a SaaS product in 30 days",
    },
    exampleOutput: {
      plan: [
        {
          step: "Define ICP",
          priority: "high",
          owner: "founder",
        },
      ],
      risks: [],
      next_actions: [],
    },
  },
  {
    task: "mission_os",
    displayName: "Mission OS",
    description: "Break down a mission into objectives, workstreams, risks, and next actions.",
    category: "strategy",
    tier: "pro",
    maturity: "BETA" as const,
    enabled: true,
    defaultMode: "structured",
  },
  {
    task: "waoc_chat",
    displayName: "WAOC Chat",
    description: "WAOC-style assistant response for structured strategic thinking.",
    category: "assistant",
    tier: "free",
    maturity: "STABLE" as const,
    enabled: true,
    defaultMode: "chat",
  },
  {
    task: "oneclaw_plan",
    displayName: "OneClaw Plan",
    description: "Prepare an execution plan for OneClaw-compatible task handling.",
    category: "execution",
    tier: "team",
    maturity: "BETA" as const,
    enabled: true,
    defaultMode: "structured",
  },
  {
    task: "market_decision",
    displayName: "Market Decision",
    description: "Generate a structured market decision from product, audience, and constraints.",
    category: "business",
    tier: "pro",
    maturity: "BETA" as const,
    enabled: true,
    defaultMode: "structured",
  },
  {
    task: "research_summary",
    displayName: "Research Summary",
    description: "Summarize research material into findings, evidence, risks, and recommendations.",
    category: "research",
    tier: "free",
    maturity: "BETA" as const,
    enabled: true,
    defaultMode: "structured",
  },
  {
    task: "content_strategy",
    displayName: "Content Strategy",
    description: "Create a structured content strategy for a product, campaign, or audience.",
    category: "marketing",
    tier: "pro",
    maturity: "BETA" as const,
    enabled: true,
    defaultMode: "structured",
  },
  {
    task: "customer_support_router",
    displayName: "Customer Support Router",
    description: "Classify support requests and route them to the right support workflow.",
    category: "support",
    tier: "team",
    maturity: "BETA" as const,
    enabled: true,
    defaultMode: "structured",
  },
  {
    task: "sales_assistant",
    displayName: "Sales Assistant",
    description: "Generate sales-oriented responses, qualification notes, and follow-up actions.",
    category: "sales",
    tier: "team",
    maturity: "BETA" as const,
    enabled: true,
    defaultMode: "structured",
  },
];

async function main() {
  for (const item of models) {
    await prisma.modelRegistry.upsert({
      where: {
        provider_model: {
          provider: item.provider,
          model: item.model,
        },
      },
      update: item,
      create: item,
    });
  }

  for (const item of tasks) {
    await prisma.taskRegistry.upsert({
      where: {
        task: item.task,
      },
      update: item,
      create: item,
    });
  }

  console.log(`Seeded ${models.length} model registry records.`);
  console.log(`Seeded ${tasks.length} task registry records.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
