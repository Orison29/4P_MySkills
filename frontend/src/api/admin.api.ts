import { apiClient } from '../lib/api-client';
import { Department, EmployeeProfile } from '../types';

export const adminApi = {
  createDepartment: async (name: string): Promise<Department> => {
    const response = await apiClient.post<Department>('/departments', { name });
    return response.data;
  },
  
  getDepartments: async (): Promise<Department[]> => {
    const response = await apiClient.get<Department[]>('/departments');
    return response.data;
  },

  deleteDepartment: async (departmentId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/departments/${departmentId}`);
    return response.data;
  },

  registerUser: async (data: any): Promise<any> => {
    const response = await apiClient.post<any>('/auth/register', data);
    return response.data;
  },

  createEmployeeProfile: async (data: { userId: string, fullname: string, departmentId: string }): Promise<EmployeeProfile> => {
    const response = await apiClient.post<EmployeeProfile>('/employees', data);
    return response.data;
  },

  assignManager: async (employeeId: string, managerId: string): Promise<any> => {
    const response = await apiClient.patch<any>(`/employees/${employeeId}/assign-manager`, { managerId });
    return response.data;
  },

  changeUserRole: async (employeeId: string, role: string): Promise<any> => {
    const response = await apiClient.patch<any>(`/employees/${employeeId}/role`, { role });
    return response.data;
  },

  deleteUser: async (employeeId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/employees/${employeeId}`);
    return response.data;
  }
};
