import { apiClient } from '../lib/api-client';
import { User, EmployeeProfile } from '../types';

export interface RegisterInput {
  email: string;
  password: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'HR' | 'ADMIN';
}

export interface RegisterResponse {
  id: string;
  email: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'HR' | 'ADMIN';
  createdAt: string;
}

export interface LoginResponse {
  user: User;
  profile: EmployeeProfile;
  token: string;
}

export const authApi = {
  register: async (data: RegisterInput): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>('/auth/register', data);
    return response.data;
  },

  login: async (credentials: any): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },
};
