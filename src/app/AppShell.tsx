import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { logout as logoutApi } from '../api/auth.api';
import { useSessionStore } from '../store/session.store';
import type { Permission } from '../types/permission';
import styles from './AppShell.module.css';

interface NavItem {
  label: string;
  to: string;
  permission?: Permission;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/', end: true },
  { label: 'Styles', to: '/styles', permission: 'style:read' },
  { label: 'Fabrics', to: '/masters/fabrics', permission: 'fabric:read' },
  { label: 'Machine Types', to: '/masters/machine-types', permission: 'machinetype:read' },
  { label: 'Thread Varieties', to: '/masters/thread-varieties', permission: 'threadvariety:read' },
];

/**
 * The nav is filtered by the permission set from /auth/me (FR-UI-06) — but that's a
 * usability courtesy, not access control. Every route it links to is independently gated
 * by RouteGuard, and every endpoint behind it by the server's own authorize() middleware.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const user = useSessionStore((state) => state.user);
  const permissions = useSessionStore((state) => state.permissions);
  const clearSession = useSessionStore((state) => state.clearSession);
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.permission || permissions.includes(item.permission),
  );

  async function handleLogout() {
    try {
      await logoutApi();
    } finally {
      clearSession();
      navigate('/login', { replace: true });
    }
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <span className={styles.wordmark}>TCMS</span>
        <nav className={styles.nav} aria-label="Primary">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        {user && (
          <div className={styles.userArea}>
            <div>
              <div className={styles.userName}>{user.name}</div>
              <div className={styles.userRole}>{user.roles.join(', ')}</div>
            </div>
            <button type="button" className={styles.logout} onClick={handleLogout}>
              Log out
            </button>
          </div>
        )}
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
