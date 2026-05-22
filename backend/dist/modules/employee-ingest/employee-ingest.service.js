"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestEmployees = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const sync_1 = require("csv-parse/sync");
const client_1 = require("@prisma/client");
const db_1 = require("../../utils/db");
const employee_ingest_validators_1 = require("./employee-ingest.validators");
const DEFAULT_PASSWORD = "password@123";
const DEFAULT_SKILL_RATING = 3;
const TASK_DELIMITER = ";";
const parseCsvRows = (buffer) => {
    const text = buffer.toString("utf8");
    return (0, sync_1.parse)(text, {
        bom: true,
        skip_empty_lines: true,
        relax_column_count: true,
    });
};
const buildEmail = (base, counter) => `${base}employee${counter}@gmail.com`;
const toLower = (value) => value.toLowerCase();
const ingestEmployees = async (buffer) => {
    const rows = parseCsvRows(buffer);
    if (rows.length === 0) {
        return {
            fatal: true,
            summary: {
                processed: 0,
                projectsCreated: 0,
                deliverablesCreated: 0,
                employeesCreated: 0,
                tasksCreated: 0,
                failed: 1,
                errors: [{ row: 1, field: "name", error: "Empty file" }],
                employees: [],
                message: "No data ingested",
            },
        };
    }
    const headerResult = (0, employee_ingest_validators_1.validateEmployeeHeader)(rows[0]);
    if (!headerResult.ok) {
        return {
            fatal: true,
            summary: {
                processed: Math.max(rows.length - 1, 0),
                projectsCreated: 0,
                deliverablesCreated: 0,
                employeesCreated: 0,
                tasksCreated: 0,
                failed: 1,
                errors: [{ row: 1, field: "name", error: headerResult.error }],
                employees: [],
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
                projectsCreated: 0,
                deliverablesCreated: 0,
                employeesCreated: 0,
                tasksCreated: 0,
                failed: 1,
                errors: [{ row: 2, field: "name", error: "No employees provided" }],
                employees: [],
                message: "No employees ingested",
            },
        };
    }
    const errors = [];
    const validRows = [];
    const headerLength = rows[0].length;
    const skillHeaders = rows[0]
        .slice(3, headerLength - 4)
        .map((value) => (0, employee_ingest_validators_1.normalizeSkillHeader)(value))
        .filter((value) => value.length > 0);
    if (skillHeaders.length === 0) {
        return {
            fatal: true,
            summary: {
                processed: dataRows.length,
                projectsCreated: 0,
                deliverablesCreated: 0,
                employeesCreated: 0,
                tasksCreated: 0,
                failed: 1,
                errors: [{ row: 1, field: "skills", error: "No skill columns found" }],
                employees: [],
                message: "Header validation failed",
            },
        };
    }
    dataRows.forEach((row, index) => {
        const rowNumber = index + 2;
        const name = (0, employee_ingest_validators_1.normalizeName)(row[0]);
        const ageValue = typeof row[1] === "string" ? row[1].trim() : "";
        const age = Number.parseInt(ageValue, 10);
        const department = (0, employee_ingest_validators_1.normalizeDepartmentName)(row[2]);
        const reportsTo = (0, employee_ingest_validators_1.normalizeEmail)(row[headerLength - 4]);
        const project = (0, employee_ingest_validators_1.normalizeProjectName)(row[headerLength - 3]);
        const deliverable = (0, employee_ingest_validators_1.normalizeDeliverableName)(row[headerLength - 2]);
        const tasksCell = (0, employee_ingest_validators_1.normalizeTaskCell)(row[headerLength - 1]);
        const skills = skillHeaders
            .map((skillName, index) => {
            const raw = (0, employee_ingest_validators_1.normalizeSkillCell)(row[3 + index]);
            const rating = Number.parseInt(raw, 10);
            return { name: skillName, rating };
        })
            .filter((entry) => entry.name.length > 0);
        const tasks = tasksCell
            .split(TASK_DELIMITER)
            .map((value) => value.trim())
            .filter((value) => value.length > 0);
        if (!name) {
            errors.push({ row: rowNumber, field: "name", error: "Missing name" });
            return;
        }
        if (!Number.isFinite(age) || age <= 0) {
            errors.push({ row: rowNumber, field: "age", error: "Invalid age" });
            return;
        }
        if (!department) {
            errors.push({ row: rowNumber, field: "department", error: "Missing department" });
            return;
        }
        if (skills.length === 0) {
            errors.push({ row: rowNumber, field: "skills", error: "At least one skill is required" });
            return;
        }
        const invalidSkill = skills.find((entry) => !Number.isFinite(entry.rating) || entry.rating < 1 || entry.rating > 5);
        if (invalidSkill) {
            errors.push({
                row: rowNumber,
                field: "skills",
                error: `Invalid rating for ${invalidSkill.name}. Use 1-5`,
            });
            return;
        }
        if (!reportsTo) {
            errors.push({ row: rowNumber, field: "reportsTo", error: "Missing reportsTo email" });
            return;
        }
        if (!project) {
            errors.push({ row: rowNumber, field: "project", error: "Missing project" });
            return;
        }
        if (!deliverable) {
            errors.push({ row: rowNumber, field: "deliverable", error: "Missing deliverable" });
            return;
        }
        if (tasks.length === 0) {
            errors.push({ row: rowNumber, field: "tasks", error: "At least one task is required" });
            return;
        }
        validRows.push({
            rowNumber,
            name,
            age,
            department,
            reportsTo,
            project,
            deliverable,
            tasks,
            skills,
        });
    });
    const uniqueDepartments = Array.from(new Set(validRows.map((row) => toLower(row.department))));
    const uniqueManagers = Array.from(new Set(validRows.map((row) => toLower(row.reportsTo))));
    const uniqueSkills = Array.from(new Set(skillHeaders.map(toLower)));
    const [departments, managers, skills] = await Promise.all([
        db_1.prisma.department.findMany({
            where: {
                OR: uniqueDepartments.map((name) => ({ name: { equals: name, mode: "insensitive" } })),
            },
            select: { id: true, name: true },
        }),
        db_1.prisma.user.findMany({
            where: {
                OR: uniqueManagers.map((email) => ({ email })),
                role: client_1.Role.MANAGER,
            },
            include: {
                profile: { select: { id: true } },
            },
        }),
        db_1.prisma.skill.findMany({
            where: {
                OR: uniqueSkills.map((name) => ({ name: { equals: name, mode: "insensitive" } })),
            },
            select: { id: true, name: true },
        }),
    ]);
    const departmentMap = new Map(departments.map((dept) => [toLower(dept.name), dept.id]));
    const managerMap = new Map(managers.map((user) => [toLower(user.email), { profileId: user.profile?.id, userId: user.id }]));
    const skillMap = new Map(skills.map((skill) => [toLower(skill.name), skill.id]));
    validRows.forEach((row) => {
        if (!departmentMap.has(toLower(row.department))) {
            errors.push({ row: row.rowNumber, field: "department", error: "Department not found" });
        }
        const manager = managerMap.get(toLower(row.reportsTo));
        if (!manager?.profileId) {
            errors.push({ row: row.rowNumber, field: "reportsTo", error: "Manager not found" });
        }
        row.skills.forEach((skill) => {
            if (!skillMap.has(toLower(skill.name))) {
                errors.push({ row: row.rowNumber, field: "skills", error: `Skill not found: ${skill.name}` });
            }
        });
    });
    if (errors.length > 0) {
        return {
            fatal: true,
            summary: {
                processed: dataRows.length,
                projectsCreated: 0,
                deliverablesCreated: 0,
                employeesCreated: 0,
                tasksCreated: 0,
                failed: errors.length,
                errors,
                employees: [],
                message: "Validation failed; no data was ingested",
            },
        };
    }
    const passwordHash = await bcrypt_1.default.hash(DEFAULT_PASSWORD, 10);
    const usedEmails = new Set();
    let projectsCreated = 0;
    let deliverablesCreated = 0;
    let employeesCreated = 0;
    let tasksCreated = 0;
    const createdEmployees = [];
    await db_1.prisma.$transaction(async (tx) => {
        const projectMap = new Map();
        const deliverableMap = new Map();
        for (const row of validRows) {
            const projectKey = toLower(row.project);
            let project = projectMap.get(projectKey);
            if (!project) {
                const existing = await tx.project.findFirst({
                    where: { name: { equals: row.project, mode: "insensitive" } },
                    select: { id: true, name: true },
                });
                if (existing) {
                    project = existing;
                }
                else {
                    project = await tx.project.create({
                        data: { name: row.project },
                        select: { id: true, name: true },
                    });
                    projectsCreated += 1;
                }
                projectMap.set(projectKey, project);
            }
            const deliverableKey = `${project.id}:${toLower(row.deliverable)}`;
            let deliverable = deliverableMap.get(deliverableKey);
            if (!deliverable) {
                const existingDeliverable = await tx.deliverable.findUnique({
                    where: {
                        projectId_name: {
                            projectId: project.id,
                            name: row.deliverable,
                        },
                    },
                    select: { id: true, projectId: true },
                });
                if (existingDeliverable) {
                    deliverable = existingDeliverable;
                }
                else {
                    deliverable = await tx.deliverable.create({
                        data: {
                            projectId: project.id,
                            name: row.deliverable,
                            description: `Auto-created for ${row.project}`,
                        },
                        select: { id: true, projectId: true },
                    });
                    deliverablesCreated += 1;
                }
                deliverableMap.set(deliverableKey, deliverable);
            }
            const base = (0, employee_ingest_validators_1.normalizeEmailBase)(row.name);
            let counter = 1;
            let email = buildEmail(base, counter);
            while (usedEmails.has(email) || (await tx.user.count({ where: { email } })) > 0) {
                counter += 1;
                email = buildEmail(base, counter);
            }
            usedEmails.add(email);
            const user = await tx.user.create({
                data: {
                    email,
                    passwordHash,
                    role: client_1.Role.EMPLOYEE,
                },
            });
            const employee = await tx.employeeProfile.create({
                data: {
                    fullname: row.name,
                    age: row.age,
                    departmentId: departmentMap.get(toLower(row.department)),
                    managerId: managerMap.get(toLower(row.reportsTo)).profileId,
                    userId: user.id,
                },
            });
            employeesCreated += 1;
            await tx.employeeProjectAssignment.create({
                data: {
                    employeeId: employee.id,
                    projectId: project.id,
                    deliverableId: deliverable.id,
                },
            });
            const taskData = row.tasks.map((title) => ({
                title,
                status: client_1.TaskStatus.PENDING,
                employeeId: employee.id,
                projectId: project.id,
                deliverableId: deliverable.id,
            }));
            if (taskData.length > 0) {
                await tx.task.createMany({ data: taskData });
                tasksCreated += taskData.length;
            }
            const reviewerId = managerMap.get(toLower(row.reportsTo))?.userId || null;
            const employeeSkillData = row.skills.map((skill) => ({
                employeeId: employee.id,
                skillId: skillMap.get(toLower(skill.name)),
                selfRating: skill.rating,
                approvedRating: skill.rating,
                status: client_1.SkillRatingStatus.APPROVED,
                reviewedBy: reviewerId,
                reviewedAt: new Date(),
            }));
            if (employeeSkillData.length > 0) {
                await tx.employeeSkill.createMany({ data: employeeSkillData, skipDuplicates: true });
                await tx.skillProgressLog.createMany({
                    data: employeeSkillData.map((entry) => ({
                        employeeId: entry.employeeId,
                        skillId: entry.skillId,
                        previousRating: null,
                        newRating: entry.approvedRating ?? entry.selfRating,
                        changeType: client_1.SkillChangeType.MANAGER_APPROVED,
                        changedBy: reviewerId,
                        comment: "Seeded from employee ingestion",
                    })),
                });
            }
            createdEmployees.push({
                name: row.name,
                email,
                department: row.department,
                managerEmail: row.reportsTo,
                project: project.name,
                deliverable: row.deliverable,
                tasks: row.tasks,
            });
        }
    });
    const summary = {
        processed: dataRows.length,
        projectsCreated,
        deliverablesCreated,
        employeesCreated,
        tasksCreated,
        failed: 0,
        errors: [],
        employees: createdEmployees,
        message: "Employee ingestion completed successfully",
    };
    return { summary, fatal: false };
};
exports.ingestEmployees = ingestEmployees;
