"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeSkillName = exports.validateSkillsHeader = void 0;
const normalizeHeader = (value) => value.replace(/^\uFEFF/, "").trim().toLowerCase();
const validateSkillsHeader = (headerRow) => {
    if (headerRow.length !== 1) {
        return { ok: false, error: "File must contain exactly one column named Skills" };
    }
    const header = normalizeHeader(headerRow[0] ?? "");
    if (header !== "skills") {
        return { ok: false, error: "Header must be Skills" };
    }
    return { ok: true };
};
exports.validateSkillsHeader = validateSkillsHeader;
const normalizeSkillName = (value) => {
    if (typeof value !== "string") {
        return "";
    }
    return value.trim();
};
exports.normalizeSkillName = normalizeSkillName;
