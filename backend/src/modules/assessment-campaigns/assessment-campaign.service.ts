import { Role } from "@prisma/client";
import { prisma } from "../../utils/db";

type CreateCampaignInput = {
	title: string;
	startAt: Date;
	endAt: Date;
	minSkillsRequired: number;
	createdBy: string;
};

type CampaignState = "SCHEDULED" | "ACTIVE" | "CLOSED";

const getCampaignStatus = (startAt: Date, endAt: Date) => {
	const now = new Date();
	if (now < startAt) return "SCHEDULED";
	if (now > endAt) return "CLOSED";
	return "ACTIVE";
};

const toPercent = (numerator: number, denominator: number) => {
	if (denominator === 0) return 0;
	return Number(((numerator / denominator) * 100).toFixed(2));
};

const getCompliantEmployeeSet = async (
	campaignId: string,
	threshold: number,
	departmentIds: string[]
) => {
	const grouped = await prisma.campaignSkillSubmission.groupBy({
		by: ["employeeId"],
		where: {
			campaignId,
			employee: {
				user: {
					role: Role.EMPLOYEE
				},
				departmentId: {
					in: departmentIds
				}
			}
		},
		_count: {
			skillId: true
		}
	});

	return new Set(
		grouped
			.filter((item) => item._count.skillId >= threshold)
			.map((item) => item.employeeId)
	);
};

export const trackSkillSubmissionInActiveCampaigns = async (
	employeeId: string,
	skillId: string
) => {
	const now = new Date();
	const activeCampaigns = await prisma.skillAssessmentCampaign.findMany({
		where: {
			startAt: { lte: now },
			endAt: { gte: now }
		},
		select: {
			id: true
		}
	});

	if (activeCampaigns.length === 0) {
		return;
	}

	await prisma.campaignSkillSubmission.createMany({
		data: activeCampaigns.map((campaign) => ({
			campaignId: campaign.id,
			employeeId,
			skillId,
			firstSubmittedAt: now
		})),
		skipDuplicates: true
	});
};

export const createAssessmentCampaign = async (input: CreateCampaignInput) => {
	if (!input.title.trim()) {
		throw new Error("Campaign title is required");
	}

	if (input.minSkillsRequired < 1) {
		throw new Error("Minimum skills required must be at least 1");
	}

	if (input.startAt >= input.endAt) {
		throw new Error("Campaign end date must be after start date");
	}

	return prisma.skillAssessmentCampaign.create({
		data: {
			title: input.title.trim(),
			startAt: input.startAt,
			endAt: input.endAt,
			minSkillsRequired: input.minSkillsRequired,
			createdBy: input.createdBy
		},
		include: {
			creator: {
				select: {
					id: true,
					email: true
				}
			}
		}
	});
};

