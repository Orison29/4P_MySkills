"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const token = authHeader.slice("Bearer ".length).trim();
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.ENV.JWT_SECRET);
        req.user = { userId: payload.userId, role: payload.role };
        next();
    }
    catch {
        res.status(401).json({ error: "Unauthorized" });
    }
};
exports.authMiddleware = authMiddleware;
