"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewAssignmentRequest = exports.getPendingRequestsForManager = exports.createAssignmentRequest = void 0;
const client_1 = require("@prisma/client");
const db_1 = require("../../utils/db");
const createAssignmentRequest = async (deliverableId, employeeId, requestedByUserId) => {
    // Verify deliverable exists and get associated project
    const deliverable = await db_1.prisma.deliverable.findUnique({
        where: { id: deliverableId },
        include: {
            project: true
        }
    });
    if (!deliverable) {
        throw new Error("Deliverable not found");
    }
    if (deliverable.project.status !== client_1.ProjectStatus.ACTIVE) {
        throw new Error("Project is not active");
    }
    const employee = await db_1.prisma.employeeProfile.findUnique({
        where: { id: employeeId }
    });
    if (!employee) {
        throw new Error("Employee not found");
    }
    const activeAssignment = await db_1.prisma.employeeProjectAssignment.findFirst({
        where: {
            employeeId,
            releasedAt: null
        }
    });
    if (activeAssignment) {
        throw new Error("Employee already has active assignment");
    }
    const pendingRequest = await db_1.prisma.assignmentRequest.findFirst({
        where: {
            employeeId,
            deliverableId,
            status: client_1.AssignmentRequestStatus.PENDING
        }
    });
    if (pendingRequest) {
        throw new Error("Pending request already exists");
    }
    return db_1.prisma.assignmentRequest.create({
        data: {
            projectId: deliverable.projectId,
            deliverableId,
            employeeId,
            requestedBy: requestedByUserId
        }
    });
};
exports.createAssignmentRequest = createAssignmentRequest;
const getPendingRequestsForManager = async (managerUserId) => {
    const managerProfile = await db_1.prisma.employeeProfile.findUnique({
        where: { userId: managerUserId }
    });
    if (!managerProfile) {
        return [];
    }
    return db_1.prisma.assignmentRequest.findMany({
        where: {
            employee: {
                managerId: managerProfile.id
            },
            status: client_1.AssignmentRequestStatus.PENDING
        },
        include: {
            employee: true,
            project: true
        }
    });
};
exports.getPendingRequestsForManager = getPendingRequestsForManager;
const reviewAssignmentRequest = async (requestId, managerUserId, action) => {
    const request = await db_1.prisma.assignmentRequest.findUnique({
        where: { id: requestId },
        include: {
            employee: true,
            project: true
        }
    });
    if (!request) {
        throw new Error("Request not found");
    }
    if (request.status !== client_1.AssignmentRequestStatus.PENDING) {
        throw new Error("Request is not pending");
    }
    const managerProfile = await db_1.prisma.employeeProfile.findUnique({
        where: { userId: managerUserId }
    });
    if (!managerProfile) {
        throw new Error("Manager profile not found");
    }
    if (request.employee.managerId !== managerProfile.id) {
        throw new Error("Manager mismatch");
    }
    if (action === "APPROVE") {
        if (request.project.status !== client_1.ProjectStatus.ACTIVE) {
            throw new Error("Project is not active");
        }
        const activeAssignment = await db_1.prisma.employeeProjectAssignment.findFirst({
            where: {
                employeeId: request.employeeId,
                releasedAt: null
            }
        });
        if (activeAssignment) {
            throw new Error("Employee already has active assignment");
        }
        await db_1.prisma.employeeProjectAssignment.create({
            data: {
                employeeId: request.employeeId,
                projectId: request.projectId,
                deliverableId: request.deliverableId
            }
        });
        await db_1.prisma.task.updateMany({
            where: {
                deliverableId: request.deliverableId,
                employeeId: null
            },
            data: {
                employeeId: request.employeeId
            }
        });
        return db_1.prisma.assignmentRequest.update({
            where: { id: requestId },
            data: {
                status: client_1.AssignmentRequestStatus.APPROVED,
                reviewedBy: managerUserId,
                reviewedAt: new Date()
            }
        });
    }
    else {
        return db_1.prisma.assignmentRequest.update({
            where: { id: requestId },
            data: {
                status: client_1.AssignmentRequestStatus.REJECTED,
                reviewedBy: managerUserId,
                reviewedAt: new Date()
            }
        });
    }
};
exports.reviewAssignmentRequest = reviewAssignmentRequest;
