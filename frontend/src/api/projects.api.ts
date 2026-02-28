import { apiClient } from '../lib/api-client';
import { Project, Deliverable } from '../types';

export const projectsApi = {
  getProjects: async (): Promise<Project[]> => {
    const response = await apiClient.get<Project[]>('/projects');
    return response.data;
  },
  
  getProject: async (id: string): Promise<Project> => {
    const response = await apiClient.get<Project>(`/projects/${id}`);
    return response.data;
  },

  createProject: async (data: Omit<Project, 'id' | 'status' | 'createdAt'>): Promise<Project> => {
    const response = await apiClient.post<Project>('/projects', data);
    return response.data;
  },

  deleteProject: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/projects/${id}`);
    return response.data;
  },

  updateProjectStatus: async (id: string, status: string): Promise<Project> => {
    const response = await apiClient.patch<Project>(`/projects/${id}/status`, { status });
    return response.data;
  },

  analyzeProject: async (id: string, userPrompt: string): Promise<{ message: string, deliverables: Deliverable[] }> => {
    const response = await apiClient.post<{ message: string, deliverables: Deliverable[] }>(`/projects/${id}/analyze`, { userPrompt });
    return response.data;
  },

  getProjectDeliverables: async (projectId: string): Promise<Deliverable[]> => {
    const response = await apiClient.get<Deliverable[]>(`/projects/${projectId}/deliverables`);
    return response.data;
  }
};
