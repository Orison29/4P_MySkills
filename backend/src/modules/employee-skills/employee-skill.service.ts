import { SkillRatingStatus, SkillChangeType } from "@prisma/client";
import { prisma } from "../../utils/db";

// Helper function to log skill progress
const logSkillProgress = async (
	employeeId: string,
	skillId: string,
	previousRating: number | null,
	newRating: number,
	changeType: SkillChangeType,
	changedBy?: string,
	comment?: string
) => {
	await prisma.skillProgressLog.create({
		data: {
			employeeId,
			skillId,
			previousRating,
			newRating,
			changeType,
			changedBy,
			comment
		}
	});
};

export const createSelfRating = async (
	userId: string,
	skillId: string,
	selfRating: number
) => {
	// Validate rating range
	if (selfRating < 1 || selfRating > 5) {
		throw new Error("Rating must be between 1 and 5");
	}

	// Get employee profile
	const employeeProfile = await prisma.employeeProfile.findUnique({
		where: { userId }
	});

	if (!employeeProfile) {
		throw new Error("Employee profile not found");
	}

	// Verify skill exists
	const skill = await prisma.skill.findUnique({
		where: { id: skillId }
	});

	if (!skill) {
		throw new Error("Skill not found");
	}

	// Check if already rated
	const existingRating = await prisma.employeeSkill.findUnique({
		where: {
			employeeId_skillId: {
				employeeId: employeeProfile.id,
				skillId
			}
		}
	});

	if (existingRating) {
		throw new Error("Skill already rated");
	}

	const newRating = await prisma.employeeSkill.create({
		data: {
			employeeId: employeeProfile.id,
			skillId,
			selfRating,
			status: SkillRatingStatus.PENDING
		},
		include: {
			skill: true
		}
	});

	// Log initial rating
	await logSkillProgress(
		employeeProfile.id,
		skillId,
		null,
		selfRating,
		SkillChangeType.INITIAL_RATING
	);

	return newRating;
};

export const updateSelfRating = async (
	ratingId: string,
	userId: string,
	selfRating: number
) => {
	// Validate rating range
	if (selfRating < 1 || selfRating > 5) {
		throw new Error("Rating must be between 1 and 5");
	}

	const employeeProfile = await prisma.employeeProfile.findUnique({
		where: { userId }
	});

	if (!employeeProfile) {
		throw new Error("Employee profile not found");
	}

	const rating = await prisma.employeeSkill.findUnique({
		where: { id: ratingId }
	});

	if (!rating) {
		throw new Error("Rating not found");
	}

	if (rating.employeeId !== employeeProfile.id) {
		throw new Error("Unauthorized");
	}

	if (rating.status !== SkillRatingStatus.PENDING) {
		throw new Error("Cannot update reviewed rating");
	}

	const previousRating = rating.selfRating;

	const updatedRating = await prisma.employeeSkill.update({
		where: { id: ratingId },
		data: { selfRating },
		include: {
			skill: true
		}
	});

	// Log self update
	await logSkillProgress(
		employeeProfile.id,
		rating.skillId,
		previousRating,
		selfRating,
		SkillChangeType.SELF_UPDATED
	);

	return updatedRating;
};

export const getMyRatings = async (userId: string) => {
	const employeeProfile = await prisma.employeeProfile.findUnique({
		where: { userId }
	});

	if (!employeeProfile) {
		throw new Error("Employee profile not found");
	}

	return prisma.employeeSkill.findMany({
		where: {
			employeeId: employeeProfile.id
		},
		include: {
			skill: true,
			reviewer: {
				select: {
					id: true,
					email: true
				}
			}
		},
		orderBy: {
			createdAt: "desc"
		}
	});
};

export const getPendingRatingsForManager = async (managerUserId: string) => {
	const managerProfile = await prisma.employeeProfile.findUnique({
		where: { userId: managerUserId }
	});

	if (!managerProfile) {
		throw new Error("Manager profile not found");
	}

	return prisma.employeeSkill.findMany({
		where: {
			employee: {
				managerId: managerProfile.id
			},
			status: SkillRatingStatus.PENDING
		},
		include: {
			employee: {
				include: {
					user: {
						select: {
							email: true
						}
					}
				}
			},
			skill: true
		},
		orderBy: {
			createdAt: "asc"
		}
	});
};

export const reviewSkillRating = async (
	ratingId: string,
	managerUserId: string,
	action: "APPROVE" | "EDIT" | "REJECT",
	approvedRating?: number,
	comment?: string
) => {
	const rating = await prisma.employeeSkill.findUnique({
		where: { id: ratingId },
		include: {
			employee: true
		}
	});

	if (!rating) {
		throw new Error("Rating not found");
	}

	if (rating.status !== SkillRatingStatus.PENDING) {
		throw new Error("Rating is not pending");
	}

	const managerProfile = await prisma.employeeProfile.findUnique({
		where: { userId: managerUserId }
	});

	if (!managerProfile) {
		throw new Error("Manager profile not found");
	}

	if (rating.employee.managerId !== managerProfile.id) {
		throw new Error("Manager mismatch");
	}

	if (action === "APPROVE") {
		const updatedRating = await prisma.employeeSkill.update({
			where: { id: ratingId },
			data: {
				status: SkillRatingStatus.APPROVED,
				approvedRating: rating.selfRating,
				reviewedBy: managerUserId,
				reviewedAt: new Date(),
				reviewComment: comment
			},
			include: {
				skill: true,
				employee: {
					include: {
						user: {
							select: {
								email: true
							}
						}
					}
				}
			}
		});

		// Log manager approval
		await logSkillProgress(
			rating.employee.id,
			rating.skillId,
			rating.selfRating,
			rating.selfRating,
			SkillChangeType.MANAGER_APPROVED,
			managerUserId,
			comment
		);

		return updatedRating;
	} else if (action === "EDIT") {
		if (!approvedRating || approvedRating < 1 || approvedRating > 5) {
			throw new Error("Valid approved rating (1-5) required for edit action");
		}

		const updatedRating = await prisma.employeeSkill.update({
			where: { id: ratingId },
			data: {
				status: SkillRatingStatus.EDITED,
				approvedRating,
				reviewedBy: managerUserId,
				reviewedAt: new Date(),
				reviewComment: comment
			},
			include: {
				skill: true,
				employee: {
					include: {
						user: {
							select: {
								email: true
							}
						}
					}
				}
			}
		});

		// Log manager edit
		await logSkillProgress(
			rating.employee.id,
			rating.skillId,
			rating.selfRating,
			approvedRating,
			SkillChangeType.MANAGER_EDITED,
			managerUserId,
			comment
		);

		return updatedRating;
	} else {
		// REJECT
		const updatedRating = await prisma.employeeSkill.update({
			where: { id: ratingId },
			data: {
				status: SkillRatingStatus.REJECTED,
				approvedRating: null,
				reviewedBy: managerUserId,
				reviewedAt: new Date(),
				reviewComment: comment
			},
			include: {
				skill: true,
				employee: {
					include: {
						user: {
							select: {
								email: true
							}
						}
					}
				}
			}
		});

		// Log manager rejection
		await logSkillProgress(
			rating.employee.id,
			rating.skillId,
			rating.selfRating,
			rating.selfRating,
			SkillChangeType.MANAGER_REJECTED,
			managerUserId,
			comment
		);

		return updatedRating;
	}
};
