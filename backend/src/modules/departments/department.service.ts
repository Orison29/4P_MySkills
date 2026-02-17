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
