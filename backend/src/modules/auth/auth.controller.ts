import { Request, Response } from "express";
import { Role } from "@prisma/client";
import { loginUser, registerUser } from "./auth.service";

export const registerController = async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body as {
      email: string;
      password: string;
      role: Role;
    };

    const user = await registerUser(email, password, role);
    res.status(201).json(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    if (message === "User already exists") {
      res.status(409).json({ error: message });
      return;
    }

    res.status(400).json({ error: message });
  }
};

export const loginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const response = await loginUser(email, password);
    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    if (message === "Invalid credentials") {
      res.status(401).json({ error: message });
      return;
    }

    res.status(400).json({ error: message });
  }
};
