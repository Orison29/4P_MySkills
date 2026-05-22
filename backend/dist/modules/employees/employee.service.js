"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserByEmployeeId = exports.getMyTeam = exports.getMyProfile = exports.getEmployeeAssignments = exports.assignManager = exports.createEmployeeProfile = void 0;
const db_1 = require("../../utils/db");
const client_1 = require("@prisma/client");
const createEmployeeProfile = async (userId, fullname, departmentId) => {
    const user = await db_1.prisma.user.findUnique({
        where: { id: userId }
    });
    if (!user) {
        throw new Error("User not found");
    }
    const existingProfile = await db_1.prisma.employeeProfile.findUnique({
        where: { userId }
    });
    if (existingProfile) {
        throw new Error("Profile already exists");
    }
    const department = await db_1.prisma.department.findUnique({
        where: { id: departmentId }
    });
    if (!department) {
        throw new Error("Department not found");
    }
    return db_1.prisma.employeeProfile.create({
        data: {
            userId,
            fullname,
            departmentId
        }
    });
};
exports.createEmployeeProfile = createEmployeeProfile;
const assignManager = async (employeeId, managerId) => {
    const employee = await db_1.prisma.employeeProfile.findUnique({
        where: { id: employeeId }
    });
    if (!employee) {
        throw new Error("Employee not found");
    }
    const manager = await db_1.prisma.employeeProfile.findUnique({
        where: { id: managerId }
    });
    if (!manager) {
        throw new Error("Manager not found");
    }
    if (employeeId === managerId) {
        throw new Error("Self assignment is not allowed");
    }
    if (employee.departmentId !== manager.departmentId) {
        throw new Error("Department mismatch");
    }
    return db_1.prisma.employeeProfile.update({
        where: { id: employeeId },
        data: { managerId }
    });
};
exports.assignManager = assignManager;
const getEmployeeAssignments = async (userId) => {
    const profile = await db_1.prisma.employeeProfile.findUnique({
        where: { userId }
    });
    if (!profile) {
        return {
            active: [],
            past: []
        };
    }
    const activeAssignments = await db_1.prisma.employeeProjectAssignment.findMany({
        where: {
            employeeId: profile.id,
            releasedAt: null
        },
        include: {
            project: true,
            deliverable: true
        },
        orderBy: {
            assignedAt: 'desc'
        }
    });
    const pastAssignments = await db_1.prisma.employeeProjectAssignment.findMany({
        where: {
            employeeId: profile.id,
            releasedAt: { not: null }
        },
        include: {
            project: true,
            deliverable: true
        },
        orderBy: {
            releasedAt: 'desc'
        }
    });
    return {
        active: activeAssignments,
        past: pastAssignments
    };
};
exports.getEmployeeAssignments = getEmployeeAssignments;
const getMyProfile = async (userId) => {
    const profile = await db_1.prisma.employeeProfile.findUnique({
        where: { userId },
        select: {
            id: true,
            fullname: true,
            department: { select: { id: true, name: true } },
            manager: {
                select: {
                    id: true,
                    fullname: true,
                    department: { select: { id: true, name: true } },
                    user: { select: { email: true } },
                },
            },
        },
    });
    if (!profile) {
        throw new Error("Employee profile not found");
    }
    return profile;
};
exports.getMyProfile = getMyProfile;
const getMyTeam = async (managerUserId) => {
    const managerProfile = await db_1.prisma.employeeProfile.findUnique({
        where: { userId: managerUserId }
    });
    if (!managerProfile) {
        return [];
    }
    return db_1.prisma.employeeProfile.findMany({
        where: {
            managerId: managerProfile.id
        },
        include: {
            department: true,
            user: {
                select: {
                    email: true
                }
            },
            employeeSkills: {
                include: {
                    skill: true
                }
            }
        },
        orderBy: {
            fullname: 'asc'
        }
    });
};
exports.getMyTeam = getMyTeam;
const deleteUserByEmployeeId = async (employeeId) => {
    const employee = await db_1.prisma.employeeProfile.findUnique({
        where: { id: employeeId },
        select: { id: true, userId: true }
    });
    if (!employee) {
        throw new Error("Employee not found");
    }
    try {
        await db_1.prisma.$transaction(async (tx) => {
            // Unlink direct reports first to avoid self-relation constraint issues.
            await tx.employeeProfile.updateMany({
                where: { managerId: employeeId },
                data: { managerId: null }
            });
            await tx.user.delete({
                where: { id: employee.userId }
            });
        });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
            error.code === "P2003") {
            throw new Error("User cannot be deleted due to linked records");
        }
        throw error;
    }
    return { message: "User deleted successfully" };
};
exports.deleteUserByEmployeeId = deleteUserByEmployeeId;
