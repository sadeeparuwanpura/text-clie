import styles from './SplashScreen.module.css';

export function SplashScreen() {
  return (
    <div className={styles.splash} role="status" aria-live="polite">
      <span className={styles.mark}>TCMS</span>
      <span className={styles.label}>Loading…</span>
    </div>
  );
}