export const listAssessmentCampaigns = async () => {
	const campaigns = await prisma.skillAssessmentCampaign.findMany({
		include: {
			creator: {
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

	return campaigns.map((campaign) => ({
		...campaign,
		status: getCampaignStatus(campaign.startAt, campaign.endAt)
	}));
};

export const updateAssessmentCampaignState = async (
	campaignId: string,
	state: CampaignState
) => {
	const campaign = await prisma.skillAssessmentCampaign.findUnique({
		where: { id: campaignId }
	});

	if (!campaign) {
		throw new Error("Campaign not found");
	}

	const now = new Date();
	let startAt = campaign.startAt;
	let endAt = campaign.endAt;

	if (state === "CLOSED") {
		endAt = new Date(now.getTime() - 60 * 1000);
	}

	if (state === "ACTIVE") {
		if (startAt > now) {
			startAt = new Date(now.getTime() - 60 * 1000);
		}
		if (endAt <= now) {
			endAt = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
		}
	}

	if (state === "SCHEDULED") {
		startAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
		if (endAt <= startAt) {
			endAt = new Date(startAt.getTime() + 10 * 24 * 60 * 60 * 1000);
		}
	}

	const updated = await prisma.skillAssessmentCampaign.update({
		where: { id: campaignId },
		data: {
			startAt,
			endAt
		},
		include: {
			creator: {
				select: {
					id: true,
					email: true
				}
			}
		}
	});

	return {
		...updated,
		status: getCampaignStatus(updated.startAt, updated.endAt)
	};
};

export const deleteAssessmentCampaign = async (campaignId: string) => {
	const campaign = await prisma.skillAssessmentCampaign.findUnique({
		where: { id: campaignId },
		select: { id: true }
	});

	if (!campaign) {
		throw new Error("Campaign not found");
	}

	await prisma.skillAssessmentCampaign.delete({
		where: { id: campaignId }
	});

	return { message: "Campaign deleted successfully" };
};

export const getCampaignCoverageAnalytics = async (campaignId: string) => {
	const campaign = await prisma.skillAssessmentCampaign.findUnique({
		where: { id: campaignId }
	});

	if (!campaign) {
		throw new Error("Campaign not found");
	}

	const departments = await prisma.department.findMany({
		include: {
			employees: {
				where: {
					user: {
						role: Role.EMPLOYEE
					}
				},
				select: {
					id: true
				}
			}
		},
		orderBy: {
			name: "asc"
		}
	});

	const departmentIds = departments.map((department) => department.id);
	const currentCompliant = await getCompliantEmployeeSet(
		campaign.id,
		campaign.minSkillsRequired,
		departmentIds
	);

	const previousCampaign = await prisma.skillAssessmentCampaign.findFirst({
		where: {
			id: { not: campaign.id },
			endAt: { lt: campaign.startAt }
		},
		orderBy: {
			endAt: "desc"
		}
	});

	const previousCompliant = previousCampaign
		? await getCompliantEmployeeSet(
				previousCampaign.id,
				previousCampaign.minSkillsRequired,
				departmentIds
		  )
		: new Set<string>();

	const departmentRows = departments
		.map((department) => {
			const headcount = department.employees.length;
			const currentCompliantCount = department.employees.filter((employee) =>
				currentCompliant.has(employee.id)
			).length;
			const previousCompliantCount = department.employees.filter((employee) =>
				previousCompliant.has(employee.id)
			).length;

			return {
				departmentId: department.id,
				departmentName: department.name,
				headcount,
				current: {
					compliantEmployees: currentCompliantCount,
					nonCompliantEmployees: headcount - currentCompliantCount,
					coveragePct: toPercent(currentCompliantCount, headcount)
				},
				previous: previousCampaign
					? {
						campaignId: previousCampaign.id,
						compliantEmployees: previousCompliantCount,
						nonCompliantEmployees: headcount - previousCompliantCount,
						coveragePct: toPercent(previousCompliantCount, headcount)
					}
					: null
			};
		})
		.sort((a, b) => b.current.coveragePct - a.current.coveragePct);

	const summary = departmentRows.reduce(
		(acc, row) => {
			acc.totalEmployees += row.headcount;
			acc.compliantEmployees += row.current.compliantEmployees;
			acc.nonCompliantEmployees += row.current.nonCompliantEmployees;
			return acc;
		},
		{
			totalEmployees: 0,
			compliantEmployees: 0,
			nonCompliantEmployees: 0
		}
	);

	return {
		campaign: {
			...campaign,
			status: getCampaignStatus(campaign.startAt, campaign.endAt)
		},
		previousCampaign: previousCampaign
			? {
				id: previousCampaign.id,
				title: previousCampaign.title,
				startAt: previousCampaign.startAt,
				endAt: previousCampaign.endAt,
				minSkillsRequired: previousCampaign.minSkillsRequired
			}
			: null,
		summary: {
			...summary,
			coveragePct: toPercent(summary.compliantEmployees, summary.totalEmployees)
		},
		departments: departmentRows
	};
};

export const getDepartmentEmployeeCoverage = async (
	campaignId: string,
	departmentId: string
) => {
	const campaign = await prisma.skillAssessmentCampaign.findUnique({
		where: { id: campaignId }
	});

	if (!campaign) {
		throw new Error("Campaign not found");
	}

	const department = await prisma.department.findUnique({
		where: { id: departmentId },
		include: {
			employees: {
				where: {
					user: {
						role: Role.EMPLOYEE
					}
				},
				include: {
					user: {
						select: {
							id: true,
							email: true
						}
					}
				},
				orderBy: {
					fullname: "asc"
				}
			}
		}
	});

	if (!department) {
		throw new Error("Department not found");
	}

	const employeeIds = department.employees.map((employee) => employee.id);
	const grouped = employeeIds.length
		? await prisma.campaignSkillSubmission.groupBy({
				by: ["employeeId"],
				where: {
					campaignId,
					employeeId: {
						in: employeeIds
					}
				},
				_count: {
					skillId: true
				},
				_max: {
					firstSubmittedAt: true
				}
		  })
		: [];

	const progressMap = new Map(
		grouped.map((item) => [
			item.employeeId,
			{
				ratedSkillCount: item._count.skillId,
				lastSubmittedAt: item._max.firstSubmittedAt
			}
		])
	);

	const employees = department.employees.map((employee) => {
		const progress = progressMap.get(employee.id);
		const ratedSkillCount = progress?.ratedSkillCount ?? 0;
		const score = ratedSkillCount >= campaign.minSkillsRequired ? 1 : 0;

		return {
			employeeId: employee.id,
			userId: employee.userId,
			email: employee.user.email,
			fullname: employee.fullname,
			ratedSkillCount,
			minSkillsRequired: campaign.minSkillsRequired,
			score,
			status: score === 1 ? "GOOD" : "BAD",
			lastSubmittedAt: progress?.lastSubmittedAt ?? null
		};
	});

	const compliantEmployees = employees.filter((employee) => employee.score === 1).length;
	const totalEmployees = employees.length;

	return {
		campaign: {
			id: campaign.id,
			title: campaign.title,
			startAt: campaign.startAt,
			endAt: campaign.endAt,
			minSkillsRequired: campaign.minSkillsRequired,
			status: getCampaignStatus(campaign.startAt, campaign.endAt)
		},
		department: {
			id: department.id,
			name: department.name,
			headcount: totalEmployees,
			compliantEmployees,
			nonCompliantEmployees: totalEmployees - compliantEmployees,
			coveragePct: toPercent(compliantEmployees, totalEmployees)
		},
		employees
	};
};

export const getMyActiveCampaignProgress = async (userId: string) => {
	const employeeProfile = await prisma.employeeProfile.findUnique({
		where: { userId },
		include: {
			department: {
				select: {
					id: true,
					name: true
				}
			}
		}
	});

	if (!employeeProfile) {
		throw new Error("Employee profile not found");
	}

	const now = new Date();
	const campaign = await prisma.skillAssessmentCampaign.findFirst({
		where: {
			startAt: { lte: now },
			endAt: { gte: now }
		},
		orderBy: {
			startAt: "desc"
		}
	});

	if (!campaign) {
		return {
			activeCampaign: null
		};
	}

	const ratedSkillCount = await prisma.campaignSkillSubmission.count({
		where: {
			campaignId: campaign.id,
			employeeId: employeeProfile.id
		}
	});

	const score = ratedSkillCount >= campaign.minSkillsRequired ? 1 : 0;

	return {
		activeCampaign: {
			id: campaign.id,
			title: campaign.title,
			startAt: campaign.startAt,
			endAt: campaign.endAt,
			minSkillsRequired: campaign.minSkillsRequired,
			status: getCampaignStatus(campaign.startAt, campaign.endAt)
		},
		employee: {
			employeeId: employeeProfile.id,
			fullname: employeeProfile.fullname,
			department: employeeProfile.department
		},
		progress: {
			ratedSkillCount,
			score,
			status: score === 1 ? "GOOD" : "BAD",
			remainingSkillsToMeetThreshold: Math.max(
				campaign.minSkillsRequired - ratedSkillCount,
				0
			)
		}
	};
};
