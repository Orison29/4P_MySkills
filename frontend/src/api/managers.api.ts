import { apiClient } from '../lib/api-client';

export type ManagerIngestSummary = {
  processed: number;
  departmentsCreated: number;
  managersCreated: number;
  failed: number;
  errors: { row: number; field: string; error: string }[];
  managers: { name: string; email: string; department: string }[];
  message: string;
};

export const managersApi = {
  ingestManagers: async (file: File): Promise<ManagerIngestSummary> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ManagerIngestSummary>('/managers/ingest', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  },
};
