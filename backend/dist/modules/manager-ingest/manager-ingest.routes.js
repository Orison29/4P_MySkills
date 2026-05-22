"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const manager_ingest_controller_1 = require("./manager-ingest.controller");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.post("/", auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)(client_1.Role.HR), upload.single("file"), manager_ingest_controller_1.ingestManagersHandler);
exports.default = router;
