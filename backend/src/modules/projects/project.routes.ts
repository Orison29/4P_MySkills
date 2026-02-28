import { Router } from "express";
import { Role } from "@prisma/client";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
	createProjectHandler,
	getProjectsHandler,
	getProjectHandler,
	updateProjectStatusHandler,
	analyzeProjectHandler,
	deleteProjectHandler
} from "./project.controller";

const router = Router();

router.post(
	"/",
	authMiddleware,
	requireRole(Role.HR),
	createProjectHandler
);

router.get(
	"/",
	authMiddleware,
	requireRole(Role.HR),
	getProjectsHandler
);

router.get(
	"/:id",
	authMiddleware,
	requireRole(Role.HR),
	getProjectHandler
);

router.patch(
	"/:id/status",
	authMiddleware,
	requireRole(Role.HR),
	updateProjectStatusHandler
);

router.post(
	"/:id/analyze",
	authMiddleware,
	requireRole(Role.HR),
	analyzeProjectHandler
);

router.delete(
	"/:id",
	authMiddleware,
	requireRole(Role.HR),
	deleteProjectHandler
);

export default router;
