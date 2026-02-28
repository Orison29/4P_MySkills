import { apiClient } from '../lib/api-client';
import { Deliverable, DeliverableSkill } from '../types';

export const deliverablesApi = {
  createDeliverable: async (projectId: string, data: { name: string, description: string }): Promise<Deliverable> => {
    const response = await apiClient.post<Deliverable>(`/projects/${projectId}/deliverables`, data);
    return response.data;
  },

  updateDeliverable: async (id: string, data: { name?: string, description?: string }): Promise<Deliverable> => {
    const response = await apiClient.patch<Deliverable>(`/deliverables/${id}`, data);
    return response.data;
  },

  deleteDeliverable: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/deliverables/${id}`);
    return response.data;
  },
  
  getDeliverable: async (id: string): Promise<Deliverable> => {
    const response = await apiClient.get<Deliverable>(`/deliverables/${id}`);
    return response.data;
  }
};

export const deliverableSkillsApi = {
  addSkill: async (deliverableId: string, skillId: string, weight: number): Promise<DeliverableSkill> => {
    const response = await apiClient.post<DeliverableSkill>(`/deliverables/${deliverableId}/skills`, { skillId, weight });
    return response.data;
  },

  updateSkillWeight: async (deliverableId: string, skillId: string, weight: number): Promise<DeliverableSkill> => {
    const response = await apiClient.patch<DeliverableSkill>(`/deliverables/${deliverableId}/skills/${skillId}`, { weight });
    return response.data;
  },

  removeSkill: async (deliverableId: string, skillId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/deliverables/${deliverableId}/skills/${skillId}`);
    return response.data;
  }
};
