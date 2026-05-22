"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeEmailBase = exports.normalizeDepartmentName = exports.normalizeManagerName = exports.validateManagerHeader = void 0;
const normalizeHeader = (value) => value.replace(/^\uFEFF/, "").trim().toLowerCase();
const validateManagerHeader = (headerRow) => {
    const normalized = headerRow.map((value) => normalizeHeader(value));
    if (normalized.length !== 2) {
        return { ok: false, error: "File must contain exactly two columns: managerName, department" };
    }
    if (normalized[0] !== "managername" || normalized[1] !== "department") {
        return { ok: false, error: "Header must be: managerName, department" };
    }
    return { ok: true };
};
exports.validateManagerHeader = validateManagerHeader;
const normalizeManagerName = (value) => {
    if (typeof value !== "string") {
        return "";
    }
    return value.trim();
};
exports.normalizeManagerName = normalizeManagerName;
const normalizeDepartmentName = (value) => {
    if (typeof value !== "string") {
        return "";
    }
    return value.trim();
};
exports.normalizeDepartmentName = normalizeDepartmentName;
const normalizeEmailBase = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
exports.normalizeEmailBase = normalizeEmailBase;
