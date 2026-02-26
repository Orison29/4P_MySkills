import { Request, Response } from "express";
import { ProjectStatus } from "@prisma/client";
import { createProject, getAllProjects, updateProjectStatus } from "./project.service";

export const createProjectHandler = async (req: Request, res: Response) => {
	try {
		const { name, description, startDate, endDate } = req.body as {
			name: string;
			description?: string;
			startDate?: string;
			endDate?: string;
		};

		const project = await createProject(
			name,
			description,
			startDate ? new Date(startDate) : undefined,
			endDate ? new Date(endDate) : undefined
		);

		res.status(201).json(project);
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getProjectsHandler = async (req: Request, res: Response) => {
	try {
		const projects = await getAllProjects();
		res.status(200).json(projects);
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
	}
};

export const updateProjectStatusHandler = async (req: Request, res: Response) => {
	try {
		const rawId = req.params.id;
		const projectId = Array.isArray(rawId) ? rawId[0] : rawId;
		const { status } = req.body as { status: ProjectStatus };

		const project = await updateProjectStatus(projectId, status);
		res.status(200).json(project);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Internal server error";

		if (message === "Project not found") {
			res.status(404).json({ error: message });
			return;
		}

		if (message === "Invalid status transition") {
			res.status(400).json({ error: message });
			return;
		}

		res.status(500).json({ error: "Internal server error" });
	}
};
