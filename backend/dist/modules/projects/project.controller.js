"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.forceDeleteProjectHandler = exports.deleteProjectHandler = exports.analyzeProjectHandler = exports.updateProjectStatusHandler = exports.getProjectHandler = exports.getProjectsHandler = exports.createProjectHandler = void 0;
const project_service_1 = require("./project.service");
const llm_service_1 = require("../llm/llm.service");
const createProjectHandler = async (req, res) => {
    try {
        const { name, description, startDate, endDate } = req.body;
        const project = await (0, project_service_1.createProject)(name, description, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
        res.status(201).json(project);
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.createProjectHandler = createProjectHandler;
const getProjectsHandler = async (req, res) => {
    try {
        const projects = await (0, project_service_1.getAllProjects)();
        res.status(200).json(projects);
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getProjectsHandler = getProjectsHandler;
const getProjectHandler = async (req, res) => {
    try {
        const rawId = req.params.id;
        const projectId = Array.isArray(rawId) ? rawId[0] : rawId;
        const project = await (0, project_service_1.getProjectById)(projectId);
        if (!project) {
            res.status(404).json({ error: "Project not found" });
            return;
        }
        res.status(200).json(project);
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getProjectHandler = getProjectHandler;
const updateProjectStatusHandler = async (req, res) => {
    try {
        const rawId = req.params.id;
        const projectId = Array.isArray(rawId) ? rawId[0] : rawId;
        const { status } = req.body;
        const project = await (0, project_service_1.updateProjectStatus)(projectId, status);
        res.status(200).json(project);
    }
    catch (error) {
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
exports.updateProjectStatusHandler = updateProjectStatusHandler;
const analyzeProjectHandler = async (req, res) => {
    try {
        const rawId = req.params.id;
        const projectId = Array.isArray(rawId) ? rawId[0] : rawId;
        // Get project details
        const { prisma } = await Promise.resolve().then(() => __importStar(require("../../utils/db")));
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
        const userPrompt = typeof req.body?.userPrompt === "string" ? req.body.userPrompt : undefined;
        const result = await (0, llm_service_1.analyzeProjectWithLLM)(projectId, project.name, project.description, userPrompt);
        res.status(200).json(result);
    }
    catch (error) {
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
exports.analyzeProjectHandler = analyzeProjectHandler;
const deleteProjectHandler = async (req, res) => {
    try {
        const rawId = req.params.id;
        const projectId = Array.isArray(rawId) ? rawId[0] : rawId;
        await (0, project_service_1.deleteProject)(projectId);
        res.status(200).json({ message: "Project deleted successfully" });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        if (message === "Project not found") {
            res.status(404).json({ error: message });
            return;
        }
        if (message === "Cannot delete project with active assignments. Complete the project first." ||
            message === "Can only delete projects in PLANNED status") {
            res.status(400).json({ error: message });
            return;
        }
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.deleteProjectHandler = deleteProjectHandler;
const forceDeleteProjectHandler = async (req, res) => {
    try {
        const rawId = req.params.id;
        const projectId = Array.isArray(rawId) ? rawId[0] : rawId;
        const deletedProject = await (0, project_service_1.forceDeleteProject)(projectId);
        res.status(200).json({
            message: "Project force deleted successfully",
            project: deletedProject
        });
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
exports.forceDeleteProjectHandler = forceDeleteProjectHandler;
