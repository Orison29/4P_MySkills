import { Router } from "express";
import { Role } from "@prisma/client";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { createSkillHandler, listSkillsHandler } from "./skill.controller";

const router = Router();

router.post(
	"/",
	authMiddleware,
	requireRole(Role.HR),
	createSkillHandler
);

router.get(
	"/",
	authMiddleware,
	listSkillsHandler
);

export default router;
