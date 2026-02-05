'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import { LoginCredentials, RegisterCredentials } from '@/types';

export function useAuth() {
  const router = useRouter();
  const { login: storeLogin, logout: storeLogout, user, isAuthenticated, isLoading } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await authApi.login(credentials);
      return response;
    },
    onSuccess: async (data) => {
      await storeLogin(data.access_token);
      router.push('/dashboard');
    },
    // Ensure React Query stores the error so the UI can render loginError.
    onError: (err) => {
      return err;
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      const response = await authApi.register(credentials);
      // Le backend ne renvoie pas le mot de passe : on le garde pour l'auto-login.
      return { ...response, _plainPassword: credentials.password };
    },
    onSuccess: async (data: any) => {
      // Auto-login after registration
      const loginResponse = await authApi.login({
        email: data.email,
        password: data._plainPassword,
      });
      await storeLogin(loginResponse.access_token);
      router.push('/dashboard');
    },
  });

  const logout = () => {
    storeLogout();
    router.push('/login');
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    logout,
  };
}
