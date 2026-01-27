import { Express } from "express";
import authRoutes from "../modules/auth/auth.routes";

export const registerRoutes = (app: Express) => {
  app.use("/api/auth", authRoutes);

  app.get("/health", (_, res) => {
    res.json({ status: "ok" });
  });
};
