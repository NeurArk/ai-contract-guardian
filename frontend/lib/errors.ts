import axios from 'axios';

interface ApiErrorPayload {
  detail?: string;
  message?: string;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorPayload | undefined;
    if (data?.detail) {
      return data.detail;
    }
    if (data?.message) {
      return data.message;
    }
    if (error.message === 'Network Error') {
      return 'Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.';
    }
  }

  if (error instanceof Error) {
    if (error.message === 'Network Error') {
      return 'Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.';
    }
    return error.message;
  }

  return fallback;
}
