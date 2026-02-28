import { apiClient } from '../lib/api-client';
import { Skill, EmployeeSkill } from '../types';

export const skillsApi = {
  getSkills: async (): Promise<Skill[]> => {
    const response = await apiClient.get<Skill[]>('/skills');
    return response.data;
  },

  createSkill: async (data: { name: string; description: string }): Promise<Skill> => {
    const response = await apiClient.post<Skill>('/skills', data);
    return response.data;
  },
};

export const employeeSkillsApi = {
  getMyRatings: async (): Promise<EmployeeSkill[]> => {
    const response = await apiClient.get<EmployeeSkill[]>('/employee-skills/my-ratings');
    return response.data;
  },

  createRating: async (data: { skillId: string; selfRating: number }): Promise<EmployeeSkill> => {
    const response = await apiClient.post<EmployeeSkill>('/employee-skills', data);
    return response.data;
  },

  updateRating: async (id: string, data: { selfRating: number }): Promise<EmployeeSkill> => {
    const response = await apiClient.patch<EmployeeSkill>(`/employee-skills/${id}`, data);
    return response.data;
  }
};
