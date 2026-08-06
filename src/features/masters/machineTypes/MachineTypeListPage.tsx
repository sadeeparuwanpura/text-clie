import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  listMachineTypes,
  setMachineTypeActive,
  type MachineType,
} from '../../../api/machineType.api';
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

export function MachineTypeListPage() {
  const permissions = useSessionStore((state) => state.permissions);
  const canWrite = permissions.includes('machinetype:write');
  const toast = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [pendingDeactivate, setPendingDeactivate] = useState<MachineType | null>(null);
  const debouncedSearch = useDebouncedValue(search);

  const query = useQuery({
    queryKey: ['machine-types', { page, search: debouncedSearch, activeFilter }],
    queryFn: () =>
      listMachineTypes({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        isActive: activeFilter === '' ? undefined : activeFilter === 'true',
      }),
  });

  const setActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setMachineTypeActive(id, isActive),
    onSuccess: (updated) => {
      toast.show(
        `${updated.code} — ${updated.name} ${updated.isActive ? 'reactivated' : 'deactivated'}.`,
        'success',
      );
      void queryClient.invalidateQueries({ queryKey: ['machine-types'] });
      setPendingDeactivate(null);
    },
    onError: (err) => {
      toast.show(toApiError(err).message, 'danger');
    },
  });

  const machineTypes = query.data?.data ?? [];
  const pagination = query.data?.pagination;

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h1>Machine Types</h1>
        {canWrite && (
          <Link to="/masters/machine-types/new">
            <Button variant="primary">New machine type</Button>
          </Link>
        )}
      </div>

      <div className={styles.toolbar}>
        <Field
          label="Search"
          placeholder="Code, name or stitch class"
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

      {query.isLoading && <p>Loading machine types…</p>}
      {query.isError && <p role="alert">{toApiError(query.error).message}</p>}

      {query.isSuccess && machineTypes.length === 0 && (
        <div className={styles.emptyState}>
          <p>No machine types match your filters yet.</p>
          {canWrite && (
            <Link to="/masters/machine-types/new" className={styles.emptyStateAction}>
              <Button variant="primary">Create the first machine type</Button>
            </Link>
          )}
        </div>
      )}

      {query.isSuccess && machineTypes.length > 0 && (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Stitch class</th>
                  <th>Family</th>
                  <th>Thread lines</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {machineTypes.map((machineType) => (
                  <tr
                    key={machineType.id}
                    className={machineType.isActive ? '' : styles.inactiveRow}
                  >
                    <td className="tcms-numeric">{machineType.code}</td>
                    <td>{machineType.name}</td>
                    <td>{machineType.stitchClass}</td>
                    <td>{machineType.family}</td>
                    <td>
                      <div className={styles.roleChips}>
                        {machineType.threadLineTemplate
                          .filter((line) => line.included)
                          .map((line) => (
                            <span key={line.role} className={styles.roleChip}>
                              <span
                                className={styles.roleDot}
                                style={{ background: THREAD_ROLE_COLOR_VAR[line.role] }}
                                aria-hidden="true"
                              />
                              {line.role}
                            </span>
                          ))}
                      </div>
                    </td>
                    <td>
                      <span
                        className={machineType.isActive ? styles.badgeActive : styles.badgeInactive}
                      >
                        {machineType.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        {canWrite && (
                          <>
                            <Link to={`/masters/machine-types/${machineType.id}`}>
                              <Button variant="secondary">Edit</Button>
                            </Link>
                            <Button
                              variant={machineType.isActive ? 'danger' : 'secondary'}
                              onClick={() => setPendingDeactivate(machineType)}
                            >
                              {machineType.isActive ? 'Deactivate' : 'Reactivate'}
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
        title={pendingDeactivate?.isActive ? 'Deactivate machine type' : 'Reactivate machine type'}
        message={
          pendingDeactivate
            ? pendingDeactivate.isActive
              ? `Deactivate "${pendingDeactivate.code} — ${pendingDeactivate.name}"? It will no longer appear when assigning a machine type, but existing references remain unaffected.`
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
