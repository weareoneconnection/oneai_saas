-- CreateEnum
CREATE TYPE "ApiKeyEnvironment" AS ENUM ('DEVELOPMENT', 'STAGING', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "RegistryStatus" AS ENUM ('ACTIVE', 'DEGRADED', 'DISABLED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "HealthStatus" AS ENUM ('HEALTHY', 'DEGRADED', 'DOWN', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "TaskMaturity" AS ENUM ('ALPHA', 'BETA', 'STABLE', 'DEPRECATED');

-- AlterTable
ALTER TABLE "ApiKey" ADD COLUMN     "allowedModels" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "allowedTasks" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "environment" "ApiKeyEnvironment" NOT NULL DEFAULT 'DEVELOPMENT',
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "OrgBilling" ADD COLUMN     "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "currentPeriodStart" TIMESTAMP(3),
ADD COLUMN     "monthlyCostLimitUsd" DOUBLE PRECISION,
ADD COLUMN     "monthlyRequestLimit" INTEGER,
ADD COLUMN     "rateLimitRpm" INTEGER,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Organization" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "clientIp" TEXT,
ADD COLUMN     "endpoint" TEXT NOT NULL DEFAULT '/v1/generate',
ADD COLUMN     "errorCode" TEXT,
ADD COLUMN     "inputStored" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "outputStored" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "redacted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "statusCode" INTEGER,
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "UsageDaily" ADD COLUMN     "avgLatencyMs" DOUBLE PRECISION,
ADD COLUMN     "errorCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "successCount" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "ModelRegistry" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "displayName" TEXT,
    "description" TEXT,
    "status" "RegistryStatus" NOT NULL DEFAULT 'ACTIVE',
    "contextTokens" INTEGER,
    "maxOutputTokens" INTEGER,
    "supportsStreaming" BOOLEAN NOT NULL DEFAULT false,
    "supportsJson" BOOLEAN NOT NULL DEFAULT false,
    "supportsTools" BOOLEAN NOT NULL DEFAULT false,
    "supportsVision" BOOLEAN NOT NULL DEFAULT false,
    "inputPricePer1mTokens" DOUBLE PRECISION,
    "outputPricePer1mTokens" DOUBLE PRECISION,
    "configured" BOOLEAN NOT NULL DEFAULT false,
    "available" BOOLEAN NOT NULL DEFAULT false,
    "hasPricing" BOOLEAN NOT NULL DEFAULT false,
    "healthStatus" "HealthStatus",
    "lastHealthCheckAt" TIMESTAMP(3),
    "lastHealthMessage" TEXT,
    "lastLatencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModelRegistry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskRegistry" (
    "id" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'free',
    "maturity" "TaskMaturity" NOT NULL DEFAULT 'BETA',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "inputSchema" JSONB,
    "outputSchema" JSONB,
    "defaultProvider" TEXT,
    "defaultModel" TEXT,
    "defaultMode" TEXT,
    "allowedModels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allowedProviders" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "exampleInput" JSONB,
    "exampleOutput" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskRegistry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "userId" TEXT,
    "apiKeyId" TEXT,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "metadata" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ModelRegistry_provider_idx" ON "ModelRegistry"("provider");

-- CreateIndex
CREATE INDEX "ModelRegistry_status_idx" ON "ModelRegistry"("status");

-- CreateIndex
CREATE INDEX "ModelRegistry_available_idx" ON "ModelRegistry"("available");

-- CreateIndex
CREATE INDEX "ModelRegistry_healthStatus_idx" ON "ModelRegistry"("healthStatus");

-- CreateIndex
CREATE UNIQUE INDEX "ModelRegistry_provider_model_key" ON "ModelRegistry"("provider", "model");

-- CreateIndex
CREATE UNIQUE INDEX "TaskRegistry_task_key" ON "TaskRegistry"("task");

-- CreateIndex
CREATE INDEX "TaskRegistry_enabled_idx" ON "TaskRegistry"("enabled");

-- CreateIndex
CREATE INDEX "TaskRegistry_tier_idx" ON "TaskRegistry"("tier");

-- CreateIndex
CREATE INDEX "TaskRegistry_maturity_idx" ON "TaskRegistry"("maturity");

-- CreateIndex
CREATE INDEX "TaskRegistry_category_idx" ON "TaskRegistry"("category");

-- CreateIndex
CREATE INDEX "AuditLog_orgId_createdAt_idx" ON "AuditLog"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_apiKeyId_createdAt_idx" ON "AuditLog"("apiKeyId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "ApiKey_orgId_environment_idx" ON "ApiKey"("orgId", "environment");

-- CreateIndex
CREATE INDEX "ApiKey_prefix_idx" ON "ApiKey"("prefix");

-- CreateIndex
CREATE INDEX "ApiKey_lastUsedAt_idx" ON "ApiKey"("lastUsedAt");

-- CreateIndex
CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");

-- CreateIndex
CREATE INDEX "Membership_orgId_role_idx" ON "Membership"("orgId", "role");

-- CreateIndex
CREATE INDEX "OrgBilling_currentPeriodEnd_idx" ON "OrgBilling"("currentPeriodEnd");

-- CreateIndex
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_createdAt_idx" ON "Organization"("createdAt");

-- CreateIndex
CREATE INDEX "Request_task_createdAt_idx" ON "Request"("task", "createdAt");

-- CreateIndex
CREATE INDEX "Request_success_createdAt_idx" ON "Request"("success", "createdAt");

-- CreateIndex
CREATE INDEX "Request_statusCode_createdAt_idx" ON "Request"("statusCode", "createdAt");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expires_idx" ON "Session"("expires");

-- CreateIndex
CREATE INDEX "UsageDaily_apiKeyId_day_idx" ON "UsageDaily"("apiKeyId", "day");

-- CreateIndex
CREATE INDEX "UsageDaily_task_day_idx" ON "UsageDaily"("task", "day");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id") ON DELETE SET NULL ON UPDATE CASCADE;
