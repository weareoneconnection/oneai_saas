import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import { requireApiKey } from "../core/security/auth.js";
import { rateLimitRedisTcp } from "../core/security/rateLimitRedis.js";
import { getTaskCatalog } from "../core/tasks/catalog.js";

const router = Router();

const targetExecutorSchema = z
  .enum(["oneclaw", "bot", "external", "human"])
  .default("external");

const riskSchema = z.enum(["low", "medium", "high"]).default("medium");

const agentPlanSchema = z.object({
  objective: z.string().min(1).max(2000),
  context: z.any().optional(),
  constraints: z.array(z.string().min(1).max(500)).max(20).optional(),
  targetExecutor: targetExecutorSchema.optional(),
  riskLevel: riskSchema.optional(),
  approvalRequired: z.boolean().optional(),
});

const handoffPreviewSchema = z.object({
  plan: z.any().optional(),
  objective: z.string().min(1).max(2000).optional(),
  targetExecutor: targetExecutorSchema.optional(),
  approvalRequired: z.boolean().optional(),
  proofRequired: z.array(z.string().min(1).max(500)).max(20).optional(),
  callbackUrl: z.string().url().optional(),
});

const contextPreviewSchema = z.object({
  threadId: z.string().min(1).max(200).optional(),
  customerId: z.string().min(1).max(200).optional(),
  userId: z.string().min(1).max(200).optional(),
  context: z.any().optional(),
  memoryHints: z.array(z.string().min(1).max(500)).max(50).optional(),
  retrievalContext: z.array(z.any()).max(50).optional(),
  policyHints: z.array(z.string().min(1).max(500)).max(20).optional(),
});

function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

function now() {
  return new Date().toISOString();
}

function taskCapabilityType(task: any) {
  if (task.category === "execution_planning") return "planning";
  if (task.type === "custom_task_designer") return "design";
  if (task.type === "support_brain") return "coordination";
  return "intelligence";
}

function taskTargetExecutor(task: any) {
  if (task.type === "oneclaw_execute" || task.type === "execution_plan") return "oneclaw";
  return "external";
}

function capabilityFromTask(task: any) {
  return {
    id: `task:${task.type}`,
    object: "capability",
    name: task.name,
    type: taskCapabilityType(task),
    task: task.type,
    route: "/v1/generate",
    category: task.category,
    tier: task.tier,
    maturity: task.maturity,
    executionBoundary: task.executionBoundary || "intelligence_only",
    targetExecutor: taskTargetExecutor(task),
    supports: {
      structuredOutput: !!task.hasOutputSchema,
      inputSchema: !!task.hasInputSchema,
      llmOptions: !!task.supportsLLMOptions,
      debugTrace: !!task.supportsDebug,
      handoffPreview: task.category === "execution_planning" || task.type === "custom_task_designer",
    },
    description: task.description,
  };
}

function buildAgentPlan(input: z.infer<typeof agentPlanSchema>) {
  const targetExecutor = input.targetExecutor || "external";
  const riskLevel = input.riskLevel || "medium";
  const approvalRequired = input.approvalRequired ?? riskLevel !== "low";

  return {
    id: id("aplan"),
    object: "agent_plan",
    createdAt: now(),
    executionBoundary: "handoff_only",
    objective: input.objective,
    context: input.context ?? null,
    constraints: input.constraints || [],
    targetExecutor,
    approvalRequired,
    risk: {
      level: riskLevel,
      notes:
        riskLevel === "high"
          ? ["Require human approval before external execution.", "Verify every action with proof."]
          : riskLevel === "medium"
            ? ["Review plan before execution.", "Track proof for external actions."]
            : ["Low-risk planning preview."],
    },
    steps: [
      {
        id: "understand_objective",
        title: "Understand objective and constraints",
        actor: "oneai",
        action: "Analyze the goal, available context, constraints, and success criteria.",
        verification: "Objective and constraints are represented in the plan.",
      },
      {
        id: "prepare_execution_plan",
        title: "Prepare execution plan",
        actor: "oneai",
        action: "Convert the objective into ordered actions for the target executor.",
        verification: "Actions are specific, bounded, and externally executable.",
      },
      {
        id: "handoff_preview",
        title: "Package handoff preview",
        actor: "oneai",
        action: "Create a handoff object for OneClaw, bot, external agent, or human operator.",
        verification: "Handoff object includes target, approval, proof, and expected result.",
      },
    ],
    proofRequired: ["execution log", "result summary"],
    expectedResult: "A reviewable plan that can be handed off without OneAI executing actions directly.",
  };
}

