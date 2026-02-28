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

export const employeeApi = {
  getMyAssignments: async (): Promise<EmployeeAssignmentsResponse> => {
    const response = await apiClient.get<EmployeeAssignmentsResponse>('/employees/me/assignments');
    return response.data;
  },
};
