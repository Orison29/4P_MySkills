import { AssignmentRequestStatus, ProjectStatus } from "@prisma/client";
import { prisma } from "../../utils/db";

export const createAssignmentRequest = async (
	deliverableId: string,
	employeeId: string,
	requestedByUserId: string
) => {
	// Verify deliverable exists and get associated project
	const deliverable = await prisma.deliverable.findUnique({
		where: { id: deliverableId },
		include: {
			project: true
		}
	});

	if (!deliverable) {
		throw new Error("Deliverable not found");
	}

	if (deliverable.project.status !== ProjectStatus.ACTIVE) {
		throw new Error("Project is not active");
	}

	const employee = await prisma.employeeProfile.findUnique({
		where: { id: employeeId }
	});

	if (!employee) {
		throw new Error("Employee not found");
	}

	const activeAssignment = await prisma.employeeProjectAssignment.findFirst({
		where: {
			employeeId,
			releasedAt: null
		}
	});

	if (activeAssignment) {
		throw new Error("Employee already has active assignment");
	}

	const pendingRequest = await prisma.assignmentRequest.findFirst({
		where: {
			employeeId,
			deliverableId,
			status: AssignmentRequestStatus.PENDING
		}
	});

	if (pendingRequest) {
		throw new Error("Pending request already exists");
	}

	return prisma.assignmentRequest.create({
		data: {
			projectId: deliverable.projectId,
			deliverableId,
			employeeId,
			requestedBy: requestedByUserId
		}
	});
};

export const getPendingRequestsForManager = async (managerUserId: string) => {
	const managerProfile = await prisma.employeeProfile.findUnique({
		where: { userId: managerUserId }
	});

	if (!managerProfile) {
		throw new Error("Manager profile not found");
	}

	return prisma.assignmentRequest.findMany({
		where: {
			employee: {
				managerId: managerProfile.id
			},
			status: AssignmentRequestStatus.PENDING
		},
		include: {
			employee: true,
			project: true
		}
	});
};

export const reviewAssignmentRequest = async (
	requestId: string,
	managerUserId: string,
	action: "APPROVE" | "REJECT"
) => {
	const request = await prisma.assignmentRequest.findUnique({
		where: { id: requestId },
		include: {
			employee: true,
			project: true
		}
	});

	if (!request) {
		throw new Error("Request not found");
	}

	if (request.status !== AssignmentRequestStatus.PENDING) {
		throw new Error("Request is not pending");
	}

	const managerProfile = await prisma.employeeProfile.findUnique({
		where: { userId: managerUserId }
	});

	if (!managerProfile) {
		throw new Error("Manager profile not found");
	}

	if (request.employee.managerId !== managerProfile.id) {
		throw new Error("Manager mismatch");
	}

	if (action === "APPROVE") {
		if (request.project.status !== ProjectStatus.ACTIVE) {
			throw new Error("Project is not active");
		}

		const activeAssignment = await prisma.employeeProjectAssignment.findFirst({
			where: {
				employeeId: request.employeeId,
				releasedAt: null
			}
		});

		if (activeAssignment) {
			throw new Error("Employee already has active assignment");
		}

		await prisma.employeeProjectAssignment.create({
			data: {
				employeeId: request.employeeId,
				projectId: request.projectId,
				deliverableId: request.deliverableId
			}
		});

		return prisma.assignmentRequest.update({
			where: { id: requestId },
			data: {
				status: AssignmentRequestStatus.APPROVED,
				reviewedBy: managerUserId,
				reviewedAt: new Date()
			}
		});
	} else {
		return prisma.assignmentRequest.update({
			where: { id: requestId },
			data: {
				status: AssignmentRequestStatus.REJECTED,
				reviewedBy: managerUserId,
				reviewedAt: new Date()
			}
		});
	}
};
