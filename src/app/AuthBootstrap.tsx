import { useEffect, type ReactNode } from 'react';
import { me, refresh } from '../api/auth.api';
import { useSessionStore } from '../store/session.store';
import { SplashScreen } from './SplashScreen';

/**
 * The access token lives only in memory (never localStorage), so a page reload loses it.
 * On mount we silently exchange the HttpOnly refresh cookie for a new access token and
 * re-fetch the profile — if that fails, there was never a valid session and we land on
 * "anonymous", which RouteGuard sends to /login.
 */
export function AuthBootstrap({ children }: { children: ReactNode }) {
  const status = useSessionStore((state) => state.status);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { accessToken } = await refresh();
        useSessionStore.getState().updateAccessToken(accessToken);
        const profile = await me();
        if (cancelled) return;
        useSessionStore.getState().setSession({
          accessToken,
          user: {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            roles: profile.roles,
            mustChangePassword: profile.mustChangePassword,
          },
          permissions: profile.permissions,
        });
      } catch {
        if (!cancelled) useSessionStore.getState().clearSession();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'loading') return <SplashScreen />;
  return <>{children}</>;
}
