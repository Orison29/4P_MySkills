"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeEmailBase = exports.normalizeSkillHeader = exports.normalizeSkillCell = exports.normalizeTaskCell = exports.normalizeDeliverableName = exports.normalizeProjectName = exports.normalizeEmail = exports.normalizeDepartmentName = exports.normalizeName = exports.validateEmployeeHeader = void 0;
const normalizeHeader = (value) => value.replace(/^\uFEFF/, "").trim().toLowerCase();
const validateEmployeeHeader = (headerRow) => {
    const normalized = headerRow.map((value) => normalizeHeader(value));
    if (normalized.length < 8) {
        return { ok: false, error: "Header must include name, age, department, at least one skill, reportsTo, project, deliverable, tasks" };
    }
    const firstThree = normalized.slice(0, 3);
    const lastFour = normalized.slice(-4);
    if (firstThree[0] !== "name" || firstThree[1] !== "age" || firstThree[2] !== "department") {
        return { ok: false, error: "Header must start with: name, age, department" };
    }
    if (lastFour[0] !== "reportsto" || lastFour[1] !== "project" || lastFour[2] !== "deliverable" || lastFour[3] !== "tasks") {
        return { ok: false, error: "Header must end with: reportsTo, project, deliverable, tasks" };
    }
    const skillHeaders = normalized.slice(3, -4).filter((value) => value.length > 0);
    if (skillHeaders.length === 0) {
        return { ok: false, error: "Header must include at least one skill column" };
    }
    return { ok: true, skillColumnCount: skillHeaders.length };
};
exports.validateEmployeeHeader = validateEmployeeHeader;
const normalizeName = (value) => {
    if (typeof value !== "string")
        return "";
    return value.trim();
};
exports.normalizeName = normalizeName;
const normalizeDepartmentName = (value) => {
    if (typeof value !== "string")
        return "";
    return value.trim();
};
exports.normalizeDepartmentName = normalizeDepartmentName;
const normalizeEmail = (value) => {
    if (typeof value !== "string")
        return "";
    return value.trim().toLowerCase();
};
exports.normalizeEmail = normalizeEmail;
const normalizeProjectName = (value) => {
    if (typeof value !== "string")
        return "";
    return value.trim();
};
exports.normalizeProjectName = normalizeProjectName;
const normalizeDeliverableName = (value) => {
    if (typeof value !== "string")
        return "";
    return value.trim();
};
exports.normalizeDeliverableName = normalizeDeliverableName;
const normalizeTaskCell = (value) => {
    if (typeof value !== "string")
        return "";
    return value.trim();
};
exports.normalizeTaskCell = normalizeTaskCell;
const normalizeSkillCell = (value) => {
    if (typeof value !== "string")
        return "";
    return value.trim();
};
exports.normalizeSkillCell = normalizeSkillCell;
const normalizeSkillHeader = (value) => {
    if (typeof value !== "string")
        return "";
    return value.trim();
};
exports.normalizeSkillHeader = normalizeSkillHeader;
const normalizeEmailBase = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
exports.normalizeEmailBase = normalizeEmailBase;
