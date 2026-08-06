import { useQuery } from '@tanstack/react-query';
import { checkChain } from '../../api/chainIntegrity.api';
import { useSessionStore } from '../../store/session.store';

/**
 * The chain-check query shared by every step of the builder (FR-LK-11). Per the REST
 * table, this diagnostic is IE/ADMIN-only (chaincheck:read) — COST, PROC and AUDIT can
 * all view chain pages (they hold operation:read) but not this one screen, so the query
 * must stay disabled for them rather than firing and always 403ing.
 */
export function useChainCheck(styleId: string) {
  const canCheck = useSessionStore((state) => state.permissions.includes('chaincheck:read'));
  return useQuery({
    queryKey: ['chain-check', styleId],
    queryFn: () => checkChain(styleId),
    refetchOnWindowFocus: false,
    enabled: canCheck,
  });
}
