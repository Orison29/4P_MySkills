"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyActiveCampaignProgress = exports.getDepartmentEmployeeCoverage = exports.getCampaignCoverageAnalytics = exports.listAssessmentCampaigns = exports.createAssessmentCampaign = exports.trackSkillSubmissionInActiveCampaigns = void 0;
const db_1 = require("../../utils/db");
const getCampaignStatus = (startAt, endAt) => {
    const now = new Date();
    if (now < startAt)
        return "SCHEDULED";
    if (now > endAt)
        return "CLOSED";
    return "ACTIVE";
};
const toPercent = (numerator, denominator) => {
    if (denominator === 0)
        return 0;
    return Number(((numerator / denominator) * 100).toFixed(2));
};
const getCompliantEmployeeSet = async (campaignId, threshold, departmentIds) => {
    const grouped = await db_1.prisma.campaignSkillSubmission.groupBy({
        by: ["employeeId"],
        where: {
            campaignId,
            employee: {
                departmentId: {
                    in: departmentIds
                }
            }
        },
        _count: {
            skillId: true
        }
    });
    return new Set(grouped
        .filter((item) => item._count.skillId >= threshold)
        .map((item) => item.employeeId));
};
const trackSkillSubmissionInActiveCampaigns = async (employeeId, skillId) => {
    const now = new Date();
    const activeCampaigns = await db_1.prisma.skillAssessmentCampaign.findMany({
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
    await db_1.prisma.campaignSkillSubmission.createMany({
        data: activeCampaigns.map((campaign) => ({
            campaignId: campaign.id,
            employeeId,
            skillId,
            firstSubmittedAt: now
        })),
        skipDuplicates: true
    });
};
exports.trackSkillSubmissionInActiveCampaigns = trackSkillSubmissionInActiveCampaigns;
const createAssessmentCampaign = async (input) => {
    if (!input.title.trim()) {
        throw new Error("Campaign title is required");
    }
    if (input.minSkillsRequired < 1) {
        throw new Error("Minimum skills required must be at least 1");
    }
    if (input.startAt >= input.endAt) {
        throw new Error("Campaign end date must be after start date");
    }
    return db_1.prisma.skillAssessmentCampaign.create({
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
exports.createAssessmentCampaign = createAssessmentCampaign;
const listAssessmentCampaigns = async () => {
    const campaigns = await db_1.prisma.skillAssessmentCampaign.findMany({
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
exports.listAssessmentCampaigns = listAssessmentCampaigns;
const getCampaignCoverageAnalytics = async (campaignId) => {
    const campaign = await db_1.prisma.skillAssessmentCampaign.findUnique({
        where: { id: campaignId }
    });
    if (!campaign) {
        throw new Error("Campaign not found");
    }
    const departments = await db_1.prisma.department.findMany({
        include: {
            employees: {
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
    const currentCompliant = await getCompliantEmployeeSet(campaign.id, campaign.minSkillsRequired, departmentIds);
    const previousCampaign = await db_1.prisma.skillAssessmentCampaign.findFirst({
        where: {
            id: { not: campaign.id },
            endAt: { lt: campaign.startAt }
        },
        orderBy: {
            endAt: "desc"
        }
    });
    const previousCompliant = previousCampaign
        ? await getCompliantEmployeeSet(previousCampaign.id, previousCampaign.minSkillsRequired, departmentIds)
        : new Set();
    const departmentRows = departments
        .map((department) => {
        const headcount = department.employees.length;
        const currentCompliantCount = department.employees.filter((employee) => currentCompliant.has(employee.id)).length;
        const previousCompliantCount = department.employees.filter((employee) => previousCompliant.has(employee.id)).length;
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
    const summary = departmentRows.reduce((acc, row) => {
        acc.totalEmployees += row.headcount;
        acc.compliantEmployees += row.current.compliantEmployees;
        acc.nonCompliantEmployees += row.current.nonCompliantEmployees;
        return acc;
    }, {
        totalEmployees: 0,
        compliantEmployees: 0,
        nonCompliantEmployees: 0
    });
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
exports.getCampaignCoverageAnalytics = getCampaignCoverageAnalytics;
const getDepartmentEmployeeCoverage = async (campaignId, departmentId) => {
    const campaign = await db_1.prisma.skillAssessmentCampaign.findUnique({
        where: { id: campaignId }
    });
    if (!campaign) {
        throw new Error("Campaign not found");
    }
    const department = await db_1.prisma.department.findUnique({
        where: { id: departmentId },
        include: {
            employees: {
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
        ? await db_1.prisma.campaignSkillSubmission.groupBy({
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
    const progressMap = new Map(grouped.map((item) => [
        item.employeeId,
        {
            ratedSkillCount: item._count.skillId,
            lastSubmittedAt: item._max.firstSubmittedAt
        }
    ]));
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
exports.getDepartmentEmployeeCoverage = getDepartmentEmployeeCoverage;
const getMyActiveCampaignProgress = async (userId) => {
    const employeeProfile = await db_1.prisma.employeeProfile.findUnique({
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
    const campaign = await db_1.prisma.skillAssessmentCampaign.findFirst({
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
    const ratedSkillCount = await db_1.prisma.campaignSkillSubmission.count({
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
            remainingSkillsToMeetThreshold: Math.max(campaign.minSkillsRequired - ratedSkillCount, 0)
        }
    };
};
exports.getMyActiveCampaignProgress = getMyActiveCampaignProgress;
