"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const db_1 = require("../../utils/db");
const registerUser = async (email, password, role) => {
    const existingUser = await db_1.prisma.user.findUnique({
        where: { email }
    });
    if (existingUser) {
        throw new Error("User already exists");
    }
    const passwordHash = await bcrypt_1.default.hash(password, 10);
    const user = await db_1.prisma.user.create({
        data: {
            email,
            passwordHash,
            role
        },
        select: {
            id: true,
            email: true,
            role: true,
            createdAt: true
        }
    });
    return user;
};
exports.registerUser = registerUser;
const loginUser = async (email, password) => {
    const user = await db_1.prisma.user.findUnique({
        where: { email },
        include: { profile: true }
    });
    if (!user) {
        throw new Error("Invalid credentials");
    }
    const isValidPassword = await bcrypt_1.default.compare(password, user.passwordHash);
    if (!isValidPassword) {
        throw new Error("Invalid credentials");
    }
    const token = jsonwebtoken_1.default.sign({
        userId: user.id,
        role: user.role
    }, env_1.ENV.JWT_SECRET, { expiresIn: "1d" });
    const { profile, passwordHash: _, ...userData } = user;
    return { token, user: userData, profile };
};
exports.loginUser = loginUser;
