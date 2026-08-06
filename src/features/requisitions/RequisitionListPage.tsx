import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toApiError } from '../../api/httpClient';
import { listRequisitions, type RequisitionStatus } from '../../api/purchaseRequisition.api';
import { Button } from '../../design-system/Button';
import { Select } from '../../design-system/Select';
import styles from './Requisition.module.css';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'Open', label: 'Open' },
  { value: 'Raised', label: 'Raised' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const BADGE_CLASS: Record<RequisitionStatus, string> = {
  Open: styles.badgeOpen,
  Raised: styles.badgeRaised,
  Cancelled: styles.badgeCancelled,
};

export function RequisitionListPage() {
  const [status, setStatus] = useState('');

  const query = useQuery({
    queryKey: ['requisitions', { status }],
    queryFn: () =>
      listRequisitions({
        limit: 50,
        status: (status || undefined) as RequisitionStatus | undefined,
      }),
  });

  const list = query.data?.data ?? [];

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h1>Purchase requisitions</h1>
      </div>

      <div className={styles.toolbar}>
        <Select
          label="Status"
          wrapperClassName={styles.toolbarField}
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        />
      </div>

      {query.isLoading && <p>Loading requisitions…</p>}
      {query.isError && <p role="alert">{toApiError(query.error).message}</p>}

      {query.isSuccess && list.length === 0 && (
        <div className={styles.emptyState}>
          <p>
            No requisitions yet — generate one from an Approved estimate's <em>Estimate</em> tab.
          </p>
        </div>
      )}

      {query.isSuccess && list.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Req No.</th>
                <th>Status</th>
                <th>Required by</th>
                <th className="tcms-numeric">Total value</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((req) => (
                <tr key={req.id}>
                  <td className="tcms-numeric">{req.reqNo}</td>
                  <td>
                    <span className={BADGE_CLASS[req.status]}>{req.status}</span>
                  </td>
                  <td>{new Date(req.requiredBy).toLocaleDateString()}</td>
                  <td className="tcms-numeric">
                    {req.lines[0]?.currency ?? ''} {req.totalValue.toFixed(2)}
                  </td>
                  <td>
                    <Link to={`/requisitions/${req.id}`}>
                      <Button variant="secondary">View</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
