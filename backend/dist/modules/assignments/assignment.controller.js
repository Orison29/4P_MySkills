"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewAssignmentRequestHandler = exports.getPendingRequestsHandler = exports.createAssignmentRequestHandler = void 0;
const assignment_service_1 = require("./assignment.service");
const createAssignmentRequestHandler = async (req, res) => {
    try {
        const rawId = req.params.id;
        const deliverableId = Array.isArray(rawId) ? rawId[0] : rawId;
        const { employeeId } = req.body;
        const requestedByUserId = req.user.userId;
        const request = await (0, assignment_service_1.createAssignmentRequest)(deliverableId, employeeId, requestedByUserId);
        res.status(201).json(request);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        if (message === "Deliverable not found" || message === "Employee not found") {
            res.status(404).json({ error: message });
            return;
        }
        if (message === "Project is not active" ||
            message === "Employee already has active assignment" ||
            message === "Pending request already exists") {
            res.status(400).json({ error: message });
            return;
        }
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.createAssignmentRequestHandler = createAssignmentRequestHandler;
const getPendingRequestsHandler = async (req, res) => {
    try {
        const managerUserId = req.user.userId;
        const requests = await (0, assignment_service_1.getPendingRequestsForManager)(managerUserId);
        res.status(200).json(requests);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        if (message === "Manager profile not found") {
            res.status(404).json({ error: message });
            return;
        }
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getPendingRequestsHandler = getPendingRequestsHandler;
const reviewAssignmentRequestHandler = async (req, res) => {
    try {
        const rawId = req.params.id;
        const requestId = Array.isArray(rawId) ? rawId[0] : rawId;
        const { action } = req.body;
        const managerUserId = req.user.userId;
        const request = await (0, assignment_service_1.reviewAssignmentRequest)(requestId, managerUserId, action);
        res.status(200).json(request);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        if (message === "Request not found" ||
            message === "Manager profile not found") {
            res.status(404).json({ error: message });
            return;
        }
        if (message === "Request is not pending" ||
            message === "Project is not active" ||
            message === "Employee already has active assignment") {
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
exports.reviewAssignmentRequestHandler = reviewAssignmentRequestHandler;
