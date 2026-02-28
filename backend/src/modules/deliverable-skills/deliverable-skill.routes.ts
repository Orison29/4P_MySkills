import { Router } from "express";
import { Role } from "@prisma/client";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
	addSkillToDeliverableHandler,
	getDeliverableSkillsHandler,
	updateSkillWeightHandler,
	removeSkillFromDeliverableHandler
} from "./deliverable-skill.controller";

const router = Router();

// Add a skill to a deliverable - HR only
router.post(
	"/deliverables/:deliverableId/skills",
	authMiddleware,
	requireRole(Role.HR),
	addSkillToDeliverableHandler
);

// Get all skills for a deliverable - HR only
router.get(
	"/deliverables/:deliverableId/skills",
	authMiddleware,
	requireRole(Role.HR),
	getDeliverableSkillsHandler
);

// Update skill weight - HR only
router.patch(
	"/deliverables/:deliverableId/skills/:skillId",
	authMiddleware,
	requireRole(Role.HR),
	updateSkillWeightHandler
);

// Remove skill from deliverable - HR only
router.delete(
	"/deliverables/:deliverableId/skills/:skillId",
	authMiddleware,
	requireRole(Role.HR),
	removeSkillFromDeliverableHandler
);

export default router;
