import { Router } from "express";
import { Role } from "@prisma/client";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { getManagerTeamTasksHandler, getMyTasksHandler, updateTaskStatusHandler } from "./tasks.controller";

const router = Router();

router.patch("/:id/status", authMiddleware, requireRole(Role.EMPLOYEE), updateTaskStatusHandler);
router.get("/me", authMiddleware, requireRole(Role.EMPLOYEE), getMyTasksHandler);
router.get("/manager-team", authMiddleware, requireRole(Role.MANAGER), getManagerTeamTasksHandler);

export default router;
