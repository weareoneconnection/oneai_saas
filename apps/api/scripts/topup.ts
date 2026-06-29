// 充值脚本：npx tsx scripts/topup.ts <email或orgId> <美元金额>
// 示例：npx tsx scripts/topup.ts user@example.com 10
import "dotenv/config";
import { prisma } from "../src/config/prisma.js";
import { topUpCredit, getOrgBalance } from "../src/core/billing/creditService.js";

async function main() {
  const [input, usdStr] = process.argv.slice(2);
  if (!input || !usdStr) {
    console.error("用法: npx tsx scripts/topup.ts <email或orgSlug> <美元金额>");
    console.error("示例: npx tsx scripts/topup.ts user@example.com 10");
    process.exit(1);
  }

  const creditUsd = parseFloat(parseFloat(usdStr).toFixed(4));
  if (isNaN(creditUsd) || creditUsd <= 0) {
    console.error("金额必须是正数");
    process.exit(1);
  }

  // 查找 org
  let orgId: string | null = null;

  const byEmail = await prisma.apiKey.findFirst({
    where: { userEmail: input, status: "ACTIVE" },
    select: { orgId: true },
  });
  if (byEmail) orgId = byEmail.orgId;

  if (!orgId) {
    const bySlug = await prisma.organization.findUnique({
      where: { slug: input },
      select: { id: true },
    });
    if (bySlug) orgId = bySlug.id;
  }

  if (!orgId) {
    const byId = await prisma.organization.findUnique({
      where: { id: input },
      select: { id: true },
    });
    if (byId) orgId = byId.id;
  }

  if (!orgId) {
    console.error(`找不到用户: ${input}`);
    process.exit(1);
  }

  const before = await getOrgBalance(orgId);
  const after = await topUpCredit(orgId, creditUsd);

  console.log("✅ 充值成功");
  console.log(`   用户:   ${input}`);
  console.log(`   充值:   $${creditUsd} USD`);
  console.log(`   充值前: $${before.toFixed(4)}`);
  console.log(`   充值后: $${after.toFixed(4)}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
