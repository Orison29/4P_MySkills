import { parse } from "csv-parse/sync";
import { prisma } from "../../utils/db";
import { IngestionError, IngestionSummary } from "./skills-ingest.types";
import { normalizeSkillName, validateSkillsHeader } from "./skills-ingest.validators";

export type DuplicateStrategy = "ignore" | "reject";

const parseCsvRows = (buffer: Buffer): string[][] => {
  const text = buffer.toString("utf8");

  return parse(text, {
    bom: true,
    skip_empty_lines: true,
    relax_column_count: false,
  });
};

export const ingestSkills = async (
  buffer: Buffer,
  dupStrategy: DuplicateStrategy = "ignore"
): Promise<{ summary: IngestionSummary; fatal: boolean }> => {
  const rows = parseCsvRows(buffer);

  if (rows.length === 0) {
    return {
      fatal: true,
      summary: {
        processed: 0,
        created: 0,
        ignored: 0,
        failed: 1,
        errors: [{ row: 1, field: "Skills", error: "Empty file" }],
      },
    };
  }

  const headerResult = validateSkillsHeader(rows[0]);
  if (!headerResult.ok) {
    return {
      fatal: true,
      summary: {
        processed: Math.max(rows.length - 1, 0),
        created: 0,
        ignored: 0,
        failed: 1,
        errors: [{ row: 1, field: "Skills", error: headerResult.error }],
      },
    };
  }

  const dataRows = rows.slice(1);
  if (dataRows.length === 0) {
    return {
      fatal: true,
      summary: {
        processed: 0,
        created: 0,
        ignored: 0,
        failed: 1,
        errors: [{ row: 2, field: "Skills", error: "No skills provided" }],
      },
    };
  }

  const seen = new Map<string, number>();
  const errors: IngestionError[] = [];
  const uniqueNames: string[] = [];
  let ignored = 0;

  dataRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const rawValue = row[0];
    const name = normalizeSkillName(rawValue);

    if (!name) {
      errors.push({ row: rowNumber, field: "Skills", error: "Empty skill name" });
      return;
    }

    const key = name.toLowerCase();
    if (seen.has(key)) {
      if (dupStrategy === "reject") {
        errors.push({
          row: rowNumber,
          field: "Skills",
          error: `Duplicate skill in file (matches row ${seen.get(key)})`,
        });
      } else {
        ignored += 1;
      }
      return;
    }

    seen.set(key, rowNumber);
    uniqueNames.push(name);
  });

  if (dupStrategy === "reject" && errors.length > 0) {
    return {
      fatal: false,
      summary: {
        processed: dataRows.length,
        created: 0,
        ignored: 0,
        failed: errors.length,
        errors,
      },
    };
  }

  let existingSet = new Set<string>();
  if (uniqueNames.length > 0) {
    const existing = await prisma.skill.findMany({
      where: {
        OR: uniqueNames.map((name) => ({
          name: { equals: name, mode: "insensitive" },
        })),
      },
      select: { name: true },
    });

    existingSet = new Set(existing.map((skill) => skill.name.toLowerCase()));
  }

  const toCreate = uniqueNames.filter((name) => !existingSet.has(name.toLowerCase()));
  ignored += uniqueNames.length - toCreate.length;

  let created = 0;
  if (toCreate.length > 0) {
    const result = await prisma.skill.createMany({
      data: toCreate.map((name) => ({ name })),
      skipDuplicates: true,
    });
    created = result.count ?? 0;
  }

  return {
    fatal: false,
    summary: {
      processed: dataRows.length,
      created,
      ignored,
      failed: errors.length,
      errors,
    },
  };
};
