"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectRecommendations = exports.getEmployeeSkillAnalysis = exports.getRecommendedEmployees = void 0;
const client_1 = require("@prisma/client");
const db_1 = require("../../utils/db");
/**
 * Get recommended employees for a deliverable based on skill matching
 * Formula: Skill Index = Σ(Skill Weight × Manager-Approved Rating)
 *
 * @param deliverableId - The deliverable to get recommendations for
 * @param topK - Number of top employees to return (default: 5)
 */
const getRecommendedEmployees = async (deliverableId, topK = 5) => {
    // 1. Verify deliverable exists and get required skills
    const deliverable = await db_1.prisma.deliverable.findUnique({
        where: { id: deliverableId },
        include: {
            requiredSkills: {
                include: {
                    skill: true
                }
            }
        }
    });
    if (!deliverable) {
        throw new Error("Deliverable not found");
    }
    if (deliverable.requiredSkills.length === 0) {
        throw new Error("Deliverable has no required skills defined");
    }
    // 2. Get all employees with their approved skill ratings
    const employees = await db_1.prisma.employeeProfile.findMany({
        where: {
            user: {
                role: "EMPLOYEE"
            }
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true
                }
            },
            department: {
                select: {
                    name: true
                }
            },
            employeeSkills: {
                where: {
                    status: {
                        in: [client_1.SkillRatingStatus.APPROVED, client_1.SkillRatingStatus.EDITED]
                    }
                },
                include: {
                    skill: true
                }
            }
        }
    });
    // 3. Calculate skill index for each employee
    const recommendations = [];
    for (const employee of employees) {
        const skillMatches = [];
        const missingSkills = [];
        let totalSkillIndex = 0;
        // Check each required skill for this deliverable
        for (const requiredSkill of deliverable.requiredSkills) {
            // Find if employee has this skill (approved rating)
            const employeeSkill = employee.employeeSkills.find((rating) => rating.skillId === requiredSkill.skillId);
            if (employeeSkill && employeeSkill.approvedRating) {
                // Employee has this skill - calculate contribution
                const contribution = requiredSkill.weight * employeeSkill.approvedRating;
                totalSkillIndex += contribution;
                skillMatches.push({
                    skillId: requiredSkill.skillId,
                    skillName: requiredSkill.skill.name,
                    requiredWeight: requiredSkill.weight,
                    employeeRating: employeeSkill.approvedRating,
                    contribution
                });
            }
            else {
                // Employee doesn't have this skill
                missingSkills.push(requiredSkill.skill.name);
                skillMatches.push({
                    skillId: requiredSkill.skillId,
                    skillName: requiredSkill.skill.name,
                    requiredWeight: requiredSkill.weight,
                    employeeRating: null,
                    contribution: 0
                });
            }
        }
        // Calculate coverage percentage
        const skillsHaveCount = deliverable.requiredSkills.length - missingSkills.length;
        const coveragePercentage = (skillsHaveCount / deliverable.requiredSkills.length) * 100;
        recommendations.push({
            employeeId: employee.id,
            employeeUserId: employee.userId,
            employeeName: employee.fullname,
            departmentName: employee.department?.name || null,
            totalSkillIndex,
            skillMatches,
            missingSkills,
            coveragePercentage
        });
    }
    // 4. Sort by skill index (highest first) and return top K
    recommendations.sort((a, b) => b.totalSkillIndex - a.totalSkillIndex);
    return recommendations.slice(0, topK);
};
exports.getRecommendedEmployees = getRecommendedEmployees;
/**
 * Get skill analysis for a specific employee for a deliverable
 * Useful for detailed view before assignment
 */
const getEmployeeSkillAnalysis = async (deliverableId, employeeId) => {
    const deliverable = await db_1.prisma.deliverable.findUnique({
        where: { id: deliverableId },
        include: {
            requiredSkills: {
                include: {
                    skill: true
                },
                orderBy: {
                    weight: "desc"
                }
            }
        }
    });
    if (!deliverable) {
        throw new Error("Deliverable not found");
    }
    const employee = await db_1.prisma.employeeProfile.findUnique({
        where: { id: employeeId },
        include: {
            user: {
                select: {
                    id: true,
                    email: true
                }
            },
            department: {
                select: {
                    name: true
                }
            },
            employeeSkills: {
                where: {
                    status: {
                        in: [client_1.SkillRatingStatus.APPROVED, client_1.SkillRatingStatus.EDITED]
                    }
                },
                include: {
                    skill: true
                }
            }
        }
    });
    if (!employee) {
        throw new Error("Employee not found");
    }
    const skillBreakdown = [];
    const missingSkills = [];
    let totalSkillIndex = 0;
    for (const requiredSkill of deliverable.requiredSkills) {
        const employeeSkill = employee.employeeSkills.find((rating) => rating.skillId === requiredSkill.skillId);
        if (employeeSkill && employeeSkill.approvedRating) {
            const contribution = requiredSkill.weight * employeeSkill.approvedRating;
            totalSkillIndex += contribution;
            skillBreakdown.push({
                skillId: requiredSkill.skillId,
                skillName: requiredSkill.skill.name,
                requiredWeight: requiredSkill.weight,
                employeeRating: employeeSkill.approvedRating,
                contribution
            });
        }
        else {
            missingSkills.push(requiredSkill.skill.name);
            skillBreakdown.push({
                skillId: requiredSkill.skillId,
                skillName: requiredSkill.skill.name,
                requiredWeight: requiredSkill.weight,
                employeeRating: null,
                contribution: 0
            });
        }
    }
    const coveragePercentage = deliverable.requiredSkills.length > 0
        ? ((deliverable.requiredSkills.length - missingSkills.length) / deliverable.requiredSkills.length) * 100
        : 0;
    return {
        employee: {
            id: employee.id,
            userId: employee.userId,
            name: employee.fullname,
            email: employee.user.email,
            department: employee.department?.name || null
        },
        deliverable: {
            id: deliverable.id,
            name: deliverable.name,
            description: deliverable.description
        },
        totalSkillIndex,
        coveragePercentage,
        skillBreakdown,
        missingSkills
    };
};
exports.getEmployeeSkillAnalysis = getEmployeeSkillAnalysis;
/**
 * Get recommendations for ALL deliverables in a project at once
 * Single button to see top employees for each deliverable
 */
const getProjectRecommendations = async (projectId, topK = 5) => {
    // Verify project exists
    const project = await db_1.prisma.project.findUnique({
        where: { id: projectId },
        include: {
            deliverables: {
                include: {
                    requiredSkills: {
                        include: {
                            skill: true
                        }
                    }
                }
            }
        }
    });
    if (!project) {
        throw new Error("Project not found");
    }
    if (project.deliverables.length === 0) {
        throw new Error("Project has no deliverables. Run AI analysis first.");
    }
    // Get recommendations for each deliverable
    const deliverableRecommendations = [];
    for (const deliverable of project.deliverables) {
        if (deliverable.requiredSkills.length > 0) {
            const recommendations = await (0, exports.getRecommendedEmployees)(deliverable.id, topK);
            deliverableRecommendations.push({
                deliverableId: deliverable.id,
                deliverableName: deliverable.name,
                deliverableDescription: deliverable.description,
                requiredSkillsCount: deliverable.requiredSkills.length,
                topRecommendations: recommendations
            });
        }
    }
    return {
        projectId,
        projectName: project.name,
        totalDeliverables: project.deliverables.length,
        deliverablesWithRecommendations: deliverableRecommendations.length,
        deliverables: deliverableRecommendations
    };
};
exports.getProjectRecommendations = getProjectRecommendations;
