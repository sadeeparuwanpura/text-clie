import { useSessionStore } from '../../store/session.store';
import styles from './DashboardPage.module.css';

/**
 * Role-appropriate dashboards (FR-DB-01 to 04) arrive with the phases that give each role
 * something to act on — an IE's estimate queue doesn't exist until P3/P4, an approval
 * queue doesn't exist until P4, etc. This is deliberately just a landing point for now,
 * not a stub pretending to be finished.
 */
export function DashboardPage() {
  const user = useSessionStore((state) => state.user);

  return (
    <div className={styles.card}>
      <h1>Welcome{user ? `, ${user.name}` : ''}</h1>
      <p>You are signed in with the following role{user && user.roles.length > 1 ? 's' : ''}:</p>
      <div className={styles.roleList}>
        {user?.roles.map((role) => (
          <span key={role} className={styles.roleChip}>
            {role}
          </span>
        ))}
      </div>
      <p className={styles.note}>
        Role-specific work queues (estimate pipelines, approval queues, requisition summaries)
        arrive with later phases. For now, use the navigation above for the master data this phase
        covers.
      </p>
    </div>
  );
}
