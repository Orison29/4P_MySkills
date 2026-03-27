import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { createDepartment, deleteDepartment, listDepartments } from "./department.service";

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

export const deleteDepartmentHandler = async (req: Request, res: Response) => {
	try {
		const rawId = req.params.id;
		const departmentId = Array.isArray(rawId) ? rawId[0] : rawId;

		const result = await deleteDepartment(departmentId);
		res.status(200).json(result);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Internal server error";

		if (message === "Department not found") {
			res.status(404).json({ error: message });
			return;
		}

		if (message === "Department has employees and cannot be deleted") {
			res.status(409).json({ error: message });
			return;
		}

		res.status(500).json({ error: "Internal server error" });
	}
};
