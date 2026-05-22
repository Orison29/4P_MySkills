"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const deliverable_skill_controller_1 = require("./deliverable-skill.controller");
const router = (0, express_1.Router)();
// Add a skill to a deliverable - HR only
router.post("/deliverables/:deliverableId/skills", auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)(client_1.Role.HR), deliverable_skill_controller_1.addSkillToDeliverableHandler);
// Get all skills for a deliverable - HR only
router.get("/deliverables/:deliverableId/skills", auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)(client_1.Role.HR), deliverable_skill_controller_1.getDeliverableSkillsHandler);
// Update skill weight - HR only
router.patch("/deliverables/:deliverableId/skills/:skillId", auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)(client_1.Role.HR), deliverable_skill_controller_1.updateSkillWeightHandler);
// Remove skill from deliverable - HR only
router.delete("/deliverables/:deliverableId/skills/:skillId", auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)(client_1.Role.HR), deliverable_skill_controller_1.removeSkillFromDeliverableHandler);
exports.default = router;
