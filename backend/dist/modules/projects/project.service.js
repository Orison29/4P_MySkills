"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forceDeleteProject = exports.deleteProject = exports.updateProjectStatus = exports.getProjectById = exports.getAllProjects = exports.createProject = void 0;
const client_1 = require("@prisma/client");
const db_1 = require("../../utils/db");
const createProject = async (name, description, startDate, endDate) => {
    return db_1.prisma.project.create({
        data: {
            name,
            description,
            startDate,
            endDate
        }
    });
};
exports.createProject = createProject;
const getAllProjects = async () => {
    return db_1.prisma.project.findMany({
        orderBy: {
            createdAt: "desc"
        }
    });
};
exports.getAllProjects = getAllProjects;
const getProjectById = async (projectId) => {
    return db_1.prisma.project.findUnique({
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
            },
            assignments: {
                include: {
                    employee: true
                }
            }
        }
    });
};
exports.getProjectById = getProjectById;
const updateProjectStatus = async (projectId, status) => {
    const project = await db_1.prisma.project.findUnique({
        where: { id: projectId }
    });
    if (!project) {
        throw new Error("Project not found");
    }
    const statusOrder = {
        PLANNED: 0,
        ACTIVE: 1,
        COMPLETED: 2
    };
    const currentOrder = statusOrder[project.status];
    const newOrder = statusOrder[status];
    if (newOrder < currentOrder) {
        throw new Error("Invalid status transition");
    }
    if (newOrder - currentOrder > 1) {
        throw new Error("Invalid status transition");
    }
    if (status === client_1.ProjectStatus.COMPLETED) {
        await db_1.prisma.employeeProjectAssignment.updateMany({
            where: {
                projectId,
                releasedAt: null
            },
            data: {
                releasedAt: new Date()
            }
        });
    }
    return db_1.prisma.project.update({
        where: { id: projectId },
        data: { status }
    });
};
exports.updateProjectStatus = updateProjectStatus;
const deleteProject = async (projectId) => {
    const project = await db_1.prisma.project.findUnique({
        where: { id: projectId },
        include: {
            assignments: {
                where: {
                    releasedAt: null // Only check active assignments
                }
            }
        }
    });
    if (!project) {
        throw new Error("Project not found");
    }
    // Don't allow deletion if there are active assignments
    if (project.assignments.length > 0) {
        throw new Error("Cannot delete project with active assignments. Complete the project first.");
    }
    // Only allow deletion of PLANNED projects (not started yet)
    if (project.status !== client_1.ProjectStatus.PLANNED) {
        throw new Error("Can only delete projects in PLANNED status");
    }
    // This will cascade delete: deliverables, deliverable skills, assignment requests, etc.
    return db_1.prisma.project.delete({
        where: { id: projectId }
    });
};
exports.deleteProject = deleteProject;
const forceDeleteProject = async (projectId) => {
    const project = await db_1.prisma.project.findUnique({
        where: { id: projectId }
    });
    if (!project) {
        throw new Error("Project not found");
    }
    await db_1.prisma.$transaction([
        db_1.prisma.assignmentRequest.deleteMany({
            where: { projectId }
        }),
        db_1.prisma.employeeProjectAssignment.deleteMany({
            where: { projectId }
        }),
        db_1.prisma.task.deleteMany({
            where: { projectId }
        }),
        db_1.prisma.deliverable.deleteMany({
            where: { projectId }
        }),
        db_1.prisma.project.delete({
            where: { id: projectId }
        })
    ]);
    return project;
};
exports.forceDeleteProject = forceDeleteProject;
