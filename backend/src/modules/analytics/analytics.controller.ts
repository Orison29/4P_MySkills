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
