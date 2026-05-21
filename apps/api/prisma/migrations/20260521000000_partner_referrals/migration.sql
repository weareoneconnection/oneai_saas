CREATE TABLE "PartnerReferral" (
  "id" TEXT NOT NULL,
  "refCode" TEXT NOT NULL,
  "referredEmail" TEXT,
  "orgId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'captured',
  "leadStage" TEXT NOT NULL DEFAULT 'signed_in',
  "sourcePath" TEXT,
  "landingPath" TEXT,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "signedInAt" TIMESTAMP(3),
  "convertedAt" TIMESTAMP(3),
  "plan" TEXT,
  "revenueSharePct" DOUBLE PRECISION,
  "estimatedCommissionUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "settledCommissionUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PartnerReferral_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PartnerReferral_refCode_referredEmail_key" ON "PartnerReferral"("refCode", "referredEmail");
CREATE INDEX "PartnerReferral_refCode_idx" ON "PartnerReferral"("refCode");
CREATE INDEX "PartnerReferral_referredEmail_idx" ON "PartnerReferral"("referredEmail");
CREATE INDEX "PartnerReferral_orgId_idx" ON "PartnerReferral"("orgId");
CREATE INDEX "PartnerReferral_status_idx" ON "PartnerReferral"("status");
CREATE INDEX "PartnerReferral_createdAt_idx" ON "PartnerReferral"("createdAt");
