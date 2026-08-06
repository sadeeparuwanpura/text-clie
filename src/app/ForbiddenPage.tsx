import styles from './ForbiddenPage.module.css';

export function ForbiddenPage() {
  return (
    <div className={styles.wrap}>
      <h1>403 — Not permitted</h1>
      <p>Your account does not hold the permission required to view this page.</p>
      <p className={styles.hint}>
        If you believe this is wrong, ask an administrator to review your assigned roles.
      </p>
    </div>
  );
}
