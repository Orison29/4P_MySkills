import { Request, Response } from "express";
import {
	createAssessmentCampaign,
	getCampaignCoverageAnalytics,
	getDepartmentEmployeeCoverage,
	getMyActiveCampaignProgress,
	listAssessmentCampaigns
} from "./assessment-campaign.service";

export const createAssessmentCampaignHandler = async (
	req: Request,
	res: Response
) => {
	try {
		const { title, startAt, endAt, minSkillsRequired } = req.body as {
			title: string;
			startAt: string;
			endAt: string;
			minSkillsRequired?: number;
		};

		const campaign = await createAssessmentCampaign({
			title,
			startAt: new Date(startAt),
			endAt: new Date(endAt),
			minSkillsRequired: minSkillsRequired ?? 2,
			createdBy: req.user!.userId
		});

		res.status(201).json(campaign);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Internal server error";

		if (
			message === "Campaign title is required" ||
			message === "Minimum skills required must be at least 1" ||
			message === "Campaign end date must be after start date"
		) {
			res.status(400).json({ error: message });
			return;
		}

		res.status(500).json({ error: "Internal server error" });
	}
};

export const listAssessmentCampaignsHandler = async (
	req: Request,
	res: Response
) => {
	try {
		const campaigns = await listAssessmentCampaigns();
		res.status(200).json(campaigns);
	} catch {
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getCampaignCoverageAnalyticsHandler = async (
	req: Request,
	res: Response
) => {
	try {
		const campaignId = Array.isArray(req.params.campaignId)
			? req.params.campaignId[0]
			: req.params.campaignId;

		const analytics = await getCampaignCoverageAnalytics(campaignId);
		res.status(200).json(analytics);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Internal server error";

		if (message === "Campaign not found") {
			res.status(404).json({ error: message });
			return;
		}

		res.status(500).json({ error: "Internal server error" });
	}
};

export const getDepartmentEmployeeCoverageHandler = async (
	req: Request,
	res: Response
) => {
	try {
		const campaignId = Array.isArray(req.params.campaignId)
			? req.params.campaignId[0]
			: req.params.campaignId;
		const departmentId = Array.isArray(req.params.departmentId)
			? req.params.departmentId[0]
			: req.params.departmentId;

		const coverage = await getDepartmentEmployeeCoverage(
			campaignId,
			departmentId
		);
		res.status(200).json(coverage);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Internal server error";

		if (message === "Campaign not found" || message === "Department not found") {
			res.status(404).json({ error: message });
			return;
		}

		res.status(500).json({ error: "Internal server error" });
	}
};

export const getMyActiveCampaignProgressHandler = async (
	req: Request,
	res: Response
) => {
	try {
		const progress = await getMyActiveCampaignProgress(req.user!.userId);
		res.status(200).json(progress);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Internal server error";

		if (message === "Employee profile not found") {
			res.status(404).json({ error: message });
			return;
		}

		res.status(500).json({ error: "Internal server error" });
	}
};
