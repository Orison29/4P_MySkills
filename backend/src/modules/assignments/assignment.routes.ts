import { Router } from "express";
import { Role } from "@prisma/client";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
	createAssignmentRequestHandler,
	getPendingRequestsHandler,
	reviewAssignmentRequestHandler
} from "./assignment.controller";

const router = Router();

router.post(
	"/deliverables/:id/request-assignment",
	authMiddleware,
	requireRole(Role.HR),
	createAssignmentRequestHandler
);

router.get(
	"/assignment-requests/pending",
	authMiddleware,
	requireRole(Role.MANAGER),
	getPendingRequestsHandler
);

router.patch(
	"/assignment-requests/:id/review",
	authMiddleware,
	requireRole(Role.MANAGER),
	reviewAssignmentRequestHandler
);

export default router;
