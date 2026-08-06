import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  listThreadVarieties,
  setThreadVarietyActive,
  type ThreadVariety,
} from '../../../api/threadVariety.api';
import { toApiError } from '../../../api/httpClient';
import { Button } from '../../../design-system/Button';
import { ConfirmDialog } from '../../../design-system/ConfirmDialog';
import { Field } from '../../../design-system/Field';
import { Select } from '../../../design-system/Select';
import { useToast } from '../../../design-system/useToast';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { useSessionStore } from '../../../store/session.store';
import { THREAD_ROLE_COLOR_VAR } from '../../../types/threadLineRole';
import styles from '../MasterList.module.css';

const ACTIVE_FILTER_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Active only' },
  { value: 'false', label: 'Inactive only' },
];

export function ThreadVarietyListPage() {
  const permissions = useSessionStore((state) => state.permissions);
  const canWrite = permissions.includes('threadvariety:write');
  const toast = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [pendingDeactivate, setPendingDeactivate] = useState<ThreadVariety | null>(null);
  const debouncedSearch = useDebouncedValue(search);

  const query = useQuery({
    queryKey: ['thread-varieties', { page, search: debouncedSearch, activeFilter }],
    queryFn: () =>
      listThreadVarieties({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        isActive: activeFilter === '' ? undefined : activeFilter === 'true',
      }),
  });

  const setActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setThreadVarietyActive(id, isActive),
    onSuccess: (updated) => {
      toast.show(
        `${updated.code} — ${updated.name} ${updated.isActive ? 'reactivated' : 'deactivated'}.`,
        'success',
      );
      void queryClient.invalidateQueries({ queryKey: ['thread-varieties'] });
      setPendingDeactivate(null);
    },
    onError: (err) => toast.show(toApiError(err).message, 'danger'),
  });

  const varieties = query.data?.data ?? [];
  const pagination = query.data?.pagination;

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h1>Thread Varieties</h1>
        {canWrite && (
          <Link to="/masters/thread-varieties/new">
            <Button variant="primary">New thread variety</Button>
          </Link>
        )}
      </div>

      <div className={styles.toolbar}>
        <Field
          label="Search"
          placeholder="Code or name"
          wrapperClassName={styles.toolbarField}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Select
          label="Status"
          wrapperClassName={styles.toolbarField}
          options={ACTIVE_FILTER_OPTIONS}
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {query.isLoading && <p>Loading thread varieties…</p>}
      {query.isError && <p role="alert">{toApiError(query.error).message}</p>}

      {query.isSuccess && varieties.length === 0 && (
        <div className={styles.emptyState}>
          <p>No thread varieties match your filters yet.</p>
          {canWrite && (
            <Link to="/masters/thread-varieties/new" className={styles.emptyStateAction}>
              <Button variant="primary">Create the first thread variety</Button>
            </Link>
          )}
        </div>
      )}

      {query.isSuccess && varieties.length > 0 && (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Construction</th>
                  <th>Fibre</th>
                  <th>Recommended roles</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {varieties.map((variety) => (
                  <tr key={variety.id} className={variety.isActive ? '' : styles.inactiveRow}>
                    <td className="tcms-numeric">{variety.code}</td>
                    <td>{variety.name}</td>
                    <td>{variety.construction}</td>
                    <td>{variety.fibre}</td>
                    <td>
                      <div className={styles.roleChips}>
                        {variety.recommendedRoles.map((role) => (
                          <span key={role} className={styles.roleChip}>
                            <span
                              className={styles.roleDot}
                              style={{ background: THREAD_ROLE_COLOR_VAR[role] }}
                              aria-hidden="true"
                            />
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span
                        className={variety.isActive ? styles.badgeActive : styles.badgeInactive}
                      >
                        {variety.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        {canWrite && (
                          <>
                            <Link to={`/masters/thread-varieties/${variety.id}`}>
                              <Button variant="secondary">Edit</Button>
                            </Link>
                            <Button
                              variant={variety.isActive ? 'danger' : 'secondary'}
                              onClick={() => setPendingDeactivate(variety)}
                            >
                              {variety.isActive ? 'Deactivate' : 'Reactivate'}
                            </Button>
                          </>
                        )}
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

      <ConfirmDialog
        open={pendingDeactivate !== null}
        title={
          pendingDeactivate?.isActive ? 'Deactivate thread variety' : 'Reactivate thread variety'
        }
        message={
          pendingDeactivate
            ? pendingDeactivate.isActive
              ? `Deactivate "${pendingDeactivate.code} — ${pendingDeactivate.name}"? It will no longer appear when assigning a thread variety, but existing references remain unaffected.`
              : `Reactivate "${pendingDeactivate.code} — ${pendingDeactivate.name}"? It will become selectable again.`
            : ''
        }
        confirmLabel={pendingDeactivate?.isActive ? 'Deactivate' : 'Reactivate'}
        danger={pendingDeactivate?.isActive}
        loading={setActiveMutation.isPending}
        onConfirm={() =>
          pendingDeactivate &&
          setActiveMutation.mutate({
            id: pendingDeactivate.id,
            isActive: !pendingDeactivate.isActive,
          })
        }
        onCancel={() => setPendingDeactivate(null)}
      />
    </div>
  );
}
