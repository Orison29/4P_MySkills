"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestEmployeesHandler = void 0;
const employee_ingest_service_1 = require("./employee-ingest.service");
const ingestEmployeesHandler = async (req, res) => {
    const file = req.file;
    if (!file) {
        res.status(400).json({ error: "Missing file" });
        return;
    }
    try {
        const { summary, fatal } = await (0, employee_ingest_service_1.ingestEmployees)(file.buffer);
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
exports.ingestEmployeesHandler = ingestEmployeesHandler;
