export type EmployeeIngestError = {
  row: number;
  field: string;
  error: string;
};

export type EmployeeIngestRow = {
  rowNumber: number;
  name: string;
  age: number;
  department: string;
  reportsTo: string;
  project: string;
  deliverable: string;
  tasks: string[];
  skills: { name: string; rating: number }[];
};

export type EmployeeIngestSummary = {
  processed: number;
  projectsCreated: number;
  deliverablesCreated: number;
  employeesCreated: number;
  tasksCreated: number;
  failed: number;
  errors: EmployeeIngestError[];
  employees: {
    name: string;
    email: string;
    department: string;
    managerEmail: string;
    project: string;
    deliverable: string;
    tasks: string[];
  }[];
  message: string;
};
