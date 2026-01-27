import { Request, Response } from "express";

export const login = async (_req: Request, res: Response) => {
  res.json({ message: "Auth module working" });
};
