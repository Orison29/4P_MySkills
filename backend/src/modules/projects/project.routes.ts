import { Router } from "express";
import { Role } from "@prisma/client";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
	createProjectHandler,
	getProjectsHandler,
	updateProjectStatusHandler
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
	getProjectsHandler
);

router.patch(
	"/:id/status",
	authMiddleware,
	requireRole(Role.HR),
	updateProjectStatusHandler
);

export default router;
