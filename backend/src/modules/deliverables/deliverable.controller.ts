import { Request, Response } from "express";
import {
	createDeliverable,
	getProjectDeliverables,
	getDeliverableDetails,
	updateDeliverable,
	deleteDeliverable
} from "./deliverable.service";

/**
 * Create a new deliverable (will be used by LLM integration)
 * POST /api/projects/:projectId/deliverables
 * Body: { name: string, description?: string }
 */
export const createDeliverableHandler = async (
	req: Request,
	res: Response
) => {
	try {
		const rawId = req.params.projectId;
		const projectId = Array.isArray(rawId) ? rawId[0] : rawId;
		const { name, description } = req.body as {
			name: string;
			description?: string;
		};

		if (!name) {
			res.status(400).json({ error: "name is required" });
			return;
		}

		const deliverable = await createDeliverable(projectId, name, description);
		res.status(201).json(deliverable);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Internal server error";

		if (message === "Project not found") {
			res.status(404).json({ error: message });
			return;
		}

		if (message === "Deliverable with this name already exists in the project") {
			res.status(400).json({ error: message });
			return;
		}

		res.status(500).json({ error: "Internal server error" });
	}
};

/**
 * Get all deliverables for a project
 * GET /api/projects/:projectId/deliverables
 */
export const getProjectDeliverablesHandler = async (
	req: Request,
	res: Response
) => {
	try {
		const rawId = req.params.projectId;
		const projectId = Array.isArray(rawId) ? rawId[0] : rawId;

		const deliverables = await getProjectDeliverables(projectId);
		res.status(200).json(deliverables);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Internal server error";

		if (message === "Project not found") {
			res.status(404).json({ error: message });
			return;
		}

		res.status(500).json({ error: "Internal server error" });
	}
};

/**
 * Get detailed info about a specific deliverable
 * GET /api/deliverables/:id
 */
export const getDeliverableDetailsHandler = async (
	req: Request,
	res: Response
) => {
	try {
		const rawId = req.params.id;
		const deliverableId = Array.isArray(rawId) ? rawId[0] : rawId;

		const deliverable = await getDeliverableDetails(deliverableId);
		res.status(200).json(deliverable);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Internal server error";

		if (message === "Deliverable not found") {
			res.status(404).json({ error: message });
			return;
		}

		res.status(500).json({ error: "Internal server error" });
	}
};

/**
 * Update deliverable details (HR can edit what LLM created)
 * PATCH /api/deliverables/:id
 * Body: { name?: string, description?: string }
 */
export const updateDeliverableHandler = async (
	req: Request,
	res: Response
) => {
	try {
		const rawId = req.params.id;
		const deliverableId = Array.isArray(rawId) ? rawId[0] : rawId;
		const { name, description } = req.body as {
			name?: string;
			description?: string;
		};

		const deliverable = await updateDeliverable(
			deliverableId,
			name,
			description
		);
		res.status(200).json(deliverable);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Internal server error";

		if (message === "Deliverable not found") {
			res.status(404).json({ error: message });
			return;
		}

		if (message === "Deliverable with this name already exists in the project") {
			res.status(400).json({ error: message });
			return;
		}

		res.status(500).json({ error: "Internal server error" });
	}
};

/**
 * Delete a deliverable (HR can remove if LLM got it wrong)
 * DELETE /api/deliverables/:id
 */
export const deleteDeliverableHandler = async (
	req: Request,
	res: Response
) => {
	try {
		const rawId = req.params.id;
		const deliverableId = Array.isArray(rawId) ? rawId[0] : rawId;

		const result = await deleteDeliverable(deliverableId);
		res.status(200).json(result);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Internal server error";

		if (message === "Deliverable not found") {
			res.status(404).json({ error: message });
			return;
		}

		if (message === "Cannot delete deliverable with active assignments") {
			res.status(400).json({ error: message });
			return;
		}

		res.status(500).json({ error: "Internal server error" });
	}
};
