'use client';

import { useState, useCallback } from 'react';
import { useContracts } from './useContracts';

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
        const result = await uploadContract(file, (progress) => {
          setUploadState((prev) => ({ ...prev, progress }));
        });

        setUploadState({
          progress: 100,
          isUploading: false,
          error: null,
        });

        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Upload failed');
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
