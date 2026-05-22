"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyActiveCampaignProgressHandler = exports.getDepartmentEmployeeCoverageHandler = exports.getCampaignCoverageAnalyticsHandler = exports.listAssessmentCampaignsHandler = exports.createAssessmentCampaignHandler = void 0;
const assessment_campaign_service_1 = require("./assessment-campaign.service");
const createAssessmentCampaignHandler = async (req, res) => {
    try {
        const { title, startAt, endAt, minSkillsRequired } = req.body;
        const campaign = await (0, assessment_campaign_service_1.createAssessmentCampaign)({
            title,
            startAt: new Date(startAt),
            endAt: new Date(endAt),
            minSkillsRequired: minSkillsRequired ?? 2,
            createdBy: req.user.userId
        });
        res.status(201).json(campaign);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        if (message === "Campaign title is required" ||
            message === "Minimum skills required must be at least 1" ||
            message === "Campaign end date must be after start date") {
            res.status(400).json({ error: message });
            return;
        }
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.createAssessmentCampaignHandler = createAssessmentCampaignHandler;
const listAssessmentCampaignsHandler = async (req, res) => {
    try {
        const campaigns = await (0, assessment_campaign_service_1.listAssessmentCampaigns)();
        res.status(200).json(campaigns);
    }
    catch {
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.listAssessmentCampaignsHandler = listAssessmentCampaignsHandler;
const getCampaignCoverageAnalyticsHandler = async (req, res) => {
    try {
        const campaignId = Array.isArray(req.params.campaignId)
            ? req.params.campaignId[0]
            : req.params.campaignId;
        const analytics = await (0, assessment_campaign_service_1.getCampaignCoverageAnalytics)(campaignId);
        res.status(200).json(analytics);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        if (message === "Campaign not found") {
            res.status(404).json({ error: message });
            return;
        }
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getCampaignCoverageAnalyticsHandler = getCampaignCoverageAnalyticsHandler;
const getDepartmentEmployeeCoverageHandler = async (req, res) => {
    try {
        const campaignId = Array.isArray(req.params.campaignId)
            ? req.params.campaignId[0]
            : req.params.campaignId;
        const departmentId = Array.isArray(req.params.departmentId)
            ? req.params.departmentId[0]
            : req.params.departmentId;
        const coverage = await (0, assessment_campaign_service_1.getDepartmentEmployeeCoverage)(campaignId, departmentId);
        res.status(200).json(coverage);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        if (message === "Campaign not found" || message === "Department not found") {
            res.status(404).json({ error: message });
            return;
        }
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getDepartmentEmployeeCoverageHandler = getDepartmentEmployeeCoverageHandler;
const getMyActiveCampaignProgressHandler = async (req, res) => {
    try {
        const progress = await (0, assessment_campaign_service_1.getMyActiveCampaignProgress)(req.user.userId);
        res.status(200).json(progress);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        if (message === "Employee profile not found") {
            res.status(404).json({ error: message });
            return;
        }
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getMyActiveCampaignProgressHandler = getMyActiveCampaignProgressHandler;
