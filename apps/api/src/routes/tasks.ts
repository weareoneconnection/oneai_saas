import { Router } from "express";
import { requireApiKey } from "../core/security/auth.js";
import { getTaskCatalog, getTaskCatalogItem } from "../core/tasks/catalog.js";

const router = Router();

router.use(requireApiKey);

router.get("/", (_req, res) => {
  return res.json({
    success: true,
    data: getTaskCatalog(),
  });
});

router.get("/:type", (req, res) => {
  const item = getTaskCatalogItem(String(req.params.type || ""));
  if (!item) {
    return res.status(404).json({
      success: false,
      error: "Task not found",
      code: "TASK_NOT_FOUND",
    });
  }

  return res.json({
    success: true,
    data: item,
  });
});

export default router;
