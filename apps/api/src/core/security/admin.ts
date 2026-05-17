// apps/api/src/core/security/admin.ts
import type { RequestHandler } from "express";

export const requireAdminKey: RequestHandler = (req, res, next) => {
  const got = String(req.headers["x-admin-key"] || "");
  const allowed = [
    process.env.ADMIN_API_KEY || "",
    process.env.ONEAI_ADMIN_API_KEY || "",
    process.env.ONEAI_ADMIN_KEY || "",
  ]
    .map((key) => key.trim())
    .filter(Boolean);

  if (!allowed.length) {
    return res.status(500).json({
      success: false,
      error: "ADMIN_API_KEY or ONEAI_ADMIN_API_KEY not set",
    });
  }

  if (!got || !allowed.includes(got)) {
    return res.status(403).json({ success: false, error: "forbidden" });
  }
  next();
};
