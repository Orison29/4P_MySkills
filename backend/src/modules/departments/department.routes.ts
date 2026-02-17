import { Router } from "express";
import { Role } from "@prisma/client";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { createDepartmentHandler, listDepartmentsHandler } from "./department.controller";

const router = Router();

router.post(
	"/",
	authMiddleware,
	requireRole(Role.ADMIN),
	createDepartmentHandler
);

router.get(
	"/",
	authMiddleware,
	listDepartmentsHandler
);

export default router;
