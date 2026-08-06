import { create } from 'zustand';
import type { Permission } from '../types/permission';
import type { RoleCode } from '../types/roleCode';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  roles: RoleCode[];
  mustChangePassword: boolean;
}

export type SessionStatus = 'loading' | 'authenticated' | 'mustChangePassword' | 'anonymous';

interface SessionState {
  status: SessionStatus;
  accessToken: string | null;
  user: SessionUser | null;
  permissions: Permission[];
  setSession: (input: {
    accessToken: string;
    user: SessionUser;
    permissions: Permission[];
  }) => void;
  clearSession: () => void;
  updateAccessToken: (accessToken: string) => void;
}

/**
 * Server state (machine types, thread varieties) lives in TanStack Query. This store is
 * deliberately limited to session/auth/navigation concerns (FR-UI-03) — and the access
 * token lives only in memory here, never in localStorage (a page reload re-authenticates
 * via the HttpOnly refresh cookie instead, see app/providers.tsx).
 */
export const useSessionStore = create<SessionState>((set) => ({
  status: 'loading',
  accessToken: null,
  user: null,
  permissions: [],

  setSession: ({ accessToken, user, permissions }) =>
    set({
      accessToken,
      user,
      permissions,
      status: user.mustChangePassword ? 'mustChangePassword' : 'authenticated',
    }),

  clearSession: () => set({ status: 'anonymous', accessToken: null, user: null, permissions: [] }),

  updateAccessToken: (accessToken) => set({ accessToken }),
}));
