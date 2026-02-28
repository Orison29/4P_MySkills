import { apiClient } from '../lib/api-client';

export const analyticsApi = {
  getEmployeesOverview: async (): Promise<any[]> => {
    const response = await apiClient.get<{ employees: any[] }>('/analytics/employees/overview');
    return response.data.employees;
  },
  
  getDashboardStats: async (): Promise<any> => {
    const response = await apiClient.get<any>('/analytics/dashboard-stats');
    return response.data;
  },

  getEmployeeSkillProgress: async (employeeId: string): Promise<any> => {
    const response = await apiClient.get<any>(`/analytics/employees/${employeeId}/skill-progress`);
    return response.data;
  }
};
