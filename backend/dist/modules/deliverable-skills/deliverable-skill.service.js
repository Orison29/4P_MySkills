"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeSkillFromDeliverable = exports.updateSkillWeight = exports.getDeliverableSkills = exports.addSkillToDeliverable = void 0;
const db_1 = require("../../utils/db");
/**
 * Add a skill requirement to a deliverable with an importance weight
 * @param deliverableId - The deliverable to add the skill to
 * @param skillId - The skill to add
 * @param weight - Importance weight (0.0 to 1.0, where 1.0 is most important)
 */
const addSkillToDeliverable = async (deliverableId, skillId, weight) => {
    // Validate weight range
    if (weight < 0 || weight > 1) {
        throw new Error("Weight must be between 0 and 1");
    }
    // Verify deliverable exists
    const deliverable = await db_1.prisma.deliverable.findUnique({
        where: { id: deliverableId }
    });
    if (!deliverable) {
        throw new Error("Deliverable not found");
    }
    // Verify skill exists
    const skill = await db_1.prisma.skill.findUnique({
        where: { id: skillId }
    });
    if (!skill) {
        throw new Error("Skill not found");
    }
    // Check if skill already added to this deliverable
    const existing = await db_1.prisma.deliverableSkill.findUnique({
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
    return db_1.prisma.deliverableSkill.create({
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
exports.addSkillToDeliverable = addSkillToDeliverable;
/**
 * Get all skills required for a deliverable
 */
const getDeliverableSkills = async (deliverableId) => {
    const deliverable = await db_1.prisma.deliverable.findUnique({
        where: { id: deliverableId }
    });
    if (!deliverable) {
        throw new Error("Deliverable not found");
    }
    return db_1.prisma.deliverableSkill.findMany({
        where: { deliverableId },
        include: {
            skill: true
        },
        orderBy: {
            weight: "desc" // Most important skills first
        }
    });
};
exports.getDeliverableSkills = getDeliverableSkills;
/**
 * Update the importance weight of a skill for a deliverable
 */
const updateSkillWeight = async (deliverableId, skillId, newWeight) => {
    // Validate weight range
    if (newWeight < 0 || newWeight > 1) {
        throw new Error("Weight must be between 0 and 1");
    }
    const deliverableSkill = await db_1.prisma.deliverableSkill.findUnique({
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
    return db_1.prisma.deliverableSkill.update({
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
exports.updateSkillWeight = updateSkillWeight;
/**
 * Remove a skill requirement from a deliverable
 */
const removeSkillFromDeliverable = async (deliverableId, skillId) => {
    const deliverableSkill = await db_1.prisma.deliverableSkill.findUnique({
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
    await db_1.prisma.deliverableSkill.delete({
        where: {
            deliverableId_skillId: {
                deliverableId,
                skillId
            }
        }
    });
    return { message: "Skill removed successfully" };
};
exports.removeSkillFromDeliverable = removeSkillFromDeliverable;
