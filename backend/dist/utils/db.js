"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const prismaClientSingleton = () => {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("DATABASE_URL is not set");
    }
    const adapter = new adapter_pg_1.PrismaPg({ connectionString });
    return new client_1.PrismaClient({ adapter });
};
exports.prisma = globalThis.prisma ?? prismaClientSingleton();
if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = exports.prisma;
}
