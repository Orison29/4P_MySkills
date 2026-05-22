"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginController = exports.registerController = void 0;
const auth_service_1 = require("./auth.service");
const registerController = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const user = await (0, auth_service_1.registerUser)(email, password, role);
        res.status(201).json(user);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Registration failed";
        if (message === "User already exists") {
            res.status(409).json({ error: message });
            return;
        }
        res.status(400).json({ error: message });
    }
};
exports.registerController = registerController;
const loginController = async (req, res) => {
    try {
        const { email, password } = req.body;
        const response = await (0, auth_service_1.loginUser)(email, password);
        res.status(200).json(response);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Login failed";
        if (message === "Invalid credentials") {
            res.status(401).json({ error: message });
            return;
        }
        res.status(400).json({ error: message });
    }
};
exports.loginController = loginController;
