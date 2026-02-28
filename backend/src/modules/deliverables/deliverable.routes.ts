import { Router } from "express";
import { Role } from "@prisma/client";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
	createDeliverableHandler,
	getProjectDeliverablesHandler,
	getDeliverableDetailsHandler,
	updateDeliverableHandler,
	deleteDeliverableHandler
} from "./deliverable.controller";

const router = Router();

// Create deliverable (will be used by LLM integration, but HR can also manually create)
router.post(
	"/projects/:projectId/deliverables",
	authMiddleware,
	requireRole(Role.HR),
	createDeliverableHandler
);

// Get all deliverables for a project - HR only
router.get(
	"/projects/:projectId/deliverables",
	authMiddleware,
	requireRole(Role.HR),
	getProjectDeliverablesHandler
);

// Get specific deliverable details - HR only
router.get(
	"/deliverables/:id",
	authMiddleware,
	requireRole(Role.HR),
	getDeliverableDetailsHandler
);

// Update deliverable (HR can edit what LLM created)
router.patch(
	"/deliverables/:id",
	authMiddleware,
	requireRole(Role.HR),
	updateDeliverableHandler
);

// Delete deliverable (HR can remove if LLM got it wrong)
router.delete(
	"/deliverables/:id",
	authMiddleware,
	requireRole(Role.HR),
	deleteDeliverableHandler
);

export default router;
