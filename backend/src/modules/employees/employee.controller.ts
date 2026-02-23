import { Request, Response } from "express";
import { assignManager, createEmployeeProfile } from "./employee.service";

export const createEmployeeHandler = async (req: Request, res: Response) => {
	try {
		const { userId, fullname, departmentId } = req.body as {
			userId: string;
			fullname: string;
			departmentId: string;
		};

		const employee = await createEmployeeProfile(userId, fullname, departmentId);
		res.status(201).json(employee);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Internal server error";

		if (message === "User not found" || message === "Department not found") {
			res.status(404).json({ error: message });
			return;
		}

		if (message === "Profile already exists") {
			res.status(409).json({ error: message });
			return;
		}

		res.status(500).json({ error: "Internal server error" });
	}
};

export const assignManagerHandler = async (req: Request, res: Response) => {
	try {
		const rawId = req.params.id;
		const employeeId = Array.isArray(rawId) ? rawId[0] : rawId;
		const { managerId } = req.body as { managerId: string };

		const employee = await assignManager(employeeId, managerId);
		res.status(200).json(employee);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Internal server error";

		if (message === "Employee not found" || message === "Manager not found") {
			res.status(404).json({ error: message });
			return;
		}

		if (
			message === "Self assignment is not allowed" ||
			message === "Department mismatch"
		) {
			res.status(400).json({ error: message });
			return;
		}

		res.status(500).json({ error: "Internal server error" });
	}
};
