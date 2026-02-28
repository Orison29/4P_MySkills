import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, EmployeeProfile } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  profile: EmployeeProfile | null;
  isAuthenticated: boolean;
  login: (token: string, user: User, profile: EmployeeProfile) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      profile: null,
      isAuthenticated: false,
      login: (token, user, profile) =>
        set({ token, user, profile, isAuthenticated: true }),
      logout: () =>
        set({ token: null, user: null, profile: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
