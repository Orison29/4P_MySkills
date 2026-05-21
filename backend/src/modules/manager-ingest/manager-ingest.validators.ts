const normalizeHeader = (value: string) => value.replace(/^\uFEFF/, "").trim().toLowerCase();

export const validateManagerHeader = (headerRow: string[]) => {
  const normalized = headerRow.map((value) => normalizeHeader(value));
  if (normalized.length !== 2) {
    return { ok: false, error: "File must contain exactly two columns: managerName, department" };
  }

  if (normalized[0] !== "managername" || normalized[1] !== "department") {
    return { ok: false, error: "Header must be: managerName, department" };
  }

  return { ok: true as const };
};

export const normalizeManagerName = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

export const normalizeDepartmentName = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

export const normalizeEmailBase = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");
