"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDeliverableHandler = exports.updateDeliverableHandler = exports.getDeliverableDetailsHandler = exports.getProjectDeliverablesHandler = exports.createDeliverableHandler = void 0;
const deliverable_service_1 = require("./deliverable.service");
/**
 * Create a new deliverable (will be used by LLM integration)
 * POST /api/projects/:projectId/deliverables
 * Body: { name: string, description?: string }
 */
const createDeliverableHandler = async (req, res) => {
    try {
        const rawId = req.params.projectId;
        const projectId = Array.isArray(rawId) ? rawId[0] : rawId;
        const { name, description } = req.body;
        if (!name) {
            res.status(400).json({ error: "name is required" });
            return;
        }
        const deliverable = await (0, deliverable_service_1.createDeliverable)(projectId, name, description);
        res.status(201).json(deliverable);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
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
exports.createDeliverableHandler = createDeliverableHandler;
/**
 * Get all deliverables for a project
 * GET /api/projects/:projectId/deliverables
 */
const getProjectDeliverablesHandler = async (req, res) => {
    try {
        const rawId = req.params.projectId;
        const projectId = Array.isArray(rawId) ? rawId[0] : rawId;
        const deliverables = await (0, deliverable_service_1.getProjectDeliverables)(projectId);
        res.status(200).json(deliverables);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        if (message === "Project not found") {
            res.status(404).json({ error: message });
            return;
        }
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getProjectDeliverablesHandler = getProjectDeliverablesHandler;
/**
 * Get detailed info about a specific deliverable
 * GET /api/deliverables/:id
 */
const getDeliverableDetailsHandler = async (req, res) => {
    try {
        const rawId = req.params.id;
        const deliverableId = Array.isArray(rawId) ? rawId[0] : rawId;
        const deliverable = await (0, deliverable_service_1.getDeliverableDetails)(deliverableId);
        res.status(200).json(deliverable);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        if (message === "Deliverable not found") {
            res.status(404).json({ error: message });
            return;
        }
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getDeliverableDetailsHandler = getDeliverableDetailsHandler;
/**
 * Update deliverable details (HR can edit what LLM created)
 * PATCH /api/deliverables/:id
 * Body: { name?: string, description?: string }
 */
const updateDeliverableHandler = async (req, res) => {
    try {
        const rawId = req.params.id;
        const deliverableId = Array.isArray(rawId) ? rawId[0] : rawId;
        const { name, description } = req.body;
        const deliverable = await (0, deliverable_service_1.updateDeliverable)(deliverableId, name, description);
        res.status(200).json(deliverable);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
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
exports.updateDeliverableHandler = updateDeliverableHandler;
/**
 * Delete a deliverable (HR can remove if LLM got it wrong)
 * DELETE /api/deliverables/:id
 */
const deleteDeliverableHandler = async (req, res) => {
    try {
        const rawId = req.params.id;
        const deliverableId = Array.isArray(rawId) ? rawId[0] : rawId;
        const result = await (0, deliverable_service_1.deleteDeliverable)(deliverableId);
        res.status(200).json(result);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
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
exports.deleteDeliverableHandler = deleteDeliverableHandler;
