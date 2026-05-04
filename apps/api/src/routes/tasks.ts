import { Router } from "express";
import { requireApiKey } from "../core/security/auth.js";
import { getTaskCatalog, getTaskCatalogItem } from "../core/tasks/catalog.js";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.use(requireApiKey);

function mapTaskRegistryItem(item: any) {
  return {
    id: item.task,
    task: item.task,
    type: item.task,
    displayName: item.displayName,
    description: item.description,
    category: item.category,
    tier: item.tier,
    maturity: item.maturity,
    enabled: item.enabled,
    inputSchema: item.inputSchema,
    outputSchema: item.outputSchema,
    defaultProvider: item.defaultProvider,
    defaultModel: item.defaultModel,
    defaultMode: item.defaultMode,
    allowedModels: item.allowedModels,
    allowedProviders: item.allowedProviders,
    exampleInput: item.exampleInput,
    exampleOutput: item.exampleOutput,
    createdAt: item.createdAt?.toISOString?.() ?? item.createdAt,
    updatedAt: item.updatedAt?.toISOString?.() ?? item.updatedAt,
    source: "database",
  };
}

router.get("/", async (_req, res) => {
  try {
    const tasks = await prisma.taskRegistry.findMany({
      where: {
        enabled: true,
      },
      orderBy: [
        { tier: "asc" },
        { task: "asc" },
      ],
    });

    if (tasks.length > 0) {
      return res.json({
        success: true,
        source: "database",
        data: tasks.map(mapTaskRegistryItem),
      });
    }
  } catch (error) {
    console.error("[tasks] Failed to read TaskRegistry, falling back to in-memory catalog:", error);
  }

  return res.json({
    success: true,
    source: "memory_fallback",
    data: getTaskCatalog(),
  });
});

router.get("/:type", async (req, res) => {
  const type = String(req.params.type || "");

  try {
    const task = await prisma.taskRegistry.findUnique({
      where: {
        task: type,
      },
    });

    if (task && task.enabled) {
      return res.json({
        success: true,
        source: "database",
        data: mapTaskRegistryItem(task),
      });
    }
  } catch (error) {
    console.error(`[tasks] Failed to read TaskRegistry item "${type}", falling back to in-memory catalog:`, error);
  }

  const item = getTaskCatalogItem(type);
  if (!item) {
    return res.status(404).json({
      success: false,
      error: "Task not found",
      code: "TASK_NOT_FOUND",
    });
  }

  return res.json({
    success: true,
    source: "memory_fallback",
    data: item,
  });
});

export default router;
