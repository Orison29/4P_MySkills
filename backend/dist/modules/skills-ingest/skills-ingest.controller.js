"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestSkillsHandler = void 0;
const skills_ingest_service_1 = require("./skills-ingest.service");
const ingestSkillsHandler = async (req, res) => {
    const dupStrategy = req.query.dupStrategy || "ignore";
    const file = req.file;
    if (!file) {
        res.status(400).json({ error: "Missing file" });
        return;
    }
    try {
        const { summary, fatal } = await (0, skills_ingest_service_1.ingestSkills)(file.buffer, dupStrategy === "reject" ? "reject" : "ignore");
        if (fatal) {
            res.status(400).json(summary);
            return;
        }
        res.status(200).json(summary);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        res.status(500).json({ error: message });
    }
};
exports.ingestSkillsHandler = ingestSkillsHandler;
