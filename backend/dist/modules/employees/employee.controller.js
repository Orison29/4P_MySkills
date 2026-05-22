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
exports.deleteUserHandler = exports.getMyTeamHandler = exports.changeRoleHandler = exports.getMyProfileHandler = exports.getMyAssignmentsHandler = exports.assignManagerHandler = exports.createEmployeeHandler = void 0;
const employee_service_1 = require("./employee.service");
const createEmployeeHandler = async (req, res) => {
    try {
        const { userId, fullname, departmentId } = req.body;
        const employee = await (0, employee_service_1.createEmployeeProfile)(userId, fullname, departmentId);
        res.status(201).json(employee);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        if (message === "User not found" || message === "Department not found") {
            res.status(404).json({ error: message });
            return;
        }
        if (message === "Profile already exists") {
            res.status(409).json({ error: message });
            return;
        }
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.createEmployeeHandler = createEmployeeHandler;
const assignManagerHandler = async (req, res) => {
    try {
        const rawId = req.params.id;
        const employeeId = Array.isArray(rawId) ? rawId[0] : rawId;
        const { managerId } = req.body;
        const employee = await (0, employee_service_1.assignManager)(employeeId, managerId);
        res.status(200).json(employee);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        if (message === "Employee not found" || message === "Manager not found") {
            res.status(404).json({ error: message });
            return;
        }
        if (message === "Self assignment is not allowed" ||
            message === "Department mismatch") {
            res.status(400).json({ error: message });
            return;
        }
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.assignManagerHandler = assignManagerHandler;
const getMyAssignmentsHandler = async (req, res) => {
    try {
        const userId = req.user.userId;
        const assignments = await (0, employee_service_1.getEmployeeAssignments)(userId);
        res.status(200).json(assignments);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        if (message === "Employee profile not found") {
            res.status(404).json({ error: message });
            return;
        }
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getMyAssignmentsHandler = getMyAssignmentsHandler;
const getMyProfileHandler = async (req, res) => {
    try {
        const userId = req.user.userId;
        const profile = await (0, employee_service_1.getMyProfile)(userId);
        res.status(200).json(profile);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        if (message === "Employee profile not found") {
            res.status(404).json({ error: message });
            return;
        }
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getMyProfileHandler = getMyProfileHandler;
const changeRoleHandler = async (req, res) => {
    try {
        const rawId = req.params.id;
        const employeeId = Array.isArray(rawId) ? rawId[0] : rawId;
        const { role } = req.body;
        // Get the user ID from the employee profile
        const { prisma } = await Promise.resolve().then(() => __importStar(require("../../utils/db")));
        const employee = await prisma.employeeProfile.findUnique({
            where: { id: employeeId },
            select: { userId: true }
        });
        if (!employee) {
            res.status(404).json({ error: "Employee not found" });
            return;
        }
        const updatedUser = await prisma.user.update({
            where: { id: employee.userId },
            data: { role }
        });
        res.status(200).json({ message: "Role updated successfully", role: updatedUser.role });
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.changeRoleHandler = changeRoleHandler;
const getMyTeamHandler = async (req, res) => {
    try {
        const managerUserId = req.user.userId;
        const team = await (0, employee_service_1.getMyTeam)(managerUserId);
        res.status(200).json(team);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getMyTeamHandler = getMyTeamHandler;
const deleteUserHandler = async (req, res) => {
    try {
        const rawId = req.params.id;
        const employeeId = Array.isArray(rawId) ? rawId[0] : rawId;
        const result = await (0, employee_service_1.deleteUserByEmployeeId)(employeeId);
        res.status(200).json(result);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        if (message === "Employee not found") {
            res.status(404).json({ error: message });
            return;
        }
        if (message === "User cannot be deleted due to linked records") {
            res.status(409).json({ error: message });
            return;
        }
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.deleteUserHandler = deleteUserHandler;
