import { prisma } from "../../utils/db";
import { Role } from "@prisma/client";

type LearningCategory = "FAST" | "MODERATE" | "SLOW" | "NO_PROGRESS" | "REGRESSION";

function categorizeLearningSpeed(score: number): LearningCategory {
	if (score >= 0.03) return "FAST";
	if (score >= 0.01) return "MODERATE";
	if (score > 0) return "SLOW";
	if (score === 0) return "NO_PROGRESS";
	return "REGRESSION";
}

export const getLearningSpeed = async (startDate?: string, endDate?: string) => {
	const employees = await prisma.employeeProfile.findMany({
		where: { user: { role: Role.EMPLOYEE } },
		select: {
			id: true,
			fullname: true,
			department: { select: { id: true, name: true } }
		}
	});

	if (employees.length === 0) {
		return {
			departments: [],
			employees: [],
			summary: { FAST: 0, MODERATE: 0, SLOW: 0, NO_PROGRESS: 0, REGRESSION: 0 }
		};
	}

	const employeeIds = employees.map((e) => e.id);

	const dateFilter =
		startDate || endDate
			? {
					changedAt: {
						...(startDate ? { gte: new Date(startDate) } : {}),
						...(endDate ? { lte: new Date(endDate + "T23:59:59.999Z") } : {})
					}
			  }
			: {};

	const logs = await prisma.skillProgressLog.findMany({
		where: { employeeId: { in: employeeIds }, ...dateFilter },
		select: { employeeId: true, skillId: true, newRating: true, changedAt: true },
		orderBy: { changedAt: "asc" }
	});

	// Group logs: employeeId -> skillId -> ordered entries
	const byEmployee = new Map<
		string,
		Map<string, Array<{ newRating: number; changedAt: Date }>>
	>();
	for (const log of logs) {
		if (!byEmployee.has(log.employeeId)) byEmployee.set(log.employeeId, new Map());
		const bySkill = byEmployee.get(log.employeeId)!;
		if (!bySkill.has(log.skillId)) bySkill.set(log.skillId, []);
		bySkill.get(log.skillId)!.push({ newRating: log.newRating, changedAt: log.changedAt });
	}

	// Per-employee scores
	const employeeResults = employees.map((emp) => {
		const bySkill = byEmployee.get(emp.id);
		const velocities: number[] = [];

		if (bySkill) {
			for (const skillLogs of bySkill.values()) {
				if (skillLogs.length < 2) continue;
				const first = skillLogs[0];
				const last = skillLogs[skillLogs.length - 1];
				const delta = last.newRating - first.newRating;
				const days = Math.max(
					1,
					(last.changedAt.getTime() - first.changedAt.getTime()) / (1000 * 60 * 60 * 24)
				);
				velocities.push(delta / days);
			}
		}

		const score =
			velocities.length > 0
				? velocities.reduce((s, v) => s + v, 0) / velocities.length
				: 0;

		return {
			employeeId: emp.id,
			fullname: emp.fullname,
			department: emp.department?.name ?? "Unassigned",
			score: parseFloat(score.toFixed(6)),
			category: categorizeLearningSpeed(score),
			validSkillCount: velocities.length
		};
	});

	// Department aggregates
	const deptMap = new Map<string, { scores: number[]; count: number }>();
	for (const emp of employeeResults) {
		if (!deptMap.has(emp.department)) deptMap.set(emp.department, { scores: [], count: 0 });
		const entry = deptMap.get(emp.department)!;
		entry.scores.push(emp.score);
		entry.count += 1;
	}

	const departmentResults = Array.from(deptMap.entries())
		.map(([name, { scores, count }]) => {
			const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
			return {
				department: name,
				score: parseFloat(avg.toFixed(6)),
				category: categorizeLearningSpeed(avg),
				employeeCount: count
			};
		})
		.sort((a, b) => a.department.localeCompare(b.department));

	// Summary counts by category
	const summary: Record<LearningCategory, number> = {
		FAST: 0,
		MODERATE: 0,
		SLOW: 0,
		NO_PROGRESS: 0,
		REGRESSION: 0
	};
	for (const emp of employeeResults) {
		summary[emp.category] += 1;
	}

	return { departments: departmentResults, employees: employeeResults, summary };
};

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
		department: employee.department?.name || 'Unassigned',
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
			user: {
				select: {
					role: true
				}
			},
			manager: {
				select: {
					fullname: true
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
			department: emp.department?.name || 'Unassigned',
			role: emp.user.role,
			manager: emp.manager ? { fullname: emp.manager.fullname } : null,
			totalSkills,
			approvedSkills,
			pendingSkills,
			averageRating: parseFloat(averageRating.toFixed(2)),
			lastUpdated
		};
	});
};

