import { Request, Response } from "express";
import * as analyticsService from "./analytics.service";

export const getEmployeeSkillProgress = async (req: Request, res: Response) => {
	try {
		const employeeId = req.params.employeeId as string;
		const progress = await analyticsService.getEmployeeSkillProgress(employeeId);
		res.status(200).json(progress);
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};

export const getAllEmployeesOverview = async (req: Request, res: Response) => {
	try {
		const overview = await analyticsService.getAllEmployeesOverview();
		res.status(200).json({ employees: overview });
	} catch (error: any) {
		res.status(500).json({ error: error.message });
	}
};

export const getSkillProgressTimeline = async (req: Request, res: Response) => {
	try {
		const employeeId = req.params.employeeId as string;
		const skillId = req.params.skillId as string;
		const timeline = await analyticsService.getSkillProgressTimeline(
			employeeId,
			skillId
		);
		res.status(200).json(timeline);
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};

export const getDashboardStats = async (req: Request, res: Response) => {
	try {
		const stats = await analyticsService.getDashboardStats();
		res.status(200).json(stats);
	} catch (error: any) {
		res.status(500).json({ error: error.message });
	}
};

export const getLearningSpeed = async (req: Request, res: Response) => {
	try {
		const startDate =
			typeof req.query.startDate === "string" ? req.query.startDate : undefined;
		const endDate =
			typeof req.query.endDate === "string" ? req.query.endDate : undefined;

		if (startDate && isNaN(Date.parse(startDate))) {
			res.status(400).json({ error: "Invalid startDate" });
			return;
		}
		if (endDate && isNaN(Date.parse(endDate))) {
			res.status(400).json({ error: "Invalid endDate" });
			return;
		}

		const data = await analyticsService.getLearningSpeed(startDate, endDate);
		res.status(200).json(data);
	} catch (error: any) {
		res.status(500).json({ error: error?.message || "Internal server error" });
	}
};

export const getSkillSpectrumByDepartment = async (req: Request, res: Response) => {
	try {
		const rawSkillId = req.query.skillId;
		const skillId = Array.isArray(rawSkillId) ? rawSkillId[0] : rawSkillId;

		if (!skillId || typeof skillId !== "string") {
			res.status(400).json({ error: "skillId is required" });
			return;
		}

		const data = await analyticsService.getSkillSpectrumByDepartment(skillId);
		res.status(200).json(data);
	} catch (error: any) {
		if (error?.message === "Skill not found") {
			res.status(404).json({ error: error.message });
			return;
		}

		res.status(500).json({ error: error?.message || "Internal server error" });
	}
};
