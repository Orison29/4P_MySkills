import { prisma } from "../../utils/db";

/**
 * Add a skill requirement to a deliverable with an importance weight
 * @param deliverableId - The deliverable to add the skill to
 * @param skillId - The skill to add
 * @param weight - Importance weight (0.0 to 1.0, where 1.0 is most important)
 */
export const addSkillToDeliverable = async (
	deliverableId: string,
	skillId: string,
	weight: number
) => {
	// Validate weight range
	if (weight < 0 || weight > 1) {
		throw new Error("Weight must be between 0 and 1");
	}

	// Verify deliverable exists
	const deliverable = await prisma.deliverable.findUnique({
		where: { id: deliverableId }
	});

	if (!deliverable) {
		throw new Error("Deliverable not found");
	}

	// Verify skill exists
	const skill = await prisma.skill.findUnique({
		where: { id: skillId }
	});

	if (!skill) {
		throw new Error("Skill not found");
	}

	// Check if skill already added to this deliverable
	const existing = await prisma.deliverableSkill.findUnique({
		where: {
			deliverableId_skillId: {
				deliverableId,
				skillId
			}
		}
	});

	if (existing) {
		throw new Error("Skill already added to this deliverable");
	}

	return prisma.deliverableSkill.create({
		data: {
			deliverableId,
			skillId,
			weight
		},
		include: {
			skill: true
		}
	});
};

/**
 * Get all skills required for a deliverable
 */
export const getDeliverableSkills = async (deliverableId: string) => {
	const deliverable = await prisma.deliverable.findUnique({
		where: { id: deliverableId }
	});

	if (!deliverable) {
		throw new Error("Deliverable not found");
	}

	return prisma.deliverableSkill.findMany({
		where: { deliverableId },
		include: {
			skill: true
		},
		orderBy: {
			weight: "desc" // Most important skills first
		}
	});
};

/**
 * Update the importance weight of a skill for a deliverable
 */
export const updateSkillWeight = async (
	deliverableId: string,
	skillId: string,
	newWeight: number
) => {
	// Validate weight range
	if (newWeight < 0 || newWeight > 1) {
		throw new Error("Weight must be between 0 and 1");
	}

	const deliverableSkill = await prisma.deliverableSkill.findUnique({
		where: {
			deliverableId_skillId: {
				deliverableId,
				skillId
			}
		}
	});

	if (!deliverableSkill) {
		throw new Error("Skill not found for this deliverable");
	}

	return prisma.deliverableSkill.update({
		where: {
			deliverableId_skillId: {
				deliverableId,
				skillId
			}
		},
		data: {
			weight: newWeight
		},
		include: {
			skill: true
		}
	});
};

/**
 * Remove a skill requirement from a deliverable
 */
export const removeSkillFromDeliverable = async (
	deliverableId: string,
	skillId: string
) => {
	const deliverableSkill = await prisma.deliverableSkill.findUnique({
		where: {
			deliverableId_skillId: {
				deliverableId,
				skillId
			}
		}
	});

	if (!deliverableSkill) {
		throw new Error("Skill not found for this deliverable");
	}

	await prisma.deliverableSkill.delete({
		where: {
			deliverableId_skillId: {
				deliverableId,
				skillId
			}
		}
	});

	return { message: "Skill removed successfully" };
};
