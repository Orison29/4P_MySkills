import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { createDepartment, listDepartments } from "./department.service";

export const createDepartmentHandler = async (req: Request, res: Response) => {
	try {
		const { name } = req.body as { name: string };

		const department = await createDepartment(name);
		res.status(201).json(department);
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === "P2002") {
				res.status(409).json({ error: "Department already exists" });
				return;
			}
		}

		res.status(500).json({ error: "Internal server error" });
	}
};

export const listDepartmentsHandler = async (req: Request, res: Response) => {
	try {
		const departments = await listDepartments();
		res.status(200).json(departments);
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
	}
};
