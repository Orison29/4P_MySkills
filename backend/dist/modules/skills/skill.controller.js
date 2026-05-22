"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSkillsHandler = exports.createSkillHandler = void 0;
const client_1 = require("@prisma/client");
const skill_service_1 = require("./skill.service");
const createSkillHandler = async (req, res) => {
    try {
        const { name, description } = req.body;
        const skill = await (0, skill_service_1.createSkill)(name, description);
        res.status(201).json(skill);
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") {
                res.status(409).json({ error: "Skill already exists" });
                return;
            }
        }
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.createSkillHandler = createSkillHandler;
const listSkillsHandler = async (req, res) => {
    try {
        const skills = await (0, skill_service_1.listSkills)();
        res.status(200).json(skills);
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.listSkillsHandler = listSkillsHandler;
