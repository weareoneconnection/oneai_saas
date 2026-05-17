import "dotenv/config";
import "./core/workflow/init.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import { listTasks } from "./core/workflow/registry.js";
import generateRoute from "./routes/generate.js";
import modelsRoute from "./routes/models.js";
import chatRoute, { messagesHandler } from "./routes/chat.js";
import { requireApiKey } from "./core/security/auth.js";
import { rateLimitRedisTcp } from "./core/security/rateLimitRedis.js";
import adminRoute from "./routes/admin.js";
import adminDashboardRouter from "./routes/admin_dashboard.js";
import tasksRoute from "./routes/tasks.js";
import usageRoute from "./routes/usage.js";
import agentOsRoute from "./routes/agent_os.js";
// ✅ billing
import billingRoute, { handleStripeWebhook } from "./routes/billing.js";

dotenv.config();

const app = express();

// ===== 基础中间件 =====
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));

// ✅ Stripe webhook 必须 raw（顺序不能变）
app.post(
  "/v1/billing/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

// 其他路由用 JSON body
app.use(express.json());

// ===== 基础路由 =====
app.get("/", (_req, res) => {
  res.json({ status: "OneAI API running 🚀" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ===== 核心 API =====
app.use("/v1/generate", generateRoute);
app.use("/v1/models", modelsRoute);
app.use("/v1/chat", chatRoute);
app.post(
  "/v1/messages",
  requireApiKey,
  rateLimitRedisTcp({ windowMs: 60_000, maxPerKeyPerWindow: 120, maxPerIpPerWindow: 120 }),
  messagesHandler
);
app.use("/v1/tasks", tasksRoute);
app.use("/v1/usage", usageRoute);

// ===== Admin =====
app.use("/v1/admin", adminRoute);

// ✅ 之前没用到，这里补上
app.use("/v1/admin-dashboard", adminDashboardRouter);

// ===== Billing =====
app.use("/v1/billing", billingRoute);

// ===== Agent OS catch-all under /v1 =====
// Keep this after concrete /v1 routes. The Agent OS router has its own API-key
// middleware and would otherwise intercept /v1/admin/* before admin auth runs.
app.use("/v1", agentOsRoute);

// ===== 404 兜底 =====
app.use((_req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// ===== 全局错误处理 =====
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err?.message || "unknown",
  });
});

// ===== 启动 =====
const PORT = Number(process.env.PORT || 4000);

console.log("Registered workflows:", listTasks());

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 OneAI API running on port ${PORT}`);
});
