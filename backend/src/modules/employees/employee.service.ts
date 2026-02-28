import { prisma } from "../../utils/db";

export const createEmployeeProfile = async (
	userId: string,
	fullname: string,
	departmentId: string
) => {
	const user = await prisma.user.findUnique({
		where: { id: userId }
	});

	if (!user) {
		throw new Error("User not found");
	}

	const existingProfile = await prisma.employeeProfile.findUnique({
		where: { userId }
	});

	if (existingProfile) {
		throw new Error("Profile already exists");
	}

	const department = await prisma.department.findUnique({
		where: { id: departmentId }
	});

	if (!department) {
		throw new Error("Department not found");
	}

	return prisma.employeeProfile.create({
		data: {
			userId,
			fullname,
			departmentId
		}
	});
};

export const assignManager = async (employeeId: string, managerId: string) => {
	const employee = await prisma.employeeProfile.findUnique({
		where: { id: employeeId }
	});

	if (!employee) {
		throw new Error("Employee not found");
	}

	const manager = await prisma.employeeProfile.findUnique({
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

	return prisma.employeeProfile.update({
		where: { id: employeeId },
		data: { managerId }
	});
};

export const getEmployeeAssignments = async (userId: string) => {
	const profile = await prisma.employeeProfile.findUnique({
		where: { userId }
	});

	if (!profile) {
		return {
			active: [],
			past: []
		};
	}

	const activeAssignments = await prisma.employeeProjectAssignment.findMany({
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

	const pastAssignments = await prisma.employeeProjectAssignment.findMany({
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

export const getMyTeam = async (managerUserId: string) => {
	const managerProfile = await prisma.employeeProfile.findUnique({
		where: { userId: managerUserId }
	});

	if (!managerProfile) {
		return [];
	}

	return prisma.employeeProfile.findMany({
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
