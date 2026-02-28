import { prisma } from "../../utils/db";

export const getEmployeeSkillProgress = async (employeeId: string) => {
	const employee = await prisma.employeeProfile.findUnique({
		where: { id: employeeId },
		select: {
			id: true,
			fullname: true,
			department: {
				select: {
					name: true
				}
			}
		}
	});

	if (!employee) {
		throw new Error("Employee not found");
	}

	// Get all skills with their progress logs
	const employeeSkills = await prisma.employeeSkill.findMany({
		where: { employeeId },
		include: {
			skill: true
		}
	});

	const progressLogs = await prisma.skillProgressLog.findMany({
		where: { employeeId },
		include: {
			skill: true,
			reviewer: {
				select: {
					id: true,
					email: true,
					profile: {
						select: {
							fullname: true
						}
					}
				}
			}
		},
		orderBy: {
			changedAt: "asc"
		}
	});

	// Group logs by skill
	const skillProgress = employeeSkills.map((empSkill) => {
		const logs = progressLogs.filter((log) => log.skillId === empSkill.skillId);

		return {
			skillId: empSkill.skill.id,
			skillName: empSkill.skill.name,
			currentRating: empSkill.approvedRating || empSkill.selfRating,
			status: empSkill.status,
			history: logs.map((log) => ({
				rating: log.newRating,
				previousRating: log.previousRating,
				changeType: log.changeType,
				date: log.changedAt,
				comment: log.comment,
				reviewedBy: log.reviewer
					? {
							email: log.reviewer.email,
							fullname: log.reviewer.profile?.fullname || "Unknown"
					  }
					: null
			}))
		};
	});

	return {
		employeeId: employee.id,
		fullname: employee.fullname,
		department: employee.department.name,
		skills: skillProgress
	};
};

export const getAllEmployeesOverview = async () => {
	const employees = await prisma.employeeProfile.findMany({
		include: {
			department: {
				select: {
					name: true
				}
			},
			employeeSkills: {
				include: {
					skill: true
				}
			}
		},
		orderBy: {
			fullname: "asc"
		}
	});

	return employees.map((emp) => {
		const totalSkills = emp.employeeSkills.length;
		const approvedSkills = emp.employeeSkills.filter(
			(es) => es.status === "APPROVED" || es.status === "EDITED"
		).length;
		const pendingSkills = emp.employeeSkills.filter(
			(es) => es.status === "PENDING"
		).length;

		// Calculate average rating (approved ratings only)
		const approvedRatings = emp.employeeSkills
			.filter((es) => es.approvedRating !== null)
			.map((es) => es.approvedRating as number);

		const averageRating =
			approvedRatings.length > 0
				? approvedRatings.reduce((sum, rating) => sum + rating, 0) /
				  approvedRatings.length
				: 0;

		// Get last updated date
		const lastUpdated =
			emp.employeeSkills.length > 0
				? emp.employeeSkills.reduce((latest, es) =>
						es.updatedAt > latest ? es.updatedAt : latest
				  , emp.employeeSkills[0].updatedAt)
				: null;

		return {
			id: emp.id,
			fullname: emp.fullname,
			department: emp.department.name,
			totalSkills,
			approvedSkills,
			pendingSkills,
			averageRating: parseFloat(averageRating.toFixed(2)),
			lastUpdated
		};
	});
};

export const getSkillProgressTimeline = async (
	employeeId: string,
	skillId: string
) => {
	const employee = await prisma.employeeProfile.findUnique({
		where: { id: employeeId },
		select: {
			fullname: true
		}
	});

	if (!employee) {
		throw new Error("Employee not found");
	}

	const skill = await prisma.skill.findUnique({
		where: { id: skillId },
		select: {
			name: true,
			description: true
		}
	});

	if (!skill) {
		throw new Error("Skill not found");
	}

	const timeline = await prisma.skillProgressLog.findMany({
		where: {
			employeeId,
			skillId
		},
		include: {
			reviewer: {
				select: {
					email: true,
					profile: {
						select: {
							fullname: true
						}
					}
				}
			}
		},
		orderBy: {
			changedAt: "asc"
		}
	});

	const currentSkill = await prisma.employeeSkill.findUnique({
		where: {
			employeeId_skillId: {
				employeeId,
				skillId
			}
		}
	});

	if (!currentSkill) {
		throw new Error("Employee has not rated this skill");
	}

	const totalImprovement =
		timeline.length > 0
			? timeline[timeline.length - 1].newRating - (timeline[0].previousRating || timeline[0].newRating)
			: 0;

	const durationDays =
		timeline.length > 1
			? Math.ceil(
					(timeline[timeline.length - 1].changedAt.getTime() -
						timeline[0].changedAt.getTime()) /
						(1000 * 60 * 60 * 24)
			  )
			: 0;

	return {
		employee: { fullname: employee.fullname },
		skill: { name: skill.name, description: skill.description },
		currentRating: currentSkill.approvedRating || currentSkill.selfRating,
		status: currentSkill.status,
		timeline: timeline.map((log) => ({
			date: log.changedAt,
			rating: log.newRating,
			previousRating: log.previousRating,
			changeType: log.changeType,
			comment: log.comment,
			reviewedBy: log.reviewer
				? {
						email: log.reviewer.email,
						fullname: log.reviewer.profile?.fullname || "Unknown"
				  }
				: null
		})),
		totalImprovement,
		durationDays
	};
};
