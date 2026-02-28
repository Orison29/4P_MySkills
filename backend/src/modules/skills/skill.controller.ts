import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { createSkill, listSkills } from "./skill.service";

export const createSkillHandler = async (req: Request, res: Response) => {
	try {
		const { name, description } = req.body as {
			name: string;
			description?: string;
		};

		const skill = await createSkill(name, description);
		res.status(201).json(skill);
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === "P2002") {
				res.status(409).json({ error: "Skill already exists" });
				return;
			}
		}

		res.status(500).json({ error: "Internal server error" });
	}
};

export const listSkillsHandler = async (req: Request, res: Response) => {
	try {
		const skills = await listSkills();
		res.status(200).json(skills);
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
	}
};
