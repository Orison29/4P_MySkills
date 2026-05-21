import bcrypt from "bcrypt";
import { parse } from "csv-parse/sync";
import { Role } from "@prisma/client";
import { prisma } from "../../utils/db";
import {
  normalizeDepartmentName,
  normalizeEmailBase,
  normalizeManagerName,
  validateManagerHeader,
} from "./manager-ingest.validators";
import { ManagerIngestError, ManagerIngestSummary } from "./manager-ingest.types";

const DEFAULT_PASSWORD = "password@123";

const parseCsvRows = (buffer: Buffer): string[][] => {
  const text = buffer.toString("utf8");

  return parse(text, {
    bom: true,
    skip_empty_lines: true,
    relax_column_count: false,
  });
};

const buildEmail = (base: string, counter: number) => `${base}manager${counter}@gmail.com`;

export const ingestManagers = async (buffer: Buffer): Promise<{ summary: ManagerIngestSummary; fatal: boolean }> => {
  const rows = parseCsvRows(buffer);

  if (rows.length === 0) {
    return {
      fatal: true,
      summary: {
        processed: 0,
        departmentsCreated: 0,
        managersCreated: 0,
        failed: 1,
        errors: [{ row: 1, field: "managerName", error: "Empty file" }],
        managers: [],
        message: "No data ingested",
      },
    };
  }

  const headerResult = validateManagerHeader(rows[0]);
  if (!headerResult.ok) {
    return {
      fatal: true,
      summary: {
        processed: Math.max(rows.length - 1, 0),
        departmentsCreated: 0,
        managersCreated: 0,
        failed: 1,
        errors: [{ row: 1, field: "managerName", error: headerResult.error }],
        managers: [],
        message: "Header validation failed",
      },
    };
  }

  const dataRows = rows.slice(1);
  if (dataRows.length === 0) {
    return {
      fatal: true,
      summary: {
        processed: 0,
        departmentsCreated: 0,
        managersCreated: 0,
        failed: 1,
        errors: [{ row: 2, field: "managerName", error: "No managers provided" }],
        managers: [],
        message: "No managers ingested",
      },
    };
  }

  const errors: ManagerIngestError[] = [];
  const validRows: { rowNumber: number; managerName: string; department: string }[] = [];

  dataRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const managerName = normalizeManagerName(row[0]);
    const department = normalizeDepartmentName(row[1]);

    if (!managerName) {
      errors.push({ row: rowNumber, field: "managerName", error: "Missing managerName" });
      return;
    }

    if (!department) {
      errors.push({ row: rowNumber, field: "department", error: "Missing department" });
      return;
    }

    const normalizedEmailBase = normalizeEmailBase(managerName);
    if (!normalizedEmailBase) {
      errors.push({ row: rowNumber, field: "managerName", error: "Invalid managerName" });
      return;
    }

    validRows.push({ rowNumber, managerName, department });
  });

  const departmentNames = Array.from(
    new Set(validRows.map((row) => row.department.toLowerCase()))
  );

  let departmentsCreated = 0;
  if (departmentNames.length > 0) {
    const existingDepartments = await prisma.department.findMany({
      where: {
        OR: departmentNames.map((name) => ({
          name: { equals: name, mode: "insensitive" },
        })),
      },
      select: { id: true, name: true },
    });

    const existingLower = new Set(existingDepartments.map((dept) => dept.name.toLowerCase()));
    const toCreate = departmentNames
      .filter((name) => !existingLower.has(name))
      .map((name) => ({ name }));

    if (toCreate.length > 0) {
      const result = await prisma.department.createMany({ data: toCreate, skipDuplicates: true });
      departmentsCreated = result.count ?? 0;
    }
  }

  const departments = await prisma.department.findMany({
    where: {
      OR: Array.from(new Set(validRows.map((row) => row.department))).map((name) => ({
        name: { equals: name, mode: "insensitive" },
      })),
    },
    select: { id: true, name: true },
  });

  const departmentMap = new Map(
    departments.map((dept) => [dept.name.toLowerCase(), dept.id])
  );

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  let managersCreated = 0;
  const usedEmails = new Set<string>();
  const managers: { name: string; email: string; department: string }[] = [];

  for (const row of validRows) {
    const deptId = departmentMap.get(row.department.toLowerCase());
    if (!deptId) {
      errors.push({ row: row.rowNumber, field: "department", error: "Department not found" });
      continue;
    }

    const base = normalizeEmailBase(row.managerName);
    let counter = 1;
    let email = buildEmail(base, counter);

    while (usedEmails.has(email) || (await prisma.user.count({ where: { email } })) > 0) {
      counter += 1;
      email = buildEmail(base, counter);
    }

    usedEmails.add(email);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: Role.MANAGER,
        },
      });

      await tx.employeeProfile.create({
        data: {
          fullname: row.managerName,
          departmentId: deptId,
          userId: user.id,
        },
      });
    });

    managersCreated += 1;
    managers.push({ name: row.managerName, email, department: row.department });
  }

  const summary: ManagerIngestSummary = {
    processed: dataRows.length,
    departmentsCreated,
    managersCreated,
    failed: errors.length,
    errors,
    managers,
    message: "All new departments ingested. Managers ingestion completed.",
  };

  return { summary, fatal: false };
};
