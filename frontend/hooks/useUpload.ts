'use client';

import { useState, useCallback } from 'react';
import { useContracts } from './useContracts';
import { getApiErrorMessage } from '@/lib/errors';

interface UploadState {
  progress: number;
  isUploading: boolean;
  error: Error | null;
}

export function useUpload() {
  const [uploadState, setUploadState] = useState<UploadState>({
    progress: 0,
    isUploading: false,
    error: null,
  });
  
  const { uploadContract } = useContracts();

  const upload = useCallback(
    async (file: File): Promise<{ id: string; message: string }> => {
      setUploadState({
        progress: 0,
        isUploading: true,
        error: null,
      });

      try {
        const result = await uploadContract({
          file,
          onProgress: (progress: number) => {
            setUploadState((prev) => ({ ...prev, progress }));
          },
        });

        setUploadState({
          progress: 100,
          isUploading: false,
          error: null,
        });

        return result;
      } catch (error) {
        const message = getApiErrorMessage(error, "Erreur lors de l'upload du contrat.");
        const err = new Error(message);
        setUploadState({
          progress: 0,
          isUploading: false,
          error: err,
        });
        throw err;
      }
    },
    [uploadContract]
  );

  const reset = useCallback(() => {
    setUploadState({
      progress: 0,
      isUploading: false,
      error: null,
    });
  }, []);

  return {
    ...uploadState,
    upload,
    reset,
  };
}
