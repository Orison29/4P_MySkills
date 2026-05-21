const normalizeHeader = (value: string) => value.replace(/^\uFEFF/, "").trim().toLowerCase();

export const validateEmployeeHeader = (headerRow: string[]) => {
  const normalized = headerRow.map((value) => normalizeHeader(value));

  if (normalized.length < 8) {
    return { ok: false, error: "Header must include name, age, department, at least one skill, reportsTo, project, deliverable, tasks" };
  }

  const firstThree = normalized.slice(0, 3);
  const lastFour = normalized.slice(-4);

  if (firstThree[0] !== "name" || firstThree[1] !== "age" || firstThree[2] !== "department") {
    return { ok: false, error: "Header must start with: name, age, department" };
  }

  if (lastFour[0] !== "reportsto" || lastFour[1] !== "project" || lastFour[2] !== "deliverable" || lastFour[3] !== "tasks") {
    return { ok: false, error: "Header must end with: reportsTo, project, deliverable, tasks" };
  }

  const skillHeaders = normalized.slice(3, -4).filter((value) => value.length > 0);
  if (skillHeaders.length === 0) {
    return { ok: false, error: "Header must include at least one skill column" };
  }

  return { ok: true as const, skillColumnCount: skillHeaders.length };
};

export const normalizeName = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

export const normalizeDepartmentName = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

export const normalizeEmail = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
};

export const normalizeProjectName = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

export const normalizeDeliverableName = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

export const normalizeTaskCell = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

export const normalizeSkillCell = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

export const normalizeSkillHeader = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

export const normalizeEmailBase = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");
