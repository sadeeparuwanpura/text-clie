import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { listBuyers, listSeasons, listStyleTypes } from '../../api/lookup.api';
import { toApiError } from '../../api/httpClient';
import { listStyles, STYLE_STATUSES, type StyleStatus } from '../../api/style.api';
import { Button } from '../../design-system/Button';
import { Field } from '../../design-system/Field';
import { Select } from '../../design-system/Select';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useSessionStore } from '../../store/session.store';
import styles from '../masters/MasterList.module.css';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...STYLE_STATUSES.map((s) => ({ value: s, label: s })),
];

export function StyleListPage() {
  const permissions = useSessionStore((state) => state.permissions);
  const canWrite = permissions.includes('style:write');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [buyerId, setBuyerId] = useState('');
  const [seasonId, setSeasonId] = useState('');
  const [status, setStatus] = useState('');
  const debouncedSearch = useDebouncedValue(search);

  const buyersQuery = useQuery({ queryKey: ['buyers', 'all'], queryFn: () => listBuyers(false) });
  const seasonsQuery = useQuery({
    queryKey: ['seasons', 'all'],
    queryFn: () => listSeasons(false),
  });
  const styleTypesQuery = useQuery({
    queryKey: ['style-types', 'all'],
    queryFn: () => listStyleTypes(false),
  });

  const buyerName = (id: string) => buyersQuery.data?.find((b) => b.id === id)?.name ?? id;
  const seasonName = (id: string) => seasonsQuery.data?.find((s) => s.id === id)?.name ?? id;
  const styleTypeName = (id: string) => styleTypesQuery.data?.find((t) => t.id === id)?.name ?? id;

  const query = useQuery({
    queryKey: ['styles', { page, search: debouncedSearch, buyerId, seasonId, status }],
    queryFn: () =>
      listStyles({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        buyerId: buyerId || undefined,
        seasonId: seasonId || undefined,
        status: (status || undefined) as StyleStatus | undefined,
      }),
  });

  const list = query.data?.data ?? [];
  const pagination = query.data?.pagination;

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h1>Styles</h1>
        {canWrite && (
          <Link to="/styles/new">
            <Button variant="primary">New style</Button>
          </Link>
        )}
      </div>

      <div className={styles.toolbar}>
        <Field
          label="Search"
          placeholder="Style number or name"
          wrapperClassName={styles.toolbarField}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Select
          label="Buyer"
          wrapperClassName={styles.toolbarField}
          placeholder="All buyers"
          options={(buyersQuery.data ?? []).map((b) => ({ value: b.id, label: b.name }))}
          value={buyerId}
          onChange={(e) => {
            setBuyerId(e.target.value);
            setPage(1);
          }}
        />
        <Select
          label="Season"
          wrapperClassName={styles.toolbarField}
          placeholder="All seasons"
          options={(seasonsQuery.data ?? []).map((s) => ({ value: s.id, label: s.name }))}
          value={seasonId}
          onChange={(e) => {
            setSeasonId(e.target.value);
            setPage(1);
          }}
        />
        <Select
          label="Status"
          wrapperClassName={styles.toolbarField}
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {query.isLoading && <p>Loading styles…</p>}
      {query.isError && <p role="alert">{toApiError(query.error).message}</p>}

      {query.isSuccess && list.length === 0 && (
        <div className={styles.emptyState}>
          <p>No styles match your filters yet.</p>
          {canWrite && (
            <Link to="/styles/new" className={styles.emptyStateAction}>
              <Button variant="primary">Register the first style</Button>
            </Link>
          )}
        </div>
      )}

      {query.isSuccess && list.length > 0 && (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Style No.</th>
                  <th>Name</th>
                  <th>Buyer</th>
                  <th>Season</th>
                  <th>Style type</th>
                  <th className="tcms-numeric">Order Qty</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.map((style) => (
                  <tr key={style.id}>
                    <td className="tcms-numeric">{style.styleNo}</td>
                    <td>{style.name}</td>
                    <td>{buyerName(style.buyerId)}</td>
                    <td>{seasonName(style.seasonId)}</td>
                    <td>{styleTypeName(style.styleTypeId)}</td>
                    <td className="tcms-numeric">{style.orderQty.toLocaleString()}</td>
                    <td>
                      <span className={styles.badgeActive}>{style.status}</span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Link to={`/styles/${style.id}`}>
                          <Button variant="secondary">{canWrite ? 'Edit' : 'View'}</Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <Button
                variant="secondary"
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <Button
                variant="secondary"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
