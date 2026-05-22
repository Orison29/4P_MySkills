"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestManagers = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const sync_1 = require("csv-parse/sync");
const client_1 = require("@prisma/client");
const db_1 = require("../../utils/db");
const manager_ingest_validators_1 = require("./manager-ingest.validators");
const DEFAULT_PASSWORD = "password@123";
const parseCsvRows = (buffer) => {
    const text = buffer.toString("utf8");
    return (0, sync_1.parse)(text, {
        bom: true,
        skip_empty_lines: true,
        relax_column_count: false,
    });
};
const buildEmail = (base, counter) => `${base}manager${counter}@gmail.com`;
const ingestManagers = async (buffer) => {
    const rows = parseCsvRows(buffer);
    if (rows.length === 0) {
        return {
            fatal: true,
            summary: {
                processed: 0,
                departmentsCreated: 0,
                managersCreated: 0,
                failed: 1,
                errors: [{ row: 1, field: "managerName", error: "Empty file" }],
                managers: [],
                message: "No data ingested",
            },
        };
    }
    const headerResult = (0, manager_ingest_validators_1.validateManagerHeader)(rows[0]);
    if (!headerResult.ok) {
        return {
            fatal: true,
            summary: {
                processed: Math.max(rows.length - 1, 0),
                departmentsCreated: 0,
                managersCreated: 0,
                failed: 1,
                errors: [{ row: 1, field: "managerName", error: headerResult.error }],
                managers: [],
                message: "Header validation failed",
            },
        };
    }
    const dataRows = rows.slice(1);
    if (dataRows.length === 0) {
        return {
            fatal: true,
            summary: {
                processed: 0,
                departmentsCreated: 0,
                managersCreated: 0,
                failed: 1,
                errors: [{ row: 2, field: "managerName", error: "No managers provided" }],
                managers: [],
                message: "No managers ingested",
            },
        };
    }
    const errors = [];
    const validRows = [];
    dataRows.forEach((row, index) => {
        const rowNumber = index + 2;
        const managerName = (0, manager_ingest_validators_1.normalizeManagerName)(row[0]);
        const department = (0, manager_ingest_validators_1.normalizeDepartmentName)(row[1]);
        if (!managerName) {
            errors.push({ row: rowNumber, field: "managerName", error: "Missing managerName" });
            return;
        }
        if (!department) {
            errors.push({ row: rowNumber, field: "department", error: "Missing department" });
            return;
        }
        const normalizedEmailBase = (0, manager_ingest_validators_1.normalizeEmailBase)(managerName);
        if (!normalizedEmailBase) {
            errors.push({ row: rowNumber, field: "managerName", error: "Invalid managerName" });
            return;
        }
        validRows.push({ rowNumber, managerName, department });
    });
    const departmentNames = Array.from(new Set(validRows.map((row) => row.department.toLowerCase())));
    let departmentsCreated = 0;
    if (departmentNames.length > 0) {
        const existingDepartments = await db_1.prisma.department.findMany({
            where: {
                OR: departmentNames.map((name) => ({
                    name: { equals: name, mode: "insensitive" },
                })),
            },
            select: { id: true, name: true },
        });
        const existingLower = new Set(existingDepartments.map((dept) => dept.name.toLowerCase()));
        const toCreate = departmentNames
            .filter((name) => !existingLower.has(name))
            .map((name) => ({ name }));
        if (toCreate.length > 0) {
            const result = await db_1.prisma.department.createMany({ data: toCreate, skipDuplicates: true });
            departmentsCreated = result.count ?? 0;
        }
    }
    const departments = await db_1.prisma.department.findMany({
        where: {
            OR: Array.from(new Set(validRows.map((row) => row.department))).map((name) => ({
                name: { equals: name, mode: "insensitive" },
            })),
        },
        select: { id: true, name: true },
    });
    const departmentMap = new Map(departments.map((dept) => [dept.name.toLowerCase(), dept.id]));
    const passwordHash = await bcrypt_1.default.hash(DEFAULT_PASSWORD, 10);
    let managersCreated = 0;
    const usedEmails = new Set();
    const managers = [];
    for (const row of validRows) {
        const deptId = departmentMap.get(row.department.toLowerCase());
        if (!deptId) {
            errors.push({ row: row.rowNumber, field: "department", error: "Department not found" });
            continue;
        }
        const base = (0, manager_ingest_validators_1.normalizeEmailBase)(row.managerName);
        let counter = 1;
        let email = buildEmail(base, counter);
        while (usedEmails.has(email) || (await db_1.prisma.user.count({ where: { email } })) > 0) {
            counter += 1;
            email = buildEmail(base, counter);
        }
        usedEmails.add(email);
        await db_1.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email,
                    passwordHash,
                    role: client_1.Role.MANAGER,
                },
            });
            await tx.employeeProfile.create({
                data: {
                    fullname: row.managerName,
                    departmentId: deptId,
                    userId: user.id,
                },
            });
        });
        managersCreated += 1;
        managers.push({ name: row.managerName, email, department: row.department });
    }
    const summary = {
        processed: dataRows.length,
        departmentsCreated,
        managersCreated,
        failed: errors.length,
        errors,
        managers,
        message: "All new departments ingested. Managers ingestion completed.",
    };
    return { summary, fatal: false };
};
exports.ingestManagers = ingestManagers;
