import { Request, Response } from "express";
import {
	getRecommendedEmployees,
	getEmployeeSkillAnalysis,
	getProjectRecommendations
} from "./recommendation.service";

/**
 * Get recommended employees for a deliverable
 * GET /api/deliverables/:deliverableId/recommendations?topK=5
 */
export const getRecommendedEmployeesHandler = async (
	req: Request,
	res: Response
) => {
	try {
		const rawId = req.params.deliverableId;
		const deliverableId = Array.isArray(rawId) ? rawId[0] : rawId;
		
		// Parse topK from query params (default: 5)
		const topKParam = req.query.topK as string | undefined;
		const topK = topKParam ? parseInt(topKParam, 10) : 5;

		if (isNaN(topK) || topK < 1 || topK > 1000) {
			res.status(400).json({ error: "topK must be between 1 and 1000" });
			return;
		}

		const recommendations = await getRecommendedEmployees(deliverableId, topK);

		res.status(200).json({
			deliverableId,
			topK,
			topEmployees: recommendations
		});
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Internal server error";

		if (message === "Deliverable not found") {
			res.status(404).json({ error: message });
			return;
		}

		if (message === "Deliverable has no required skills defined") {
			res.status(400).json({ 
				error: message,
				hint: "Add required skills to this deliverable first using POST /api/deliverables/:id/skills"
			});
			return;
		}

		res.status(500).json({ error: "Internal server error" });
	}
};

/**
 * Get detailed skill analysis for a specific employee for a deliverable
 * GET /api/deliverables/:deliverableId/employees/:employeeId/analysis
 */
export const getEmployeeSkillAnalysisHandler = async (
	req: Request,
	res: Response
) => {
	try {
		const rawDeliverableId = req.params.deliverableId;
		const deliverableId = Array.isArray(rawDeliverableId)
			? rawDeliverableId[0]
			: rawDeliverableId;

		const rawEmployeeId = req.params.employeeId;
		const employeeId = Array.isArray(rawEmployeeId)
			? rawEmployeeId[0]
			: rawEmployeeId;

		const analysis = await getEmployeeSkillAnalysis(deliverableId, employeeId);

		res.status(200).json(analysis);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Internal server error";

		if (
			message === "Deliverable not found" ||
			message === "Employee not found"
		) {
			res.status(404).json({ error: message });
			return;
		}

		res.status(500).json({ error: "Internal server error" });
	}
};

/**
 * Get recommendations for ALL deliverables in a project
 * GET /api/projects/:projectId/recommendations?topK=5
 */
export const getProjectRecommendationsHandler = async (
	req: Request,
	res: Response
) => {
	try {
		const rawId = req.params.projectId;
		const projectId = Array.isArray(rawId) ? rawId[0] : rawId;
		
		// Parse topK from query params (default: 5)
		const topKParam = req.query.topK as string | undefined;
		const topK = topKParam ? parseInt(topKParam, 10) : 5;

		if (isNaN(topK) || topK < 1 || topK > 1000) {
			res.status(400).json({ error: "topK must be between 1 and 1000" });
			return;
		}

		const recommendations = await getProjectRecommendations(projectId, topK);

		res.status(200).json(recommendations);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Internal server error";

		if (message === "Project not found") {
			res.status(404).json({ error: message });
			return;
		}

		if (message === "Project has no deliverables. Run AI analysis first.") {
			res.status(400).json({ 
				error: message,
				hint: "Use POST /api/projects/:id/analyze to generate deliverables first"
			});
			return;
		}

		res.status(500).json({ error: "Internal server error" });
	}
};
