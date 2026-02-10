import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { ENV } from "../config/env";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      userId: string;
      role: Role;
    };
  }
}

type TokenPayload = {
  userId: string;
  role: Role;
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    const payload = jwt.verify(token, ENV.JWT_SECRET) as TokenPayload;
    req.user = { userId: payload.userId, role: payload.role };
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
};
