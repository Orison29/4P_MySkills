"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestManagersHandler = void 0;
const manager_ingest_service_1 = require("./manager-ingest.service");
const ingestManagersHandler = async (req, res) => {
    const file = req.file;
    if (!file) {
        res.status(400).json({ error: "Missing file" });
        return;
    }
    try {
        const { summary, fatal } = await (0, manager_ingest_service_1.ingestManagers)(file.buffer);
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
exports.ingestManagersHandler = ingestManagersHandler;
