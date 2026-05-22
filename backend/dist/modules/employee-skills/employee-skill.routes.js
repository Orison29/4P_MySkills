"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const employee_skill_controller_1 = require("./employee-skill.controller");
const router = (0, express_1.Router)();
// Employee routes - Only EMPLOYEE role can rate themselves for now
router.post("/", auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)(client_1.Role.EMPLOYEE), employee_skill_controller_1.createSelfRatingHandler);
router.patch("/:id", auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)(client_1.Role.EMPLOYEE), employee_skill_controller_1.updateSelfRatingHandler);
router.get("/my-ratings", auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)(client_1.Role.EMPLOYEE), employee_skill_controller_1.getMyRatingsHandler);
// Manager routes - managers can review ratings from their reports
router.get("/pending", auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)(client_1.Role.MANAGER), employee_skill_controller_1.getPendingRatingsHandler);
router.patch("/:id/review", auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)(client_1.Role.MANAGER), employee_skill_controller_1.reviewSkillRatingHandler);
exports.default = router;
