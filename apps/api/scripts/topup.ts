// 充值脚本：npx tsx scripts/topup.ts <email或orgId> <人民币金额>
// 示例：npx tsx scripts/topup.ts user@example.com 100
import "dotenv/config";
import { prisma } from "../src/config/prisma.js";
import { topUpCredit, getOrgBalance } from "../src/core/billing/creditService.js";

const CNY_TO_USD = 7.2;
const MARKUP = 1.4; // 加价40%，实际汇率折算后留利润空间

async function main() {
  const [input, cnyStr] = process.argv.slice(2);
  if (!input || !cnyStr) {
    console.error("用法: npx tsx scripts/topup.ts <email或orgSlug> <人民币金额>");
    console.error("示例: npx tsx scripts/topup.ts user@example.com 100");
    process.exit(1);
  }

  const cny = parseFloat(cnyStr);
  if (isNaN(cny) || cny <= 0) {
    console.error("金额必须是正数");
    process.exit(1);
  }

  // 人民币 → 实际可用 USD 额度（除以汇率再除以加价倍数）
  const creditUsd = parseFloat((cny / CNY_TO_USD / MARKUP).toFixed(4));

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
  console.log(`   用户:     ${input}`);
  console.log(`   充值金额: ¥${cny} CNY`);
  console.log(`   USD额度:  $${creditUsd} (汇率${CNY_TO_USD}, 加价${MARKUP}x)`);
  console.log(`   充值前:   $${before.toFixed(4)}`);
  console.log(`   充值后:   $${after.toFixed(4)}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
