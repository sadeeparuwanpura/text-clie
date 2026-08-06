import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { Permission } from '../types/permission';
import { useSessionStore } from '../store/session.store';
import { ForbiddenPage } from './ForbiddenPage';

export interface RouteGuardProps {
  children: ReactNode;
  /** Omit for any authenticated user; pass a permission to gate the whole route by it. */
  requiredPermission?: Permission;
}

/**
 * Server-side authorisation (authorize() middleware) is what actually protects every
 * endpoint (NFR-SE-08) — this guard is the client-side UX layer on top of that: it keeps
 * an unauthenticated user off screens they can't use, and explains *why* with a 403 page
 * rather than silently redirecting, so the difference from "not logged in" is clear.
 */
export function RouteGuard({ children, requiredPermission }: RouteGuardProps) {
  const status = useSessionStore((state) => state.status);
  const permissions = useSessionStore((state) => state.permissions);
  const location = useLocation();

  if (status === 'anonymous') {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  if (status === 'mustChangePassword' && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (requiredPermission && !permissions.includes(requiredPermission)) {
    return <ForbiddenPage />;
  }

  return <>{children}</>;
}
