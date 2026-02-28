import { Request, Response } from "express";
import {
	createSelfRating,
	updateSelfRating,
	getMyRatings,
	getPendingRatingsForManager,
	reviewSkillRating
} from "./employee-skill.service";

export const createSelfRatingHandler = async (req: Request, res: Response) => {
	try {
		const { skillId, selfRating } = req.body as {
			skillId: string;
			selfRating: number;
		};
		const userId = req.user!.userId;

		const rating = await createSelfRating(userId, skillId, selfRating);
		res.status(201).json(rating);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Internal server error";

		if (message === "Employee profile not found" || message === "Skill not found") {
			res.status(404).json({ error: message });
			return;
		}

		if (
			message === "Rating must be between 1 and 5" ||
			message === "Skill already rated"
		) {
			res.status(400).json({ error: message });
			return;
		}

		res.status(500).json({ error: "Internal server error" });
	}
};

export const updateSelfRatingHandler = async (req: Request, res: Response) => {
	try {
		const rawId = req.params.id;
		const ratingId = Array.isArray(rawId) ? rawId[0] : rawId;
		const { selfRating } = req.body as { selfRating: number };
		const userId = req.user!.userId;

		const rating = await updateSelfRating(ratingId, userId, selfRating);
		res.status(200).json(rating);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Internal server error";

		if (
			message === "Rating not found" ||
			message === "Employee profile not found"
		) {
			res.status(404).json({ error: message });
			return;
		}

		if (
			message === "Rating must be between 1 and 5" ||
			message === "Cannot update reviewed rating"
		) {
			res.status(400).json({ error: message });
			return;
		}

		if (message === "Unauthorized") {
			res.status(403).json({ error: message });
			return;
		}

		res.status(500).json({ error: "Internal server error" });
	}
};

export const getMyRatingsHandler = async (req: Request, res: Response) => {
	try {
		const userId = req.user!.userId;
		const ratings = await getMyRatings(userId);
		res.status(200).json(ratings);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Internal server error";

		if (message === "Employee profile not found") {
			res.status(404).json({ error: message });
			return;
		}

		res.status(500).json({ error: "Internal server error" });
	}
};

export const getPendingRatingsHandler = async (
	req: Request,
	res: Response
) => {
	try {
		const managerUserId = req.user!.userId;
		const ratings = await getPendingRatingsForManager(managerUserId);
		console.log("MANAGER RATINGS RAW: ", JSON.stringify(ratings, null, 2));
		res.status(200).json(ratings);
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

export const reviewSkillRatingHandler = async (
	req: Request,
	res: Response
) => {
	try {
		const rawId = req.params.id;
		const ratingId = Array.isArray(rawId) ? rawId[0] : rawId;
		const { action, approvedRating, comment } = req.body as {
			action: "APPROVE" | "EDIT" | "REJECT";
			approvedRating?: number;
			comment?: string;
		};
		const managerUserId = req.user!.userId;

		const rating = await reviewSkillRating(
			ratingId,
			managerUserId,
			action,
			approvedRating,
			comment
		);
		res.status(200).json(rating);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Internal server error";

		if (
			message === "Rating not found" ||
			message === "Manager profile not found"
		) {
			res.status(404).json({ error: message });
			return;
		}

		if (
			message === "Rating is not pending" ||
			message === "Valid approved rating (1-5) required for edit action"
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