export const getSkillSpectrumByDepartment = async (skillId: string) => {
	const skill = await prisma.skill.findUnique({
		where: { id: skillId },
		select: { id: true, name: true }
	});

	if (!skill) {
		throw new Error("Skill not found");
	}

	const departments = await prisma.department.findMany({
		include: {
			employees: {
				where: {
					user: {
						role: Role.EMPLOYEE
					}
				},
				include: {
					employeeSkills: {
						where: {
							skillId
						},
						select: {
							selfRating: true,
							approvedRating: true
						}
					}
				}
			}
		},
		orderBy: {
			name: "asc"
		}
	});

	const rows = departments.map((department) => {
		const levels = {
			level0: 0,
			level1: 0,
			level2: 0,
			level3: 0,
			level4: 0,
			level5: 0
		};

		department.employees.forEach((employee) => {
			const rating = employee.employeeSkills[0]
				? employee.employeeSkills[0].approvedRating ?? employee.employeeSkills[0].selfRating
				: null;

			if (!rating) {
				levels.level0 += 1;
				return;
			}

			if (rating <= 1) levels.level1 += 1;
			else if (rating === 2) levels.level2 += 1;
			else if (rating === 3) levels.level3 += 1;
			else if (rating === 4) levels.level4 += 1;
			else levels.level5 += 1;
		});

		return {
			departmentId: department.id,
			departmentName: department.name,
			headcount: department.employees.length,
			levels
		};
	});

	const totals = rows.reduce(
		(acc, row) => {
			acc.headcount += row.headcount;
			acc.level0 += row.levels.level0;
			acc.level1 += row.levels.level1;
			acc.level2 += row.levels.level2;
			acc.level3 += row.levels.level3;
			acc.level4 += row.levels.level4;
			acc.level5 += row.levels.level5;
			return acc;
		},
		{
			headcount: 0,
			level0: 0,
			level1: 0,
			level2: 0,
			level3: 0,
			level4: 0,
			level5: 0
		}
	);

	return {
		skill,
		departments: rows,
		totals
	};
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

export const getDashboardStats = async () => {
	const activeProjects = await prisma.project.count({
		where: { status: "ACTIVE" }
	});
	
	const totalEmployees = await prisma.employeeProfile.count();
	
	const pendingAssignments = await prisma.assignmentRequest.count({
		where: { status: "PENDING" }
	});

	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
	const newSkills = await prisma.skill.count({
		where: { createdAt: { gte: thirtyDaysAgo } }
	});

	// Get skill progress logs for the last 30 days
	const recentLogs = await prisma.skillProgressLog.findMany({
		where: { changedAt: { gte: thirtyDaysAgo } },
		select: { changedAt: true }
	});

	// Aggregate by day
	const activityByDay: Record<string, number> = {};
	
	// Initialize last 30 days with 0
	for (let i = 29; i >= 0; i--) {
		const d = new Date();
		d.setDate(d.getDate() - i);
		activityByDay[d.toISOString().split('T')[0]] = 0;
	}

	recentLogs.forEach(log => {
		const dateStr = log.changedAt.toISOString().split('T')[0];
		if (activityByDay[dateStr] !== undefined) {
			activityByDay[dateStr]++;
		}
	});

	const activityGraphData = Object.entries(activityByDay).map(([date, count]) => ({
		date,
		count
	}));

	return {
		activeProjects,
		totalEmployees,
		pendingAssignments,
		newSkills,
		activityGraphData
	};
};
