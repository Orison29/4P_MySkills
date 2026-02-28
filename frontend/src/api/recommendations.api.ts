import { apiClient } from '../lib/api-client';
import { RecommendationItem } from '../types';

export const recommendationsApi = {
  getProjectRecommendations: async (projectId: string, topK: number = 5): Promise<{ deliverables: { deliverable: any, employees: RecommendationItem[] }[] }> => {
    const response = await apiClient.get<any>(`/projects/${projectId}/recommendations?topK=${topK}`);
    return response.data;
  },

  getDeliverableRecommendations: async (deliverableId: string, topK: number = 5): Promise<{ topEmployees: RecommendationItem[] }> => {
    const response = await apiClient.get<any>(`/deliverables/${deliverableId}/recommendations?topK=${topK}`);
    return response.data;
  },

  requestAssignment: async (deliverableId: string, employeeId: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(`/deliverables/${deliverableId}/request-assignment`, { employeeId });
    return response.data;
  }
};
