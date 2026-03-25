import "dotenv/config";
import "./core/workflow/init.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { listTasks } from "./core/workflow/registry.js";
import generateRoute from "./routes/generate.js";
import adminRoute from "./routes/admin.js";
import adminDashboardRouter from "./routes/admin_dashboard.js";
// ✅ NEW: billing
import billingRoute, { handleStripeWebhook } from "./routes/billing.js";

dotenv.config();

const app = express();

app.use(cors());

// ✅ NEW: Stripe webhook 必须使用 raw body，并且要放在 express.json() 之前
app.post(
  "/v1/billing/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

// 其他路由用 JSON body
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ status: "OneAI API running 🚀" });
});

app.use("/v1/generate", generateRoute);

// ✅ 后台管理（由 web 的 route.ts 转发调用）
app.use("/v1/admin", adminRoute);

// ✅ NEW: Billing routes (status / checkout / portal)
app.use("/v1/billing", billingRoute);
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
const PORT = process.env.PORT || 4000;
console.log("Registered workflows:", listTasks());
app.listen(PORT, () => {
  console.log(`🚀 OneAI API running on http://localhost:${PORT}`);
});