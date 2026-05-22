import { apiClient } from '../lib/api-client';

export interface EmployeeAssignment {
  id: string;
  projectId: string;
  deliverableId: string;
  employeeId: string;
  assignedAt: string;
  releasedAt: string | null;
  project: {
    id: string;
    name: string;
    status: string;
  };
  deliverable: {
    id: string;
    title: string;
    description: string;
  };
}

export interface EmployeeAssignmentsResponse {
  active: EmployeeAssignment[];
  past: EmployeeAssignment[];
}

export type EmployeeIngestSummary = {
  processed: number;
  projectsCreated: number;
  deliverablesCreated: number;
  employeesCreated: number;
  tasksCreated: number;
  failed: number;
  errors: { row: number; field: string; error: string }[];
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

export type EmployeeTask = {
  id: string;
  title: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  project: { id: string; name: string };
  deliverable: { id: string; name: string };
};

export type EmployeeProfileResponse = {
  id: string;
  fullname: string;
  department: { id: string; name: string };
  manager: {
    id: string;
    fullname: string;
    department: { id: string; name: string };
    user: { email: string } | null;
  } | null;
};

export const employeeApi = {
  getMyAssignments: async (): Promise<EmployeeAssignmentsResponse> => {
    const response = await apiClient.get<EmployeeAssignmentsResponse>('/employees/me/assignments');
    return response.data;
  },
  getMyProfile: async (): Promise<EmployeeProfileResponse> => {
    const response = await apiClient.get<EmployeeProfileResponse>('/employees/me/profile');
    return response.data;
  },
  getMyTasks: async (): Promise<EmployeeTask[]> => {
    const response = await apiClient.get<EmployeeTask[]>('/tasks/me');
    return response.data;
  },
  updateTaskStatus: async (taskId: string, status: EmployeeTask['status']): Promise<EmployeeTask> => {
    const response = await apiClient.patch<EmployeeTask>(`/tasks/${taskId}/status`, { status });
    return response.data;
  },
  ingestEmployees: async (file: File): Promise<EmployeeIngestSummary> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<EmployeeIngestSummary>('/employees/ingest', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  },
};
