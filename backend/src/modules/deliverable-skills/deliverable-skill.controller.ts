import { Request, Response } from "express";
import {
	addSkillToDeliverable,
	getDeliverableSkills,
	updateSkillWeight,
	removeSkillFromDeliverable
} from "./deliverable-skill.service";

/**
 * Add a skill to a deliverable
 * POST /api/deliverables/:deliverableId/skills
 * Body: { skillId: string, weight: number }
 */
export const addSkillToDeliverableHandler = async (
	req: Request,
	res: Response
) => {
	try {
		const rawId = req.params.deliverableId;
		const deliverableId = Array.isArray(rawId) ? rawId[0] : rawId;
		const { skillId, weight } = req.body as { skillId: string; weight: number };

		if (!skillId || weight === undefined) {
			res.status(400).json({ error: "skillId and weight are required" });
			return;
		}

		const deliverableSkill = await addSkillToDeliverable(
			deliverableId,
			skillId,
			weight
		);

		res.status(201).json(deliverableSkill);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Internal server error";

		if (
			message === "Deliverable not found" ||
			message === "Skill not found"
		) {
			res.status(404).json({ error: message });
			return;
		}

		if (
			message === "Weight must be between 0 and 1" ||
			message === "Skill already added to this deliverable"
		) {
			res.status(400).json({ error: message });
			return;
		}

		res.status(500).json({ error: "Internal server error" });
	}
};

/**
 * Get all skills for a deliverable
 * GET /api/deliverables/:deliverableId/skills
 */
export const getDeliverableSkillsHandler = async (
	req: Request,
	res: Response
) => {
	try {
		const rawId = req.params.deliverableId;
		const deliverableId = Array.isArray(rawId) ? rawId[0] : rawId;

		const skills = await getDeliverableSkills(deliverableId);
		res.status(200).json(skills);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Internal server error";

		if (message === "Deliverable not found") {
			res.status(404).json({ error: message });
			return;
		}

		res.status(500).json({ error: "Internal server error" });
	}
};

/**
 * Update skill weight for a deliverable
 * PATCH /api/deliverables/:deliverableId/skills/:skillId
 * Body: { weight: number }
 */
export const updateSkillWeightHandler = async (
	req: Request,
	res: Response
) => {
	try {
		const rawDeliverableId = req.params.deliverableId;
		const deliverableId = Array.isArray(rawDeliverableId)
			? rawDeliverableId[0]
			: rawDeliverableId;

		const rawSkillId = req.params.skillId;
		const skillId = Array.isArray(rawSkillId) ? rawSkillId[0] : rawSkillId;

		const { weight } = req.body as { weight: number };

		if (weight === undefined) {
			res.status(400).json({ error: "weight is required" });
			return;
		}

		const updatedSkill = await updateSkillWeight(
			deliverableId,
			skillId,
			weight
		);

		res.status(200).json(updatedSkill);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Internal server error";

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

/**
 * Remove a skill from a deliverable
 * DELETE /api/deliverables/:deliverableId/skills/:skillId
 */
export const removeSkillFromDeliverableHandler = async (
	req: Request,
	res: Response
) => {
	try {
		const rawDeliverableId = req.params.deliverableId;
		const deliverableId = Array.isArray(rawDeliverableId)
			? rawDeliverableId[0]
			: rawDeliverableId;

		const rawSkillId = req.params.skillId;
		const skillId = Array.isArray(rawSkillId) ? rawSkillId[0] : rawSkillId;

		const result = await removeSkillFromDeliverable(deliverableId, skillId);

		res.status(200).json(result);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Internal server error";

		if (message === "Skill not found for this deliverable") {
			res.status(404).json({ error: message });
			return;
		}

		res.status(500).json({ error: "Internal server error" });
	}
};
