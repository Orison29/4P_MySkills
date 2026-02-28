import { apiClient } from '../lib/api-client';
import { EmployeeSkill } from '../types';

export const managerApi = {
  getMyTeam: async (): Promise<any[]> => {
    const response = await apiClient.get<any[]>('/employees/my-team');
    return response.data;
  },

  getPendingSkillReviews: async (): Promise<EmployeeSkill[]> => {
    const response = await apiClient.get<EmployeeSkill[]>('/employee-skills/pending');
    return response.data;
  },

  reviewSkillRating: async (id: string, data: { action: 'APPROVE' | 'EDIT' | 'REJECT', approvedRating?: number, reviewComment?: string }): Promise<EmployeeSkill> => {
    const response = await apiClient.patch<EmployeeSkill>(`/employee-skills/${id}/review`, data);
    return response.data;
  },

  getPendingAssignments: async (): Promise<AssignmentRequest[]> => {
    const response = await apiClient.get<AssignmentRequest[]>('/assignment-requests/pending');
    return response.data;
  },

  reviewAssignment: async (id: string, action: 'APPROVE' | 'REJECT'): Promise<{ message: string }> => {
    const response = await apiClient.patch<{ message: string }>(`/assignment-requests/${id}/review`, { action });
    return response.data;
  }
};

// Extend types to include AssignmentRequest
export type AssignmentRequest = {
  id: string;
  employeeId: string;
  projectId: string;
  deliverableId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  employee?: { fullname: string };
  project?: { name: string };
  deliverable?: { name: string };
  requestedByAdmin?: { profile?: { fullname: string } };
  createdAt: string;
};
