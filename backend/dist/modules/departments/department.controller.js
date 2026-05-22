"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDepartmentHandler = exports.listDepartmentsHandler = exports.createDepartmentHandler = void 0;
const client_1 = require("@prisma/client");
const department_service_1 = require("./department.service");
const createDepartmentHandler = async (req, res) => {
    try {
        const { name } = req.body;
        const department = await (0, department_service_1.createDepartment)(name);
        res.status(201).json(department);
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") {
                res.status(409).json({ error: "Department already exists" });
                return;
            }
        }
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.createDepartmentHandler = createDepartmentHandler;
const listDepartmentsHandler = async (req, res) => {
    try {
        const departments = await (0, department_service_1.listDepartments)();
        res.status(200).json(departments);
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.listDepartmentsHandler = listDepartmentsHandler;
const deleteDepartmentHandler = async (req, res) => {
    try {
        const rawId = req.params.id;
        const departmentId = Array.isArray(rawId) ? rawId[0] : rawId;
        const result = await (0, department_service_1.deleteDepartment)(departmentId);
        res.status(200).json(result);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        if (message === "Department not found") {
            res.status(404).json({ error: message });
            return;
        }
        if (message === "Department has employees and cannot be deleted") {
            res.status(409).json({ error: message });
            return;
        }
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.deleteDepartmentHandler = deleteDepartmentHandler;
