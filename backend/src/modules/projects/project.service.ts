import { ProjectStatus } from "@prisma/client";
import { prisma } from "../../utils/db";

export const createProject = async (
	name: string,
	description?: string,
	startDate?: Date,
	endDate?: Date
) => {
	return prisma.project.create({
		data: {
			name,
			description,
			startDate,
			endDate
		}
	});
};

export const getAllProjects = async () => {
	return prisma.project.findMany({
		orderBy: {
			createdAt: "desc"
		}
	});
};

export const updateProjectStatus = async (
	projectId: string,
	status: ProjectStatus
) => {
	const project = await prisma.project.findUnique({
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

	if (status === ProjectStatus.COMPLETED) {
		await prisma.employeeProjectAssignment.updateMany({
			where: {
				projectId,
				releasedAt: null
			},
			data: {
				releasedAt: new Date()
			}
		});
	}

	return prisma.project.update({
		where: { id: projectId },
		data: { status }
	});
};
