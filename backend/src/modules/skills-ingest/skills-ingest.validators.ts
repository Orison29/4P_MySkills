const normalizeHeader = (value: string) => value.replace(/^\uFEFF/, "").trim().toLowerCase();

export const validateSkillsHeader = (headerRow: string[]) => {
  if (headerRow.length !== 1) {
    return { ok: false, error: "File must contain exactly one column named Skills" };
  }

  const header = normalizeHeader(headerRow[0] ?? "");
  if (header !== "skills") {
    return { ok: false, error: "Header must be Skills" };
  }

  return { ok: true as const };
};

export const normalizeSkillName = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};
