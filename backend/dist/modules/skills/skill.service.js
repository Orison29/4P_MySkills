"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSkills = exports.createSkill = void 0;
const db_1 = require("../../utils/db");
const createSkill = async (name, description) => {
    return db_1.prisma.skill.create({
        data: {
            name,
            description
        }
    });
};
exports.createSkill = createSkill;
const listSkills = async () => {
    return db_1.prisma.skill.findMany({
        orderBy: {
            createdAt: "desc"
        }
    });
};
exports.listSkills = listSkills;
