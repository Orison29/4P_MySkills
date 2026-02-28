import { Request, Response } from "express";
import { ProjectStatus } from "@prisma/client";
import { createProject, getAllProjects, updateProjectStatus, deleteProject } from "./project.service";
import { analyzeProjectWithLLM } from "../llm/llm.service";

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

export const analyzeProjectHandler = async (req: Request, res: Response) => {
	try {
		const rawId = req.params.id;
		const projectId = Array.isArray(rawId) ? rawId[0] : rawId;

		// Get project details
		const { prisma } = await import("../../utils/db");
		const project = await prisma.project.findUnique({
			where: { id: projectId }
		});

		if (!project) {
			res.status(404).json({ error: "Project not found" });
			return;
		}

		if (!project.description) {
			res.status(400).json({ 
				error: "Project must have a description for AI analysis" 
			});
			return;
		}

		const result = await analyzeProjectWithLLM(
			projectId,
			project.name,
			project.description
		);

		res.status(200).json(result);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Internal server error";

		if (message === "Project not found") {
			res.status(404).json({ error: message });
			return;
		}

		if (message === "No skills available in the system. Please create skills first.") {
			res.status(400).json({ error: message });
			return;
		}

		res.status(500).json({ error: message });
	}
};

export const deleteProjectHandler = async (req: Request, res: Response) => {
	try {
		const rawId = req.params.id;
		const projectId = Array.isArray(rawId) ? rawId[0] : rawId;

		await deleteProject(projectId);
		res.status(200).json({ message: "Project deleted successfully" });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Internal server error";

		if (message === "Project not found") {
			res.status(404).json({ error: message });
			return;
		}

		if (
			message === "Cannot delete project with active assignments. Complete the project first." ||
			message === "Can only delete projects in PLANNED status"
		) {
			res.status(400).json({ error: message });
			return;
		}

		res.status(500).json({ error: "Internal server error" });
	}
};
