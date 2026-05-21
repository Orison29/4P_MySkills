import { Router } from "express";
import { Role } from "@prisma/client";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
	createAssessmentCampaignHandler,
	getCampaignCoverageAnalyticsHandler,
	getDepartmentEmployeeCoverageHandler,
	getMyActiveCampaignProgressHandler,
	listAssessmentCampaignsHandler
} from "./assessment-campaign.controller";

const router = Router();

router.use(authMiddleware);

router.get(
	"/active/me",
	requireRole(Role.EMPLOYEE),
	getMyActiveCampaignProgressHandler
);

router.post("/", requireRole(Role.HR), createAssessmentCampaignHandler);
router.get("/", requireRole(Role.HR), listAssessmentCampaignsHandler);
router.get(
	"/:campaignId/coverage",
	requireRole(Role.HR),
	getCampaignCoverageAnalyticsHandler
);
router.get(
	"/:campaignId/departments/:departmentId/employees",
	requireRole(Role.HR),
	getDepartmentEmployeeCoverageHandler
);

export default router;
