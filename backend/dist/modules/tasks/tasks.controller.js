"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getManagerTeamTasksHandler = exports.getMyTasksHandler = exports.updateTaskStatusHandler = void 0;
const tasks_service_1 = require("./tasks.service");
const isTaskStatus = (value) => {
    return value === "PENDING" || value === "IN_PROGRESS" || value === "COMPLETED";
};
const updateTaskStatusHandler = async (req, res) => {
    const taskId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const status = typeof req.body?.status === "string" ? req.body.status.toUpperCase() : "";
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    if (!taskId) {
        res.status(400).json({ error: "Missing task id" });
        return;
    }
    if (!isTaskStatus(status)) {
        res.status(400).json({ error: "Invalid status" });
        return;
    }
    try {
        const task = await (0, tasks_service_1.updateTaskStatus)(taskId, req.user.userId, status);
        res.status(200).json(task);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        res.status(400).json({ error: message });
    }
};
exports.updateTaskStatusHandler = updateTaskStatusHandler;
const getMyTasksHandler = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    try {
        const tasks = await (0, tasks_service_1.getMyTasks)(req.user.userId);
        res.status(200).json(tasks);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        res.status(500).json({ error: message });
    }
};
exports.getMyTasksHandler = getMyTasksHandler;
const getManagerTeamTasksHandler = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    try {
        const tasks = await (0, tasks_service_1.getManagerTeamTasks)(req.user.userId);
        res.status(200).json(tasks);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        res.status(500).json({ error: message });
    }
};
exports.getManagerTeamTasksHandler = getManagerTeamTasksHandler;
