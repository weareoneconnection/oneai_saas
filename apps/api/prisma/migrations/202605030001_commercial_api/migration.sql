-- OneAI commercial API infrastructure
ALTER TABLE "Request"
ADD COLUMN IF NOT EXISTS "requestId" TEXT,
ADD COLUMN IF NOT EXISTS "provider" TEXT NOT NULL DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;

UPDATE "Request"
SET "requestId" = "id"
WHERE "requestId" IS NULL;

ALTER TABLE "Request"
ALTER COLUMN "requestId" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Request_requestId_key"
ON "Request" ("requestId");

CREATE INDEX IF NOT EXISTS "Request_provider_model_idx"
ON "Request" ("provider", "model");

CREATE UNIQUE INDEX IF NOT EXISTS "Request_orgId_apiKeyId_idempotencyKey_key"
ON "Request" ("orgId", "apiKeyId", "idempotencyKey");

ALTER TABLE "UsageDaily"
ADD COLUMN IF NOT EXISTS "provider" TEXT NOT NULL DEFAULT 'unknown';

DROP INDEX IF EXISTS "UsageDaily_day_orgId_apiKeyId_task_model_key";

CREATE UNIQUE INDEX IF NOT EXISTS "UsageDaily_day_orgId_apiKeyId_task_provider_model_key"
ON "UsageDaily" ("day", "orgId", "apiKeyId", "task", "provider", "model");

CREATE INDEX IF NOT EXISTS "UsageDaily_provider_model_idx"
ON "UsageDaily" ("provider", "model");
