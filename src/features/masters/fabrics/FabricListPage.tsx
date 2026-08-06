import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { listFabrics, setFabricActive, type Fabric } from '../../../api/fabric.api';
import { toApiError } from '../../../api/httpClient';
import { Button } from '../../../design-system/Button';
import { ConfirmDialog } from '../../../design-system/ConfirmDialog';
import { Field } from '../../../design-system/Field';
import { Select } from '../../../design-system/Select';
import { useToast } from '../../../design-system/useToast';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { useSessionStore } from '../../../store/session.store';
import styles from '../MasterList.module.css';

const ACTIVE_FILTER_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Active only' },
  { value: 'false', label: 'Inactive only' },
];

export function FabricListPage() {
  const permissions = useSessionStore((state) => state.permissions);
  const canWrite = permissions.includes('fabric:write');
  const toast = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [pendingDeactivate, setPendingDeactivate] = useState<Fabric | null>(null);
  const debouncedSearch = useDebouncedValue(search);

  const query = useQuery({
    queryKey: ['fabrics', { page, search: debouncedSearch, activeFilter }],
    queryFn: () =>
      listFabrics({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        isActive: activeFilter === '' ? undefined : activeFilter === 'true',
      }),
  });

  const setActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setFabricActive(id, isActive),
    onSuccess: (updated) => {
      toast.show(
        `${updated.code} — ${updated.description} ${updated.isActive ? 'reactivated' : 'deactivated'}.`,
        'success',
      );
      void queryClient.invalidateQueries({ queryKey: ['fabrics'] });
      setPendingDeactivate(null);
    },
    onError: (err) => toast.show(toApiError(err).message, 'danger'),
  });

  const fabrics = query.data?.data ?? [];
  const pagination = query.data?.pagination;

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h1>Fabrics</h1>
        {canWrite && (
          <Link to="/masters/fabrics/new">
            <Button variant="primary">New fabric</Button>
          </Link>
        )}
      </div>

      <div className={styles.toolbar}>
        <Field
          label="Search"
          placeholder="Code or description"
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

      {query.isLoading && <p>Loading fabrics…</p>}
      {query.isError && <p role="alert">{toApiError(query.error).message}</p>}

      {query.isSuccess && fabrics.length === 0 && (
        <div className={styles.emptyState}>
          <p>No fabrics match your filters yet.</p>
          {canWrite && (
            <Link to="/masters/fabrics/new" className={styles.emptyStateAction}>
              <Button variant="primary">Create the first fabric</Button>
            </Link>
          )}
        </div>
      )}

      {query.isSuccess && fabrics.length > 0 && (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Family</th>
                  <th>Composition</th>
                  <th className="tcms-numeric">GSM</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {fabrics.map((fabric) => (
                  <tr key={fabric.id} className={fabric.isActive ? '' : styles.inactiveRow}>
                    <td className="tcms-numeric">{fabric.code}</td>
                    <td>{fabric.description}</td>
                    <td>{fabric.family}</td>
                    <td>{fabric.composition}</td>
                    <td className="tcms-numeric">{fabric.gsm}</td>
                    <td>
                      <span className={fabric.isActive ? styles.badgeActive : styles.badgeInactive}>
                        {fabric.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        {canWrite && (
                          <>
                            <Link to={`/masters/fabrics/${fabric.id}`}>
                              <Button variant="secondary">Edit</Button>
                            </Link>
                            <Button
                              variant={fabric.isActive ? 'danger' : 'secondary'}
                              onClick={() => setPendingDeactivate(fabric)}
                            >
                              {fabric.isActive ? 'Deactivate' : 'Reactivate'}
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
        title={pendingDeactivate?.isActive ? 'Deactivate fabric' : 'Reactivate fabric'}
        message={
          pendingDeactivate
            ? pendingDeactivate.isActive
              ? `Deactivate "${pendingDeactivate.code} — ${pendingDeactivate.description}"? It will no longer appear when mapping fabrics to a style, but existing references remain unaffected.`
              : `Reactivate "${pendingDeactivate.code} — ${pendingDeactivate.description}"? It will become selectable again.`
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
