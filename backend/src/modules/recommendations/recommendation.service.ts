import { SkillRatingStatus } from "@prisma/client";
import { prisma } from "../../utils/db";

interface EmployeeSkillMatch {
	skillId: string;
	skillName: string;
	requiredWeight: number;
	employeeRating: number | null;
	contribution: number; // weight × rating
}

interface EmployeeRecommendation {
	employeeId: string;
	employeeUserId: string;
	employeeName: string;
	departmentName: string | null;
	totalSkillIndex: number;
	skillMatches: EmployeeSkillMatch[];
	missingSkills: string[]; // Skills they don't have ratings for
	coveragePercentage: number; // % of required skills they have
}

/**
 * Get recommended employees for a deliverable based on skill matching
 * Formula: Skill Index = Σ(Skill Weight × Manager-Approved Rating)
 * 
 * @param deliverableId - The deliverable to get recommendations for
 * @param topK - Number of top employees to return (default: 5)
 */
export const getRecommendedEmployees = async (
	deliverableId: string,
	topK: number = 5
): Promise<EmployeeRecommendation[]> => {
	// 1. Verify deliverable exists and get required skills
	const deliverable = await prisma.deliverable.findUnique({
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
	const employees = await prisma.employeeProfile.findMany({
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
					status: SkillRatingStatus.APPROVED // Only manager-approved ratings
				},
				include: {
					skill: true
				}
			}
		}
	});

	// 3. Calculate skill index for each employee
	const recommendations: EmployeeRecommendation[] = [];

	for (const employee of employees) {
		const skillMatches: EmployeeSkillMatch[] = [];
		const missingSkills: string[] = [];
		let totalSkillIndex = 0;

		// Check each required skill for this deliverable
		for (const requiredSkill of deliverable.requiredSkills) {
			// Find if employee has this skill (approved rating)
			const employeeSkill = employee.employeeSkills.find(
				(rating) => rating.skillId === requiredSkill.skillId
			);

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
			} else {
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

/**
 * Get skill analysis for a specific employee for a deliverable
 * Useful for detailed view before assignment
 */
export const getEmployeeSkillAnalysis = async (
	deliverableId: string,
	employeeId: string
) => {
	const deliverable = await prisma.deliverable.findUnique({
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

	const employee = await prisma.employeeProfile.findUnique({
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
					status: SkillRatingStatus.APPROVED
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

	const skillBreakdown: EmployeeSkillMatch[] = [];
	const missingSkills: string[] = [];
	let totalSkillIndex = 0;

	for (const requiredSkill of deliverable.requiredSkills) {
		const employeeSkill = employee.employeeSkills.find(
			(rating) => rating.skillId === requiredSkill.skillId
		);

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
		} else {
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

	const coveragePercentage =
		((deliverable.requiredSkills.length - missingSkills.length) /
			deliverable.requiredSkills.length) *
		100;

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

/**
 * Get recommendations for ALL deliverables in a project at once
 * Single button to see top employees for each deliverable
 */
export const getProjectRecommendations = async (
	projectId: string,
	topK: number = 5
) => {
	// Verify project exists
	const project = await prisma.project.findUnique({
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
			const recommendations = await getRecommendedEmployees(deliverable.id, topK);
			
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
