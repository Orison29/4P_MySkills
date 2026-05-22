"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const recommendation_controller_1 = require("./recommendation.controller");
const router = (0, express_1.Router)();
// Get recommendations for ALL deliverables in a project - HR only (SINGLE BUTTON)
// Query param: ?topK=5 (default: 5, max: 50)
router.get("/projects/:projectId/recommendations", auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)(client_1.Role.HR), recommendation_controller_1.getProjectRecommendationsHandler);
// Get top recommended employees for a deliverable - HR only
// Query param: ?topK=5 (default: 5, max: 50)
router.get("/deliverables/:deliverableId/recommendations", auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)(client_1.Role.HR), recommendation_controller_1.getRecommendedEmployeesHandler);
// Get detailed skill analysis for a specific employee for a deliverable - HR only
router.get("/deliverables/:deliverableId/employees/:employeeId/analysis", auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)(client_1.Role.HR), recommendation_controller_1.getEmployeeSkillAnalysisHandler);
exports.default = router;
