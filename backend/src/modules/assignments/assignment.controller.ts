import { Request, Response } from "express";
import {
	createAssignmentRequest,
	getPendingRequestsForManager,
	reviewAssignmentRequest
} from "./assignment.service";

export const createAssignmentRequestHandler = async (
	req: Request,
	res: Response
) => {
	try {
		const rawId = req.params.id;
		const projectId = Array.isArray(rawId) ? rawId[0] : rawId;
		const { employeeId } = req.body as { employeeId: string };
		const requestedByUserId = req.user!.userId;

		const request = await createAssignmentRequest(
			projectId,
			employeeId,
			requestedByUserId
		);

		res.status(201).json(request);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Internal server error";

		if (message === "Project not found" || message === "Employee not found") {
			res.status(404).json({ error: message });
			return;
		}

		if (
			message === "Project is not active" ||
			message === "Employee already has active assignment" ||
			message === "Pending request already exists"
		) {
			res.status(400).json({ error: message });
			return;
		}

		res.status(500).json({ error: "Internal server error" });
	}
};

export const getPendingRequestsHandler = async (
	req: Request,
	res: Response
) => {
	try {
		const managerUserId = req.user!.userId;

		const requests = await getPendingRequestsForManager(managerUserId);
		res.status(200).json(requests);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Internal server error";

		if (message === "Manager profile not found") {
			res.status(404).json({ error: message });
			return;
		}

		res.status(500).json({ error: "Internal server error" });
	}
};

export const reviewAssignmentRequestHandler = async (
	req: Request,
	res: Response
) => {
	try {
		const rawId = req.params.id;
		const requestId = Array.isArray(rawId) ? rawId[0] : rawId;
		const { action } = req.body as { action: "APPROVE" | "REJECT" };
		const managerUserId = req.user!.userId;

		const request = await reviewAssignmentRequest(
			requestId,
			managerUserId,
			action
		);

		res.status(200).json(request);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Internal server error";

		if (
			message === "Request not found" ||
			message === "Manager profile not found"
		) {
			res.status(404).json({ error: message });
			return;
		}

		if (
			message === "Request is not pending" ||
			message === "Project is not active" ||
			message === "Employee already has active assignment"
		) {
			res.status(400).json({ error: message });
			return;
		}

		if (message === "Manager mismatch") {
			res.status(403).json({ error: message });
			return;
		}

		res.status(500).json({ error: "Internal server error" });
	}
};