router.use(requireApiKey);
router.use(rateLimitRedisTcp({ windowMs: 60_000, maxPerKeyPerWindow: 120, maxPerIpPerWindow: 120 }));

router.get("/capabilities", (_req, res) => {
  const taskCapabilities = getTaskCatalog().map(capabilityFromTask);
  const agentOsCapabilities = [
    {
      id: "agent-os:agent_plan_contract",
      object: "capability",
      name: "Agent Plan Contract",
      type: "planning",
      route: "/v1/agent-plans",
      tier: "team",
      maturity: "preview",
      executionBoundary: "handoff_only",
      targetExecutor: "external",
      description: "Generate a standard agent plan contract without executing external actions.",
    },
    {
      id: "agent-os:handoff_preview",
      object: "capability",
      name: "Handoff Preview",
      type: "handoff",
      route: "/v1/handoff/preview",
      tier: "team",
      maturity: "preview",
      executionBoundary: "handoff_only",
      targetExecutor: "oneclaw | bot | external | human",
      description: "Package a plan for OneClaw, bots, external agents, or human operators.",
    },
    {
      id: "agent-os:context_preview",
      object: "capability",
      name: "Context Preview",
      type: "context",
      route: "/v1/context/preview",
      tier: "team",
      maturity: "preview",
      executionBoundary: "intelligence_only",
      targetExecutor: "oneai",
      description: "Normalize thread, customer, memory, retrieval, and policy context before task execution.",
    },
  ];

  return res.json({
    success: true,
    object: "list",
    oneai: {
      product: "Agent OS infrastructure preview",
      boundary: "OneAI plans and coordinates. OneClaw, bots, external tools, or humans execute.",
    },
    data: [...agentOsCapabilities, ...taskCapabilities],
  });
});

router.post("/agent-plans", (req, res) => {
  const parsed = agentPlanSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: "Invalid agent plan payload",
      code: "AGENT_PLAN_BAD_REQUEST",
      details: parsed.error.flatten(),
    });
  }

  return res.json({
    success: true,
    data: buildAgentPlan(parsed.data),
  });
});

router.post("/handoff/preview", (req, res) => {
  const parsed = handoffPreviewSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: "Invalid handoff preview payload",
      code: "HANDOFF_PREVIEW_BAD_REQUEST",
      details: parsed.error.flatten(),
    });
  }

  const plan =
    parsed.data.plan ||
    buildAgentPlan({
      objective: parsed.data.objective || "Prepare an execution handoff.",
      targetExecutor: parsed.data.targetExecutor,
      approvalRequired: parsed.data.approvalRequired,
    });

  return res.json({
    success: true,
    data: {
      id: id("handoff"),
      object: "handoff_preview",
      createdAt: now(),
      executionBoundary: "preview_only",
      willExecute: false,
      targetExecutor: parsed.data.targetExecutor || plan.targetExecutor || "external",
      approvalRequired: parsed.data.approvalRequired ?? plan.approvalRequired ?? true,
      callbackUrl: parsed.data.callbackUrl || null,
      plan,
      proofRequired: parsed.data.proofRequired || plan.proofRequired || ["execution log", "result summary"],
      status: "ready_for_external_executor",
      nextStep: "Send this object to OneClaw, a bot, an external agent, or a human operator for execution.",
    },
  });
});

router.post("/context/preview", (req, res) => {
  const parsed = contextPreviewSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: "Invalid context preview payload",
      code: "CONTEXT_PREVIEW_BAD_REQUEST",
      details: parsed.error.flatten(),
    });
  }

  return res.json({
    success: true,
    data: {
      id: id("ctx"),
      object: "context_preview",
      createdAt: now(),
      executionBoundary: "intelligence_only",
      threadId: parsed.data.threadId || null,
      customerId: parsed.data.customerId || null,
      userId: parsed.data.userId || null,
      context: parsed.data.context ?? null,
      memoryHints: parsed.data.memoryHints || [],
      retrievalContext: parsed.data.retrievalContext || [],
      policyHints: parsed.data.policyHints || [],
      normalized: {
        hasThread: !!parsed.data.threadId,
        hasCustomer: !!parsed.data.customerId,
        memoryHintCount: parsed.data.memoryHints?.length || 0,
        retrievalItemCount: parsed.data.retrievalContext?.length || 0,
        policyHintCount: parsed.data.policyHints?.length || 0,
      },
      nextStep: "Attach this context packet to future Task Intelligence or Agent Plan requests.",
    },
  });
});

export default router;
