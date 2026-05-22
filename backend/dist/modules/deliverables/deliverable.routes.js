"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const deliverable_controller_1 = require("./deliverable.controller");
const router = (0, express_1.Router)();
// Create deliverable (will be used by LLM integration, but HR can also manually create)
router.post("/projects/:projectId/deliverables", auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)(client_1.Role.HR), deliverable_controller_1.createDeliverableHandler);
// Get all deliverables for a project - HR only
router.get("/projects/:projectId/deliverables", auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)(client_1.Role.HR), deliverable_controller_1.getProjectDeliverablesHandler);
// Get specific deliverable details - HR only
router.get("/deliverables/:id", auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)(client_1.Role.HR), deliverable_controller_1.getDeliverableDetailsHandler);
// Update deliverable (HR can edit what LLM created)
router.patch("/deliverables/:id", auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)(client_1.Role.HR), deliverable_controller_1.updateDeliverableHandler);
// Delete deliverable (HR can remove if LLM got it wrong)
router.delete("/deliverables/:id", auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)(client_1.Role.HR), deliverable_controller_1.deleteDeliverableHandler);
exports.default = router;
