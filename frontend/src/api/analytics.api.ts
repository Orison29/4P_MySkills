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
  },

  getSkillSpectrumByDepartment: async (skillId: string): Promise<any> => {
    const response = await apiClient.get<any>(`/analytics/skill-spectrum?skillId=${skillId}`);
    return response.data;
  },

  getLearningSpeed: async (startDate?: string, endDate?: string): Promise<any> => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get<any>(`/analytics/learning-speed${query}`);
    return response.data;
  }
};
