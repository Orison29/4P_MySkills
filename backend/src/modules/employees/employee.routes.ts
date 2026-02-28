import { Router } from "express";
import { Role } from "@prisma/client";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { assignManagerHandler, createEmployeeHandler, getMyAssignmentsHandler, getMyTeamHandler, changeRoleHandler } from "./employee.controller";
const router = Router();

router.post(
	"/",
	authMiddleware,
	requireRole(Role.ADMIN),
	createEmployeeHandler
);

router.get(
	"/me/assignments",
	authMiddleware,
	requireRole(Role.EMPLOYEE),
	getMyAssignmentsHandler
);

router.patch(
	"/:id/assign-manager",
	authMiddleware,
	requireRole(Role.ADMIN),
	assignManagerHandler
);

router.get(
	"/my-team",
	authMiddleware,
	requireRole(Role.MANAGER, Role.HR, Role.ADMIN),
	getMyTeamHandler
);

router.patch(
	"/:id/role",
	authMiddleware,
	requireRole(Role.ADMIN),
	changeRoleHandler
);

export default router;
