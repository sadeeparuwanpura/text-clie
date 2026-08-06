import { useQuery } from '@tanstack/react-query';
import { checkChain } from '../../api/chainIntegrity.api';

/** The chain-check query shared by every step of the builder (FR-LK-11). */
export function useChainCheck(styleId: string) {
  return useQuery({
    queryKey: ['chain-check', styleId],
    queryFn: () => checkChain(styleId),
    refetchOnWindowFocus: false,
  });
}
