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
exports.getSkillSpectrumByDepartment = exports.getLearningSpeed = exports.getDashboardStats = exports.getSkillProgressTimeline = exports.getAllEmployeesOverview = exports.getEmployeeSkillProgress = void 0;
const analyticsService = __importStar(require("./analytics.service"));
const getEmployeeSkillProgress = async (req, res) => {
    try {
        const employeeId = req.params.employeeId;
        const progress = await analyticsService.getEmployeeSkillProgress(employeeId);
        res.status(200).json(progress);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.getEmployeeSkillProgress = getEmployeeSkillProgress;
const getAllEmployeesOverview = async (req, res) => {
    try {
        const overview = await analyticsService.getAllEmployeesOverview();
        res.status(200).json({ employees: overview });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getAllEmployeesOverview = getAllEmployeesOverview;
const getSkillProgressTimeline = async (req, res) => {
    try {
        const employeeId = req.params.employeeId;
        const skillId = req.params.skillId;
        const timeline = await analyticsService.getSkillProgressTimeline(employeeId, skillId);
        res.status(200).json(timeline);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.getSkillProgressTimeline = getSkillProgressTimeline;
const getDashboardStats = async (req, res) => {
    try {
        const stats = await analyticsService.getDashboardStats();
        res.status(200).json(stats);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getDashboardStats = getDashboardStats;
const getLearningSpeed = async (req, res) => {
    try {
        const startDate = typeof req.query.startDate === "string" ? req.query.startDate : undefined;
        const endDate = typeof req.query.endDate === "string" ? req.query.endDate : undefined;
        if (startDate && isNaN(Date.parse(startDate))) {
            res.status(400).json({ error: "Invalid startDate" });
            return;
        }
        if (endDate && isNaN(Date.parse(endDate))) {
            res.status(400).json({ error: "Invalid endDate" });
            return;
        }
        const data = await analyticsService.getLearningSpeed(startDate, endDate);
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ error: error?.message || "Internal server error" });
    }
};
exports.getLearningSpeed = getLearningSpeed;
const getSkillSpectrumByDepartment = async (req, res) => {
    try {
        const rawSkillId = req.query.skillId;
        const skillId = Array.isArray(rawSkillId) ? rawSkillId[0] : rawSkillId;
        if (!skillId || typeof skillId !== "string") {
            res.status(400).json({ error: "skillId is required" });
            return;
        }
        const data = await analyticsService.getSkillSpectrumByDepartment(skillId);
        res.status(200).json(data);
    }
    catch (error) {
        if (error?.message === "Skill not found") {
            res.status(404).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: error?.message || "Internal server error" });
    }
};
exports.getSkillSpectrumByDepartment = getSkillSpectrumByDepartment;
