export type ManagerIngestError = {
  row: number;
  field: string;
  error: string;
};

export type ManagerIngestSummary = {
  processed: number;
  departmentsCreated: number;
  managersCreated: number;
  failed: number;
  errors: ManagerIngestError[];
  managers: { name: string; email: string; department: string }[];
  message: string;
};
