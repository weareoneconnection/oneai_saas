// apps/api/src/core/security/admin.ts
import type { RequestHandler } from "express";

export const requireAdminKey: RequestHandler = (req, res, next) => {
  const got = String(req.headers["x-admin-key"] || "");
  const need = String(process.env.ADMIN_API_KEY || "");
  if (!need) return res.status(500).json({ success: false, error: "ADMIN_API_KEY not set" });
  if (!got || got !== need) return res.status(403).json({ success: false, error: "forbidden" });
  next();
};