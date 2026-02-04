import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { authApi } from './api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  login: (token: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => {
        set({ token });
        if (token) {
          localStorage.setItem('token', token);
        } else {
          localStorage.removeItem('token');
        }
      },
      setIsLoading: (isLoading) => set({ isLoading }),

      login: async (token: string) => {
        localStorage.setItem('token', token);
        set({ token, isAuthenticated: true });
        await get().fetchUser();
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      fetchUser: async () => {
        try {
          set({ isLoading: true });
          const user = await authApi.getMe();
          set({ user, isAuthenticated: true });
        } catch (error) {
          console.error('Failed to fetch user:', error);
          localStorage.removeItem('token');
          set({ user: null, token: null, isAuthenticated: false });
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);

// Initialize auth state from storage
export const initializeAuth = () => {
  const token = localStorage.getItem('token');
  if (token) {
    useAuthStore.getState().setToken(token);
    useAuthStore.getState().fetchUser();
  } else {
    useAuthStore.getState().setIsLoading(false);
  }
};
