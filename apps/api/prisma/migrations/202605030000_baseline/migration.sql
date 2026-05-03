-- OneAI baseline commercial schema.
-- This migration is intentionally idempotent so a new production database can
-- be initialized safely before later incremental migrations run.

DO $$ BEGIN
  CREATE TYPE "OrgRole" AS ENUM ('OWNER','ADMIN','MEMBER','VIEWER');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ApiKeyStatus" AS ENUM ('ACTIVE','SUSPENDED','REVOKED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT,
  "email" TEXT UNIQUE,
  "emailVerified" TIMESTAMP(3),
  "image" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Account" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT PRIMARY KEY,
  "sessionToken" TEXT NOT NULL UNIQUE,
  "userId" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "expires" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

CREATE TABLE IF NOT EXISTS "Organization" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Membership" (
  "id" TEXT PRIMARY KEY,
  "orgId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "OrgRole" NOT NULL DEFAULT 'MEMBER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Membership_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Membership_orgId_userId_key" ON "Membership"("orgId", "userId");

CREATE TABLE IF NOT EXISTS "ApiKey" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "keyHash" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "allowedIps" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "monthlyBudgetUsd" DOUBLE PRECISION,
  "orgId" TEXT NOT NULL,
  "prefix" TEXT NOT NULL,
  "rateLimitRpm" INTEGER,
  "revokedAt" TIMESTAMP(3),
  "scopes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "status" "ApiKeyStatus" NOT NULL DEFAULT 'ACTIVE',
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsedAt" TIMESTAMP(3),
  "userEmail" VARCHAR(255) NOT NULL,
  CONSTRAINT "ApiKey_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ApiKey_orgId_status_idx" ON "ApiKey"("orgId", "status");

CREATE TABLE IF NOT EXISTS "Request" (
  "id" TEXT PRIMARY KEY,
  "requestId" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "task" TEXT NOT NULL,
  "success" BOOLEAN NOT NULL DEFAULT true,
  "attempts" INTEGER NOT NULL DEFAULT 1,
  "error" TEXT,
  "provider" TEXT NOT NULL DEFAULT 'unknown',
  "model" TEXT NOT NULL,
  "promptTokens" INTEGER NOT NULL DEFAULT 0,
  "completionTokens" INTEGER NOT NULL DEFAULT 0,
  "totalTokens" INTEGER NOT NULL DEFAULT 0,
  "apiKeyId" TEXT,
  "estimatedCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "idempotencyKey" TEXT,
  "inputJson" JSONB,
  "latencyMs" INTEGER,
  "orgId" TEXT,
  "outputJson" JSONB,
  CONSTRAINT "Request_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Request_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Request_createdAt_idx" ON "Request"("createdAt");
CREATE INDEX IF NOT EXISTS "Request_orgId_createdAt_idx" ON "Request"("orgId", "createdAt");
CREATE INDEX IF NOT EXISTS "Request_apiKeyId_createdAt_idx" ON "Request"("apiKeyId", "createdAt");
CREATE INDEX IF NOT EXISTS "Request_provider_model_idx" ON "Request"("provider", "model");
CREATE UNIQUE INDEX IF NOT EXISTS "Request_orgId_apiKeyId_idempotencyKey_key" ON "Request"("orgId", "apiKeyId", "idempotencyKey");

CREATE TABLE IF NOT EXISTS "UsageDaily" (
  "id" TEXT PRIMARY KEY,
  "day" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "apiKeyId" TEXT,
  "task" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'unknown',
  "model" TEXT NOT NULL,
  "requestCount" INTEGER NOT NULL DEFAULT 0,
  "promptTokens" INTEGER NOT NULL DEFAULT 0,
  "completionTokens" INTEGER NOT NULL DEFAULT 0,
  "totalTokens" INTEGER NOT NULL DEFAULT 0,
  "costUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UsageDaily_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "UsageDaily_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "UsageDaily_day_orgId_apiKeyId_task_provider_model_key" ON "UsageDaily"("day", "orgId", "apiKeyId", "task", "provider", "model");
CREATE INDEX IF NOT EXISTS "UsageDaily_orgId_day_idx" ON "UsageDaily"("orgId", "day");
CREATE INDEX IF NOT EXISTS "UsageDaily_provider_model_idx" ON "UsageDaily"("provider", "model");

CREATE TABLE IF NOT EXISTS "OrgBilling" (
  "id" TEXT PRIMARY KEY,
  "orgId" TEXT NOT NULL UNIQUE,
  "stripeCustomerId" TEXT UNIQUE,
  "stripeSubId" TEXT UNIQUE,
  "plan" TEXT NOT NULL DEFAULT 'free',
  "status" TEXT NOT NULL DEFAULT 'inactive',
  "currentPeriodEnd" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrgBilling_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "OrgBilling_plan_idx" ON "OrgBilling"("plan");
CREATE INDEX IF NOT EXISTS "OrgBilling_status_idx" ON "OrgBilling"("status");
