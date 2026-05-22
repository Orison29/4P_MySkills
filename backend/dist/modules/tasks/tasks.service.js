"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getManagerTeamTasks = exports.getMyTasks = exports.updateTaskStatus = void 0;
const db_1 = require("../../utils/db");
const updateTaskStatus = async (taskId, userId, status) => {
    const employee = await db_1.prisma.employeeProfile.findUnique({
        where: { userId },
        select: { id: true },
    });
    if (!employee) {
        throw new Error("Employee profile not found");
    }
    const task = await db_1.prisma.task.findUnique({
        where: { id: taskId },
        select: { id: true, employeeId: true },
    });
    if (!task) {
        throw new Error("Task not found");
    }
    if (task.employeeId !== employee.id) {
        throw new Error("Unauthorized");
    }
    return db_1.prisma.task.update({
        where: { id: taskId },
        data: { status },
    });
};
exports.updateTaskStatus = updateTaskStatus;
const getMyTasks = async (userId) => {
    const employee = await db_1.prisma.employeeProfile.findUnique({
        where: { userId },
        select: { id: true },
    });
    if (!employee) {
        return [];
    }
    return db_1.prisma.task.findMany({
        where: { employeeId: employee.id },
        include: {
            project: { select: { id: true, name: true } },
            deliverable: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
    });
};
exports.getMyTasks = getMyTasks;
const getManagerTeamTasks = async (userId) => {
    const manager = await db_1.prisma.employeeProfile.findUnique({
        where: { userId },
        select: { id: true },
    });
    if (!manager) {
        return [];
    }
    return db_1.prisma.task.findMany({
        where: { employee: { managerId: manager.id } },
        include: {
            employee: {
                select: {
                    id: true,
                    fullname: true,
                    user: { select: { email: true } },
                },
            },
            project: { select: { id: true, name: true } },
            deliverable: { select: { id: true, name: true } },
        },
        orderBy: [{ employeeId: "asc" }, { createdAt: "desc" }],
    });
};
exports.getManagerTeamTasks = getManagerTeamTasks;
