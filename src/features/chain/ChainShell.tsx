import { useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { getStyle } from '../../api/style.api';
import styles from './Chain.module.css';
import { useChainCheck } from './useChainCheck';

const ISSUE_LABELS: Record<
  string,
  (i: { operation?: string; role?: string; colourway?: string }) => string
> = {
  OPERATION_NO_MACHINE: (i) => `"${i.operation}" has no machine type assigned.`,
  LINE_NO_FACTOR: (i) => `"${i.operation}" — ${i.role} has no consumption factor.`,
  ROLE_UNASSIGNED: (i) => `${i.role} is used but has no thread assignment.`,
  SHADE_MISSING: (i) => `${i.role} has no shade for colourway "${i.colourway}".`,
};

export function ChainShell({
  styleId,
  active,
  children,
}: {
  styleId: string;
  active: 'operations' | 'machine-types' | 'thread-lines' | 'thread-varieties' | 'estimate';
  children: ReactNode;
}) {
  const styleQuery = useQuery({ queryKey: ['style', styleId], queryFn: () => getStyle(styleId) });
  const chainCheck = useChainCheck(styleId);
  const [showIssues, setShowIssues] = useState(false);

  const tabs = [
    { key: 'operations', label: 'Operations', to: `/styles/${styleId}/chain/operations` },
    { key: 'machine-types', label: 'Machine Types', to: `/styles/${styleId}/chain/machine-types` },
    { key: 'thread-lines', label: 'Machine Include', to: `/styles/${styleId}/chain/thread-lines` },
    {
      key: 'thread-varieties',
      label: 'Thread Varieties',
      to: `/styles/${styleId}/chain/thread-varieties`,
    },
    { key: 'estimate', label: 'Estimate', to: `/styles/${styleId}/chain/estimate` },
  ] as const;

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <Link to={`/styles/${styleId}`} className={styles.backLink}>
            ← {styleQuery.data?.styleNo ?? 'Style'}
          </Link>
          <h1 className={styles.title}>{styleQuery.data?.name ?? '…'}</h1>
        </div>
        {chainCheck.data && (
          <button
            type="button"
            className={chainCheck.data.ok ? styles.chainOk : styles.chainIssues}
            onClick={() => setShowIssues((v) => !v)}
          >
            {chainCheck.data.ok
              ? 'Chain complete'
              : `${chainCheck.data.issues.length} chain issue${chainCheck.data.issues.length === 1 ? '' : 's'}`}
          </button>
        )}
      </div>

      {showIssues && chainCheck.data && !chainCheck.data.ok && (
        <div className={styles.issuesPanel} role="alert">
          <strong>The chain is incomplete (FR-LK-11):</strong>
          <ul className={styles.issuesList}>
            {chainCheck.data.issues.map((issue, idx) => (
              <li key={idx}>{ISSUE_LABELS[issue.type]?.(issue) ?? issue.type}</li>
            ))}
          </ul>
        </div>
      )}

      <nav className={styles.tabs} aria-label="Chain steps">
        {tabs.map((tab) => (
          <NavLink
            key={tab.key}
            to={tab.to}
            className={tab.key === active ? styles.tabActive : styles.tab}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      {children}
    </div>
  );
}
