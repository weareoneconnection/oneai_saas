-- Agent OS handoff/result ledger.
-- Additive only: no existing workflow, request, or billing tables are changed.

CREATE TYPE "AgentExecutionStatus" AS ENUM (
  'PENDING_APPROVAL',
  'APPROVED',
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
  'CANCELED',
  'REJECTED'
);

CREATE TABLE "AgentExecution" (
  "id" TEXT NOT NULL,
  "orgId" TEXT,
  "apiKeyId" TEXT,
  "handoffId" TEXT NOT NULL,
  "agentPlanId" TEXT,
  "protocolVersion" TEXT NOT NULL DEFAULT 'oneai.agent_os.v1',
  "executorType" TEXT NOT NULL DEFAULT 'external',
  "executorRunId" TEXT,
  "objective" TEXT NOT NULL,
  "status" "AgentExecutionStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
  "approvalMode" TEXT NOT NULL DEFAULT 'manual',
  "approvalRequired" BOOLEAN NOT NULL DEFAULT true,
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP(3),
  "handoffJson" JSONB NOT NULL,
  "proofJson" JSONB,
  "resultJson" JSONB,
  "error" TEXT,
  "callbackUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AgentExecution_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AgentExecution_handoffId_key" ON "AgentExecution"("handoffId");
CREATE INDEX "AgentExecution_orgId_createdAt_idx" ON "AgentExecution"("orgId", "createdAt");
CREATE INDEX "AgentExecution_apiKeyId_createdAt_idx" ON "AgentExecution"("apiKeyId", "createdAt");
CREATE INDEX "AgentExecution_executorType_status_idx" ON "AgentExecution"("executorType", "status");
CREATE INDEX "AgentExecution_executorRunId_idx" ON "AgentExecution"("executorRunId");
CREATE INDEX "AgentExecution_status_createdAt_idx" ON "AgentExecution"("status", "createdAt");

ALTER TABLE "AgentExecution"
  ADD CONSTRAINT "AgentExecution_orgId_fkey"
  FOREIGN KEY ("orgId") REFERENCES "Organization"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgentExecution"
  ADD CONSTRAINT "AgentExecution_apiKeyId_fkey"
  FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
