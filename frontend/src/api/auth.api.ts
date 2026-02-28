import { apiClient } from '../lib/api-client';
import { User, EmployeeProfile } from '../types';

export interface LoginResponse {
  user: User;
  profile: EmployeeProfile;
  token: string;
}

export const authApi = {
  login: async (credentials: any): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },
};
