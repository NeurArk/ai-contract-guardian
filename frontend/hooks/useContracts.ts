'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import { contractsApi } from '@/lib/api';
import { AnalysisStatusResponse, Contract } from '@/types';

const CONTRACTS_KEY = 'contracts';

export function useContracts() {
  const queryClient = useQueryClient();

  const {
    data: contracts = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [CONTRACTS_KEY],
    queryFn: () => contractsApi.getContracts(),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: (progress: number) => void }) =>
      contractsApi.uploadContract(file, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTRACTS_KEY] });
    },
  });

  const getContract = (id: string) => {
    return useQuery({
      queryKey: [CONTRACTS_KEY, id],
      queryFn: () => contractsApi.getContract(id),
      enabled: !!id,
    });
  };

  const getContractAnalysis = (id: string, enabled = true) => {
    return useQuery({
      queryKey: [CONTRACTS_KEY, id, 'analysis'],
      queryFn: () => contractsApi.getContractAnalysis(id),
      enabled: !!id && enabled,
    });
  };

  const getContractStatus = (
    id: string,
    refetchInterval: UseQueryOptions<AnalysisStatusResponse>['refetchInterval'] = false
  ) => {
    return useQuery({
      queryKey: [CONTRACTS_KEY, id, 'status'],
      queryFn: () => contractsApi.getContractStatus(id),
      enabled: !!id,
      refetchInterval,
    });
  };

  return {
    contracts,
    isLoading,
    error,
    uploadContract: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error,
    getContract,
    getContractAnalysis,
    getContractStatus,
  };
}
