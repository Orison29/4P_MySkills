"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDepartment = exports.listDepartments = exports.createDepartment = void 0;
const db_1 = require("../../utils/db");
const createDepartment = async (name) => {
    return db_1.prisma.department.create({
        data: {
            name
        }
    });
};
exports.createDepartment = createDepartment;
const listDepartments = async () => {
    return db_1.prisma.department.findMany({
        orderBy: {
            createdAt: "desc"
        }
    });
};
exports.listDepartments = listDepartments;
const deleteDepartment = async (departmentId) => {
    const department = await db_1.prisma.department.findUnique({
        where: { id: departmentId },
        select: { id: true }
    });
    if (!department) {
        throw new Error("Department not found");
    }
    const employeeCount = await db_1.prisma.employeeProfile.count({
        where: { departmentId }
    });
    if (employeeCount > 0) {
        throw new Error("Department has employees and cannot be deleted");
    }
    await db_1.prisma.department.delete({
        where: { id: departmentId }
    });
    return { message: "Department deleted successfully" };
};
exports.deleteDepartment = deleteDepartment;
