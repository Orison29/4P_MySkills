"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeSkillFromDeliverableHandler = exports.updateSkillWeightHandler = exports.getDeliverableSkillsHandler = exports.addSkillToDeliverableHandler = void 0;
const deliverable_skill_service_1 = require("./deliverable-skill.service");
/**
 * Add a skill to a deliverable
 * POST /api/deliverables/:deliverableId/skills
 * Body: { skillId: string, weight: number }
 */
const addSkillToDeliverableHandler = async (req, res) => {
    try {
        const rawId = req.params.deliverableId;
        const deliverableId = Array.isArray(rawId) ? rawId[0] : rawId;
        const { skillId, weight } = req.body;
        if (!skillId || weight === undefined) {
            res.status(400).json({ error: "skillId and weight are required" });
            return;
        }
        const deliverableSkill = await (0, deliverable_skill_service_1.addSkillToDeliverable)(deliverableId, skillId, weight);
        res.status(201).json(deliverableSkill);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        if (message === "Deliverable not found" ||
            message === "Skill not found") {
            res.status(404).json({ error: message });
            return;
        }
        if (message === "Weight must be between 0 and 1" ||
            message === "Skill already added to this deliverable") {
            res.status(400).json({ error: message });
            return;
        }
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.addSkillToDeliverableHandler = addSkillToDeliverableHandler;
/**
 * Get all skills for a deliverable
 * GET /api/deliverables/:deliverableId/skills
 */
const getDeliverableSkillsHandler = async (req, res) => {
    try {
        const rawId = req.params.deliverableId;
        const deliverableId = Array.isArray(rawId) ? rawId[0] : rawId;
        const skills = await (0, deliverable_skill_service_1.getDeliverableSkills)(deliverableId);
        res.status(200).json(skills);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        if (message === "Deliverable not found") {
            res.status(404).json({ error: message });
            return;
        }
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getDeliverableSkillsHandler = getDeliverableSkillsHandler;
/**
 * Update skill weight for a deliverable
 * PATCH /api/deliverables/:deliverableId/skills/:skillId
 * Body: { weight: number }
 */
const updateSkillWeightHandler = async (req, res) => {
    try {
        const rawDeliverableId = req.params.deliverableId;
        const deliverableId = Array.isArray(rawDeliverableId)
            ? rawDeliverableId[0]
            : rawDeliverableId;
        const rawSkillId = req.params.skillId;
        const skillId = Array.isArray(rawSkillId) ? rawSkillId[0] : rawSkillId;
        const { weight } = req.body;
        if (weight === undefined) {
            res.status(400).json({ error: "weight is required" });
            return;
        }
        const updatedSkill = await (0, deliverable_skill_service_1.updateSkillWeight)(deliverableId, skillId, weight);
        res.status(200).json(updatedSkill);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        if (message === "Skill not found for this deliverable") {
            res.status(404).json({ error: message });
            return;
        }
        if (message === "Weight must be between 0 and 1") {
            res.status(400).json({ error: message });
            return;
        }
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.updateSkillWeightHandler = updateSkillWeightHandler;
/**
 * Remove a skill from a deliverable
 * DELETE /api/deliverables/:deliverableId/skills/:skillId
 */
const removeSkillFromDeliverableHandler = async (req, res) => {
    try {
        const rawDeliverableId = req.params.deliverableId;
        const deliverableId = Array.isArray(rawDeliverableId)
            ? rawDeliverableId[0]
            : rawDeliverableId;
        const rawSkillId = req.params.skillId;
        const skillId = Array.isArray(rawSkillId) ? rawSkillId[0] : rawSkillId;
        const result = await (0, deliverable_skill_service_1.removeSkillFromDeliverable)(deliverableId, skillId);
        res.status(200).json(result);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        if (message === "Skill not found for this deliverable") {
            res.status(404).json({ error: message });
            return;
        }
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.removeSkillFromDeliverableHandler = removeSkillFromDeliverableHandler;
