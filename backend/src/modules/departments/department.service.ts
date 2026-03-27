import { prisma } from "../../utils/db";

export const createDepartment = async (name: string) => {
	return prisma.department.create({
		data: {
			name
		}
	});
};

export const listDepartments = async () => {
	return prisma.department.findMany({
		orderBy: {
			createdAt: "desc"
		}
	});
};

export const deleteDepartment = async (departmentId: string) => {
	const department = await prisma.department.findUnique({
		where: { id: departmentId },
		select: { id: true }
	});

	if (!department) {
		throw new Error("Department not found");
	}

	const employeeCount = await prisma.employeeProfile.count({
		where: { departmentId }
	});

	if (employeeCount > 0) {
		throw new Error("Department has employees and cannot be deleted");
	}

	await prisma.department.delete({
		where: { id: departmentId }
	});

	return { message: "Department deleted successfully" };
};
