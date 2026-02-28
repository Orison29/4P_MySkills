import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import * as analyticsController from "./analytics.controller";

const router = Router();

// Get all employees overview (HR only)
router.get(
	"/employees/overview",
	authMiddleware,
	requireRole("HR", "ADMIN"),
	analyticsController.getAllEmployeesOverview
);

// Get employee skill progress (HR, MANAGER, or the employee themselves)
router.get(
	"/employees/:employeeId/skill-progress",
	authMiddleware,
	requireRole("HR", "MANAGER", "ADMIN"),
	analyticsController.getEmployeeSkillProgress
);

// Get specific skill timeline for employee (HR, MANAGER, or the employee themselves)
router.get(
	"/employees/:employeeId/skills/:skillId/timeline",
	authMiddleware,
	requireRole("HR", "MANAGER", "ADMIN"),
	analyticsController.getSkillProgressTimeline
);

router.get(
	"/dashboard-stats",
	authMiddleware,
	requireRole("HR", "ADMIN"),
	analyticsController.getDashboardStats
);

export default router;
