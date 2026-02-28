import { Router } from "express";
import { Role } from "@prisma/client";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
	getRecommendedEmployeesHandler,
	getEmployeeSkillAnalysisHandler,
	getProjectRecommendationsHandler
} from "./recommendation.controller";

const router = Router();

// Get recommendations for ALL deliverables in a project - HR only (SINGLE BUTTON)
// Query param: ?topK=5 (default: 5, max: 50)
router.get(
	"/projects/:projectId/recommendations",
	authMiddleware,
	requireRole(Role.HR),
	getProjectRecommendationsHandler
);

// Get top recommended employees for a deliverable - HR only
// Query param: ?topK=5 (default: 5, max: 50)
router.get(
	"/deliverables/:deliverableId/recommendations",
	authMiddleware,
	requireRole(Role.HR),
	getRecommendedEmployeesHandler
);

// Get detailed skill analysis for a specific employee for a deliverable - HR only
router.get(
	"/deliverables/:deliverableId/employees/:employeeId/analysis",
	authMiddleware,
	requireRole(Role.HR),
	getEmployeeSkillAnalysisHandler
);

export default router;
