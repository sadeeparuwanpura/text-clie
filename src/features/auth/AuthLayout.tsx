import type { ReactNode } from 'react';
import styles from './AuthLayout.module.css';

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.wordmark}>TCMS</div>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        {children}
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}
