import { Router } from "express";
import { Role } from "@prisma/client";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { assignManagerHandler, createEmployeeHandler } from "./employee.controller";

const router = Router();

router.post(
	"/",
	authMiddleware,
	requireRole(Role.ADMIN),
	createEmployeeHandler
);

router.patch(
	"/:id/assign-manager",
	authMiddleware,
	requireRole(Role.ADMIN),
	assignManagerHandler
);

export default router;
