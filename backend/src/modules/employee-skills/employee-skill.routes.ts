import { Router } from "express";
import { Role } from "@prisma/client";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
	createSelfRatingHandler,
	updateSelfRatingHandler,
	getMyRatingsHandler,
	getPendingRatingsHandler,
	reviewSkillRatingHandler
} from "./employee-skill.controller";

const router = Router();

// Employee routes - Only EMPLOYEE role can rate themselves for now
router.post(
	"/",
	authMiddleware,
	requireRole(Role.EMPLOYEE),
	createSelfRatingHandler
);

router.patch(
	"/:id",
	authMiddleware,
	requireRole(Role.EMPLOYEE),
	updateSelfRatingHandler
);

router.get(
	"/my-ratings",
	authMiddleware,
	requireRole(Role.EMPLOYEE),
	getMyRatingsHandler
);

// Manager routes - managers can review ratings from their reports
router.get(
	"/pending",
	authMiddleware,
	requireRole(Role.MANAGER),
	getPendingRatingsHandler
);

router.patch(
	"/:id/review",
	authMiddleware,
	requireRole(Role.MANAGER),
	reviewSkillRatingHandler
);

export default router;
