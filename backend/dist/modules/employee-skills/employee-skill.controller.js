"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewSkillRatingHandler = exports.getPendingRatingsHandler = exports.getMyRatingsHandler = exports.updateSelfRatingHandler = exports.createSelfRatingHandler = void 0;
const employee_skill_service_1 = require("./employee-skill.service");
const createSelfRatingHandler = async (req, res) => {
    try {
        const { skillId, selfRating } = req.body;
        const userId = req.user.userId;
        const rating = await (0, employee_skill_service_1.createSelfRating)(userId, skillId, selfRating);
        res.status(201).json(rating);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        if (message === "Employee profile not found" || message === "Skill not found") {
            res.status(404).json({ error: message });
            return;
        }
        if (message === "Rating must be between 1 and 5" ||
            message === "Skill already rated") {
            res.status(400).json({ error: message });
            return;
        }
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.createSelfRatingHandler = createSelfRatingHandler;
const updateSelfRatingHandler = async (req, res) => {
    try {
        const rawId = req.params.id;
        const ratingId = Array.isArray(rawId) ? rawId[0] : rawId;
        const { selfRating } = req.body;
        const userId = req.user.userId;
        const rating = await (0, employee_skill_service_1.updateSelfRating)(ratingId, userId, selfRating);
        res.status(200).json(rating);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        if (message === "Rating not found" ||
            message === "Employee profile not found") {
            res.status(404).json({ error: message });
            return;
        }
        if (message === "Rating must be between 1 and 5" ||
            message === "Cannot update reviewed rating") {
            res.status(400).json({ error: message });
            return;
        }
        if (message === "Unauthorized") {
            res.status(403).json({ error: message });
            return;
        }
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.updateSelfRatingHandler = updateSelfRatingHandler;
const getMyRatingsHandler = async (req, res) => {
    try {
        const userId = req.user.userId;
        const ratings = await (0, employee_skill_service_1.getMyRatings)(userId);
        res.status(200).json(ratings);
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
exports.getMyRatingsHandler = getMyRatingsHandler;
const getPendingRatingsHandler = async (req, res) => {
    try {
        const managerUserId = req.user.userId;
        const ratings = await (0, employee_skill_service_1.getPendingRatingsForManager)(managerUserId);
        console.log("MANAGER RATINGS RAW: ", JSON.stringify(ratings, null, 2));
        res.status(200).json(ratings);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        if (message === "Manager profile not found") {
            res.status(404).json({ error: message });
            return;
        }
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getPendingRatingsHandler = getPendingRatingsHandler;
const reviewSkillRatingHandler = async (req, res) => {
    try {
        const rawId = req.params.id;
        const ratingId = Array.isArray(rawId) ? rawId[0] : rawId;
        const { action, approvedRating, comment } = req.body;
        const managerUserId = req.user.userId;
        const rating = await (0, employee_skill_service_1.reviewSkillRating)(ratingId, managerUserId, action, approvedRating, comment);
        res.status(200).json(rating);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        if (message === "Rating not found" ||
            message === "Manager profile not found") {
            res.status(404).json({ error: message });
            return;
        }
        if (message === "Rating is not pending" ||
            message === "Valid approved rating (1-5) required for edit action") {
            res.status(400).json({ error: message });
            return;
        }
        if (message === "Manager mismatch") {
            res.status(403).json({ error: message });
            return;
        }
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.reviewSkillRatingHandler = reviewSkillRatingHandler;
