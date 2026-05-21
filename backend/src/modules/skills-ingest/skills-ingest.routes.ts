import { Router } from "express";
import multer from "multer";
import { Role } from "@prisma/client";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { ingestSkillsHandler } from "./skills-ingest.controller";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", authMiddleware, requireRole(Role.HR), upload.single("file"), ingestSkillsHandler);

export default router;
