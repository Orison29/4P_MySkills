import { Request, Response } from "express";
import { Role } from "@prisma/client";
import { assignManager, createEmployeeProfile, getEmployeeAssignments, getMyTeam } from "./employee.service";

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

export const getMyAssignmentsHandler = async (req: Request, res: Response) => {
	try {
		const userId = req.user!.userId;
		const assignments = await getEmployeeAssignments(userId);
		res.status(200).json(assignments);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Internal server error";

		if (message === "Employee profile not found") {
			res.status(404).json({ error: message });
			return;
		}

		res.status(500).json({ error: "Internal server error" });
	}
};

export const changeRoleHandler = async (req: Request, res: Response) => {
	try {
		const rawId = req.params.id;
		const employeeId = Array.isArray(rawId) ? rawId[0] : rawId;
		const { role } = req.body as { role: Role };

		// Get the user ID from the employee profile
		const { prisma } = await import("../../utils/db");
		const employee = await prisma.employeeProfile.findUnique({
			where: { id: employeeId },
			select: { userId: true }
		});

		if (!employee) {
			res.status(404).json({ error: "Employee not found" });
			return;
		}

		const updatedUser = await prisma.user.update({
			where: { id: employee.userId },
			data: { role }
		});

		res.status(200).json({ message: "Role updated successfully", role: updatedUser.role });
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getMyTeamHandler = async (req: Request, res: Response) => {
	try {
		const managerUserId = req.user!.userId;
		const team = await getMyTeam(managerUserId);
		res.status(200).json(team);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Internal server error";
		res.status(500).json({ error: "Internal server error" });
	}
};
