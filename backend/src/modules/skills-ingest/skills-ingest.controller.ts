import { Request, Response } from "express";
import { ingestSkills } from "./skills-ingest.service";

export const ingestSkillsHandler = async (req: Request, res: Response) => {
  const dupStrategy = (req.query.dupStrategy as string) || "ignore";
  const file = req.file as Express.Multer.File | undefined;

  if (!file) {
    res.status(400).json({ error: "Missing file" });
    return;
  }

  try {
    const { summary, fatal } = await ingestSkills(
      file.buffer,
      dupStrategy === "reject" ? "reject" : "ignore"
    );

    if (fatal) {
      res.status(400).json(summary);
      return;
    }

    res.status(200).json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ error: message });
  }
};
