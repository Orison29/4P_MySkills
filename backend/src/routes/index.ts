import { Express } from "express";
import authRoutes from "../modules/auth/auth.routes";
import departmentRoutes from "../modules/departments/department.routes";
import employeeRoutes from "../modules/employees/employee.routes";
import projectRoutes from "../modules/projects/project.routes";
import assignmentRoutes from "../modules/assignments/assignment.routes";
import skillRoutes from "../modules/skills/skill.routes";
import employeeSkillRoutes from "../modules/employee-skills/employee-skill.routes";
import deliverableRoutes from "../modules/deliverables/deliverable.routes";
import deliverableSkillRoutes from "../modules/deliverable-skills/deliverable-skill.routes";
import recommendationRoutes from "../modules/recommendations/recommendation.routes";
import analyticsRoutes from "../modules/analytics/analytics.routes";

export const registerRoutes = (app: Express) => {
  app.use("/api/auth", authRoutes);
  app.use("/api/departments", departmentRoutes);
  app.use("/api/employees", employeeRoutes);
  app.use("/api/projects", projectRoutes);
  app.use("/api/skills", skillRoutes);
  app.use("/api/employee-skills", employeeSkillRoutes);
  app.use("/api", deliverableRoutes);
  app.use("/api", deliverableSkillRoutes);
  app.use("/api", recommendationRoutes);
  app.use("/api", assignmentRoutes);
  app.use("/api/analytics", analyticsRoutes);

  app.get("/health", (_, res) => {
    res.json({ status: "ok" });
  });
};
