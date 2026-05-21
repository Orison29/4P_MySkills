import { Request, Response } from "express";
import { TaskStatus } from "@prisma/client";
import { getManagerTeamTasks, getMyTasks, updateTaskStatus } from "./tasks.service";

const isTaskStatus = (value: string): value is TaskStatus => {
  return value === "PENDING" || value === "IN_PROGRESS" || value === "COMPLETED";
};

export const updateTaskStatusHandler = async (req: Request, res: Response) => {
  const taskId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const status = typeof req.body?.status === "string" ? req.body.status.toUpperCase() : "";

  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!taskId) {
    res.status(400).json({ error: "Missing task id" });
    return;
  }

  if (!isTaskStatus(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  try {
    const task = await updateTaskStatus(taskId, req.user.userId, status);
    res.status(200).json(task);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    res.status(400).json({ error: message });
  }
};

export const getMyTasksHandler = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const tasks = await getMyTasks(req.user.userId);
    res.status(200).json(tasks);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ error: message });
  }
};

export const getManagerTeamTasksHandler = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const tasks = await getManagerTeamTasks(req.user.userId);
    res.status(200).json(tasks);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ error: message });
  }
};
