import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "../config/prisma.js";
import { requireApiKey, type AuthedRequest } from "../core/security/auth.js";
import { rateLimitRedisTcp } from "../core/security/rateLimitRedis.js";
import { getTaskCatalog } from "../core/tasks/catalog.js";

const router = Router();

const targetExecutorSchema = z
  .enum(["oneclaw", "openclaw", "bot", "external", "human"])
  .default("external");

const riskSchema = z.enum(["low", "medium", "high"]).default("medium");
const approvalModeSchema = z.enum(["manual", "auto"]).default("manual");
const approvalStatusSchema = z.enum(["PENDING_APPROVAL", "APPROVED", "REJECTED"]);
const executionStatusSchema = z.enum(["RUNNING", "SUCCEEDED", "FAILED", "CANCELED"]);

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

const handoffContractSchema = handoffPreviewSchema.extend({
  riskLevel: riskSchema.optional(),
  approvalMode: approvalModeSchema.optional(),
  autoApproveRiskMax: riskSchema.optional(),
  executorProtocol: z.enum(["oneclaw.v1", "openclaw.v1", "bot.v1", "external.v1", "human.v1"]).optional(),
  expectedActions: z.array(z.string().min(1).max(200)).max(50).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const approvalSchema = z.object({
  status: approvalStatusSchema.default("APPROVED"),
  approvedBy: z.string().min(1).max(200).optional(),
  reason: z.string().max(1000).optional(),
});

const proofSchema = z.object({
  executorType: targetExecutorSchema.optional(),
  executorRunId: z.string().min(1).max(240).optional(),
  status: executionStatusSchema.optional(),
  proof: z.object({
    artifacts: z.array(z.any()).max(50).default([]),
    summary: z.string().max(4000).optional(),
    verified: z.boolean().optional(),
    verifier: z.string().max(200).optional(),
  }),
});

const resultSchema = z.object({
  executorType: targetExecutorSchema.optional(),
  executorRunId: z.string().min(1).max(240).optional(),
  status: executionStatusSchema.default("SUCCEEDED"),
  result: z.any(),
  error: z.string().max(4000).optional(),
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

function getOrgId(req: AuthedRequest): string | null {
  return req.auth?.orgId || req.auth?.apiKey?.orgId || null;
}

function getApiKeyId(req: AuthedRequest): string | null {
  return req.auth?.apiKeyId || req.auth?.apiKey?.id || null;
}

function riskRank(risk: string) {
  return risk === "high" ? 3 : risk === "medium" ? 2 : 1;
}

function executorProtocolFor(executor: string) {
  if (executor === "oneclaw") return "oneclaw.v1";
  if (executor === "openclaw") return "openclaw.v1";
  if (executor === "bot") return "bot.v1";
  if (executor === "human") return "human.v1";
  return "external.v1";
}

function approvalDecision(params: {
  riskLevel: string;
  approvalRequired?: boolean;
  approvalMode?: "manual" | "auto";
  autoApproveRiskMax?: string;
}) {
  const required = params.approvalRequired ?? params.riskLevel !== "low";
  const mode = params.approvalMode || "manual";
  const autoApproveRiskMax = params.autoApproveRiskMax || "low";
  const autoApproved =
    !required || (mode === "auto" && riskRank(params.riskLevel) <= riskRank(autoApproveRiskMax));

  return {
    mode,
    required,
    autoApproveRiskMax,
    status: autoApproved ? "APPROVED" : "PENDING_APPROVAL",
    reason: autoApproved
      ? "Approved by Agent OS policy. OneAI still does not execute external actions."
      : "Manual approval required before an executor acts.",
  };
}

async function writeAgentOsAudit(req: AuthedRequest, action: string, target: string, metadata: any) {
  try {
    await prisma.auditLog.create({
      data: {
        ...(getOrgId(req) ? { org: { connect: { id: getOrgId(req)! } } } : {}),
        ...(getApiKeyId(req) ? { apiKey: { connect: { id: getApiKeyId(req)! } } } : {}),
        action,
        target,
        metadata,
        ip: String(req.ip || req.headers["x-forwarded-for"] || "").slice(0, 120) || null,
        userAgent: String(req.headers["user-agent"] || "").slice(0, 500) || null,
      } as any,
    });
  } catch (error) {
    console.error("[agent-os] failed to write audit log", error);
  }
}

async function findExecutionForRequest(req: AuthedRequest, handoffId: string) {
  return (prisma as any).agentExecution.findFirst({
    where: {
      handoffId,
      ...(getOrgId(req) ? { orgId: getOrgId(req) } : {}),
    },
  });
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

function buildHandoffContract(input: z.infer<typeof handoffContractSchema>, plan: any) {
  const targetExecutor = input.targetExecutor || plan.targetExecutor || "external";
  const riskLevel = input.riskLevel || plan.risk?.level || "medium";
  const approval = approvalDecision({
    riskLevel,
    approvalRequired: input.approvalRequired ?? plan.approvalRequired,
    approvalMode: input.approvalMode,
    autoApproveRiskMax: input.autoApproveRiskMax,
  });
  const protocol = input.executorProtocol || executorProtocolFor(targetExecutor);

  return {
    id: id("handoff"),
    object: "handoff_contract",
    schemaVersion: "oneai.handoff.v1",
    protocolVersion: "oneai.agent_os.v1",
    createdAt: now(),
    executionBoundary: "external_execution_only",
    willExecute: false,
    source: {
      system: "oneai",
      role: "intelligence_brain",
    },
    executor: {
      type: targetExecutor,
      protocol,
      expectedActions: input.expectedActions || plan.steps?.map((step: any) => step.id).filter(Boolean) || [],
    },
    approvalPolicy: approval,
    proofPolicy: {
      required: true,
      requiredArtifacts: input.proofRequired || plan.proofRequired || ["execution log", "result summary"],
      acceptedTypes: ["log", "url", "screenshot", "transaction", "json", "text"],
      reviewStatuses: ["unreviewed", "verified", "needs_review", "rejected"],
    },
    callbacks: {
      resultUrl: input.callbackUrl || null,
      proofUrl: input.callbackUrl || null,
    },
    lifecycle: [
      "CREATED",
      "PENDING_APPROVAL",
      "APPROVED",
      "READY_FOR_EXECUTOR",
      "RUNNING",
      "PROOF_RECEIVED",
      "RESULT_RECEIVED",
      "SUCCEEDED",
      "FAILED",
      "CANCELED",
    ],
    plan,
    metadata: input.metadata || {},
    status: approval.status === "APPROVED" ? "ready_for_executor" : "waiting_for_approval",
    nextStep:
      approval.status === "APPROVED"
        ? "Send this contract to OneClaw, OpenClaw, a bot, an external agent, or a human operator."
        : "Approve this contract before sending it to an external executor.",
  };
}

function executorProtocol() {
  return {
    object: "executor_protocol",
    protocolVersion: "oneai.agent_os.v1",
    supportedExecutors: ["oneclaw.v1", "openclaw.v1", "bot.v1", "external.v1", "human.v1"],
    boundary: "OneAI plans, approves, records, and verifies. Executors perform external actions.",
    handoffContract: {
      requiredFields: ["id", "schemaVersion", "protocolVersion", "executor", "approvalPolicy", "proofPolicy", "plan"],
      executionBoundary: "external_execution_only",
      willExecute: false,
    },
    executorCallbacks: {
      proof: "POST /v1/executions/{handoffId}/proof",
      result: "POST /v1/executions/{handoffId}/result",
      approval: "POST /v1/executions/{handoffId}/approval",
    },
    lifecycle: [
      "contract_created",
      "approval_decided",
      "executor_started",
      "proof_received",
      "proof_reviewed",
      "result_received",
      "ledger_closed",
    ],
    approvalModes: ["manual", "auto"],
    approvalStatuses: ["PENDING_APPROVAL", "APPROVED", "REJECTED"],
    resultStatuses: ["RUNNING", "SUCCEEDED", "FAILED", "CANCELED"],
    proofTypes: ["log", "url", "screenshot", "transaction", "json", "text"],
    proofReviewStatuses: ["unreviewed", "verified", "needs_review", "rejected"],
    securityModel: {
      authentication: "x-api-key",
      scope: "handoff records are isolated by organization/api key ownership",
      execution: "OneAI never performs external actions through this protocol",
      audit: "approval, proof, and result callbacks are written to audit logs where available",
    },
    executorRequirements: [
      "Store the handoff id for callbacks.",
      "Do not execute when approvalPolicy.status is PENDING_APPROVAL or REJECTED.",
      "Send proof before or with the final result when proofPolicy.required is true.",
      "Include executorRunId for idempotent operational tracing.",
      "Return only verifiable result metadata; secrets must stay outside callbacks.",
    ],
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
      id: "agent-os:handoff_contract",
      object: "capability",
      name: "Standard Handoff Contract",
      type: "handoff",
      route: "/v1/handoff/contracts",
      tier: "enterprise",
      maturity: "preview",
      executionBoundary: "external_execution_only",
      targetExecutor: "oneclaw | openclaw | bot | external | human",
      description: "Create a stored Agent OS handoff contract with approval, proof, and result callbacks.",
    },
    {
      id: "agent-os:execution_result_ledger",
      object: "capability",
      name: "Execution Result Ledger",
      type: "verification",
      route: "/v1/executions/{handoffId}/result",
      tier: "enterprise",
      maturity: "preview",
      executionBoundary: "record_only",
      targetExecutor: "external",
      description: "Record executor proof and final result without letting OneAI perform the action.",
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

router.get("/executor-protocol", (_req, res) => {
  return res.json({
    success: true,
    data: executorProtocol(),
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

router.post("/handoff/contracts", async (req, res) => {
  const r = req as AuthedRequest;
  const parsed = handoffContractSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: "Invalid handoff contract payload",
      code: "HANDOFF_CONTRACT_BAD_REQUEST",
      details: parsed.error.flatten(),
    });
  }

  const plan =
    parsed.data.plan ||
    buildAgentPlan({
      objective: parsed.data.objective || "Prepare an execution handoff.",
      targetExecutor: parsed.data.targetExecutor,
      riskLevel: parsed.data.riskLevel,
      approvalRequired: parsed.data.approvalRequired,
    });
  const contract = buildHandoffContract(parsed.data, plan);

  try {
    const record = await (prisma as any).agentExecution.create({
      data: {
        ...(getOrgId(r) ? { org: { connect: { id: getOrgId(r)! } } } : {}),
        ...(getApiKeyId(r) ? { apiKey: { connect: { id: getApiKeyId(r)! } } } : {}),
        handoffId: contract.id,
        agentPlanId: plan.id || null,
        protocolVersion: contract.protocolVersion,
        executorType: contract.executor.type,
        objective: plan.objective || parsed.data.objective || "Execution handoff",
        status: contract.approvalPolicy.status,
        approvalMode: contract.approvalPolicy.mode,
        approvalRequired: contract.approvalPolicy.required,
        approvedBy: contract.approvalPolicy.status === "APPROVED" ? "policy" : null,
        approvedAt: contract.approvalPolicy.status === "APPROVED" ? new Date() : null,
        handoffJson: contract,
        callbackUrl: parsed.data.callbackUrl || null,
      },
    });

    void writeAgentOsAudit(r, "agent_os.handoff_contract.created", contract.id, {
      executorType: contract.executor.type,
      status: record.status,
      approvalMode: contract.approvalPolicy.mode,
    });

    return res.json({
      success: true,
      data: {
        ...contract,
        executionRecord: {
          id: record.id,
          handoffId: record.handoffId,
          status: record.status,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(503).json({
      success: false,
      error: "Agent OS execution ledger is not ready. Run Prisma migration.",
      code: "AGENT_OS_LEDGER_NOT_READY",
      details: message,
    });
  }
});

router.get("/executions", async (req, res) => {
  const r = req as AuthedRequest;
  const limit = Math.min(Number(req.query.limit || 25), 100);

  try {
    const records = await (prisma as any).agentExecution.findMany({
      where: {
        ...(getOrgId(r) ? { orgId: getOrgId(r) } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return res.json({ success: true, object: "list", data: records });
  } catch (error) {
    return res.status(503).json({
      success: false,
      error: "Agent OS execution ledger is not ready. Run Prisma migration.",
      code: "AGENT_OS_LEDGER_NOT_READY",
    });
  }
});

router.get("/executions/:handoffId", async (req, res) => {
  const r = req as AuthedRequest;
  const record = await findExecutionForRequest(r, req.params.handoffId).catch(() => null);

  if (!record) {
    return res.status(404).json({ success: false, error: "execution not found", code: "EXECUTION_NOT_FOUND" });
  }

  return res.json({ success: true, data: record });
});

router.post("/executions/:handoffId/approval", async (req, res) => {
  const r = req as AuthedRequest;
  const parsed = approvalSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: "Invalid approval payload",
      code: "EXECUTION_APPROVAL_BAD_REQUEST",
      details: parsed.error.flatten(),
    });
  }

  const existing = await findExecutionForRequest(r, req.params.handoffId).catch(() => null);
  if (!existing) {
    return res.status(404).json({ success: false, error: "execution not found", code: "EXECUTION_NOT_FOUND" });
  }

  const status = parsed.data.status === "REJECTED" ? "REJECTED" : "APPROVED";
  const record = await (prisma as any).agentExecution.update({
    where: { id: existing.id },
    data: {
      status,
      approvedBy: parsed.data.approvedBy || r.auth?.apiKey?.userEmail || "api_key",
      approvedAt: status === "APPROVED" ? new Date() : null,
    },
  }).catch(() => null);

  void writeAgentOsAudit(r, "agent_os.execution.approval", req.params.handoffId, {
    status,
    reason: parsed.data.reason || null,
  });

  return res.json({ success: true, data: record });
});

router.post("/executions/:handoffId/proof", async (req, res) => {
  const r = req as AuthedRequest;
  const parsed = proofSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: "Invalid proof payload",
      code: "EXECUTION_PROOF_BAD_REQUEST",
      details: parsed.error.flatten(),
    });
  }

  const existing = await findExecutionForRequest(r, req.params.handoffId).catch(() => null);
  if (!existing) {
    return res.status(404).json({ success: false, error: "execution not found", code: "EXECUTION_NOT_FOUND" });
  }

  const record = await (prisma as any).agentExecution.update({
    where: { id: existing.id },
    data: {
      ...(parsed.data.executorType ? { executorType: parsed.data.executorType } : {}),
      ...(parsed.data.executorRunId ? { executorRunId: parsed.data.executorRunId } : {}),
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      proofJson: {
        ...parsed.data.proof,
        receivedAt: now(),
      },
    },
  }).catch(() => null);

  void writeAgentOsAudit(r, "agent_os.execution.proof_received", req.params.handoffId, {
    executorRunId: parsed.data.executorRunId || null,
    artifactCount: parsed.data.proof.artifacts.length,
    verified: parsed.data.proof.verified ?? null,
  });

  return res.json({ success: true, data: record });
});

router.post("/executions/:handoffId/result", async (req, res) => {
  const r = req as AuthedRequest;
  const parsed = resultSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: "Invalid result payload",
      code: "EXECUTION_RESULT_BAD_REQUEST",
      details: parsed.error.flatten(),
    });
  }

  const existing = await findExecutionForRequest(r, req.params.handoffId).catch(() => null);
  if (!existing) {
    return res.status(404).json({ success: false, error: "execution not found", code: "EXECUTION_NOT_FOUND" });
  }

  const record = await (prisma as any).agentExecution.update({
    where: { id: existing.id },
    data: {
      ...(parsed.data.executorType ? { executorType: parsed.data.executorType } : {}),
      ...(parsed.data.executorRunId ? { executorRunId: parsed.data.executorRunId } : {}),
      status: parsed.data.status,
      resultJson: {
        result: parsed.data.result,
        receivedAt: now(),
      },
      error: parsed.data.error || null,
    },
  }).catch(() => null);

  void writeAgentOsAudit(r, "agent_os.execution.result_received", req.params.handoffId, {
    executorRunId: parsed.data.executorRunId || null,
    status: parsed.data.status,
  });

  return res.json({ success: true, data: record });
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
