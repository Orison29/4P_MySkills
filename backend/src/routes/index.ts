import { Express } from "express";
import authRoutes from "../modules/auth/auth.routes";
import departmentRoutes from "../modules/departments/department.routes";

export const registerRoutes = (app: Express) => {
  app.use("/api/auth", authRoutes);
  app.use("/api/departments", departmentRoutes);

  app.get("/health", (_, res) => {
    res.json({ status: "ok" });
  });
};
