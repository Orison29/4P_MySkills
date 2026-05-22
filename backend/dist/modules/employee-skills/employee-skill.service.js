"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewSkillRating = exports.getPendingRatingsForManager = exports.getMyRatings = exports.updateSelfRating = exports.createSelfRating = void 0;
const client_1 = require("@prisma/client");
const db_1 = require("../../utils/db");
const assessment_campaign_service_1 = require("../assessment-campaigns/assessment-campaign.service");
// Helper function to log skill progress
const logSkillProgress = async (employeeId, skillId, previousRating, newRating, changeType, changedBy, comment) => {
    await db_1.prisma.skillProgressLog.create({
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
const createSelfRating = async (userId, skillId, selfRating) => {
    // Validate rating range
    if (selfRating < 1 || selfRating > 5) {
        throw new Error("Rating must be between 1 and 5");
    }
    // Get employee profile
    let employeeProfile = await db_1.prisma.employeeProfile.findUnique({
        where: { userId }
    });
    if (!employeeProfile) {
        // Auto-create a stub profile for testing users without one
        // We need a department to satisfy foreign keys
        let dept = await db_1.prisma.department.findFirst();
        if (!dept) {
            dept = await db_1.prisma.department.create({
                data: { name: 'Default Department' }
            });
        }
        const user = await db_1.prisma.user.findUnique({ where: { id: userId } });
        employeeProfile = await db_1.prisma.employeeProfile.create({
            data: {
                userId,
                fullname: user?.email?.split('@')[0] || 'Unknown User',
                departmentId: dept.id,
            }
        });
    }
    // Verify skill exists
    const skill = await db_1.prisma.skill.findUnique({
        where: { id: skillId }
    });
    if (!skill) {
        throw new Error("Skill not found");
    }
    // Check if already rated
    const existingRating = await db_1.prisma.employeeSkill.findUnique({
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
    const newRating = await db_1.prisma.employeeSkill.create({
        data: {
            employeeId: employeeProfile.id,
            skillId,
            selfRating,
            status: client_1.SkillRatingStatus.PENDING
        },
        include: {
            skill: true
        }
    });
    // Log initial rating
    await logSkillProgress(employeeProfile.id, skillId, null, selfRating, client_1.SkillChangeType.INITIAL_RATING);
    await (0, assessment_campaign_service_1.trackSkillSubmissionInActiveCampaigns)(employeeProfile.id, skillId);
    return newRating;
};
exports.createSelfRating = createSelfRating;
const updateSelfRating = async (ratingId, userId, selfRating) => {
    // Validate rating range
    if (selfRating < 1 || selfRating > 5) {
        throw new Error("Rating must be between 1 and 5");
    }
    const employeeProfile = await db_1.prisma.employeeProfile.findUnique({
        where: { userId }
    });
    if (!employeeProfile) {
        throw new Error("Employee profile not found");
    }
    const rating = await db_1.prisma.employeeSkill.findUnique({
        where: { id: ratingId }
    });
    if (!rating) {
        throw new Error("Rating not found");
    }
    if (rating.employeeId !== employeeProfile.id) {
        throw new Error("Unauthorized");
    }
    const previousRating = rating.selfRating;
    const updatedRating = await db_1.prisma.employeeSkill.update({
        where: { id: ratingId },
        data: {
            selfRating,
            status: client_1.SkillRatingStatus.PENDING,
            approvedRating: null,
            reviewedBy: null,
            reviewedAt: null,
            reviewComment: null
        },
        include: {
            skill: true
        }
    });
    // Log self update
    await logSkillProgress(employeeProfile.id, rating.skillId, previousRating, selfRating, client_1.SkillChangeType.SELF_UPDATED);
    await (0, assessment_campaign_service_1.trackSkillSubmissionInActiveCampaigns)(employeeProfile.id, rating.skillId);
    return updatedRating;
};
exports.updateSelfRating = updateSelfRating;
const getMyRatings = async (userId) => {
    const employeeProfile = await db_1.prisma.employeeProfile.findUnique({
        where: { userId }
    });
    if (!employeeProfile) {
        return [];
    }
    return db_1.prisma.employeeSkill.findMany({
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
exports.getMyRatings = getMyRatings;
const getPendingRatingsForManager = async (managerUserId) => {
    const managerProfile = await db_1.prisma.employeeProfile.findUnique({
        where: { userId: managerUserId }
    });
    if (!managerProfile) {
        return [];
    }
    const ratings = await db_1.prisma.employeeSkill.findMany({
        where: {
            employee: {
                managerId: managerProfile.id
            },
            status: client_1.SkillRatingStatus.PENDING
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
    return ratings;
};
exports.getPendingRatingsForManager = getPendingRatingsForManager;
const reviewSkillRating = async (ratingId, managerUserId, action, approvedRating, comment) => {
    const rating = await db_1.prisma.employeeSkill.findUnique({
        where: { id: ratingId },
        include: {
            employee: true
        }
    });
    if (!rating) {
        throw new Error("Rating not found");
    }
    if (rating.status !== client_1.SkillRatingStatus.PENDING) {
        throw new Error("Rating is not pending");
    }
    const managerProfile = await db_1.prisma.employeeProfile.findUnique({
        where: { userId: managerUserId }
    });
    if (!managerProfile) {
        throw new Error("Manager profile not found");
    }
    if (rating.employee.managerId !== managerProfile.id) {
        throw new Error("Manager mismatch");
    }
    if (action === "APPROVE") {
        const updatedRating = await db_1.prisma.employeeSkill.update({
            where: { id: ratingId },
            data: {
                status: client_1.SkillRatingStatus.APPROVED,
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
        await logSkillProgress(rating.employee.id, rating.skillId, rating.selfRating, rating.selfRating, client_1.SkillChangeType.MANAGER_APPROVED, managerUserId, comment);
        return updatedRating;
    }
    else if (action === "EDIT") {
        if (!approvedRating || approvedRating < 1 || approvedRating > 5) {
            throw new Error("Valid approved rating (1-5) required for edit action");
        }
        const updatedRating = await db_1.prisma.employeeSkill.update({
            where: { id: ratingId },
            data: {
                status: client_1.SkillRatingStatus.EDITED,
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
        await logSkillProgress(rating.employee.id, rating.skillId, rating.selfRating, approvedRating, client_1.SkillChangeType.MANAGER_EDITED, managerUserId, comment);
        return updatedRating;
    }
    else {
        // REJECT
        const updatedRating = await db_1.prisma.employeeSkill.update({
            where: { id: ratingId },
            data: {
                status: client_1.SkillRatingStatus.REJECTED,
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
        await logSkillProgress(rating.employee.id, rating.skillId, rating.selfRating, rating.selfRating, client_1.SkillChangeType.MANAGER_REJECTED, managerUserId, comment);
        return updatedRating;
    }
};
exports.reviewSkillRating = reviewSkillRating;
