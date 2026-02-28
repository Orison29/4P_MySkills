import { prisma } from "../../utils/db";

export const createSkill = async (name: string, description?: string) => {
	return prisma.skill.create({
		data: {
			name,
			description
		}
	});
};

export const listSkills = async () => {
	return prisma.skill.findMany({
		orderBy: {
			createdAt: "desc"
		}
	});
};
