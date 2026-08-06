import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { listMachineTypes, type MachineType } from '../../api/machineType.api';
import { toApiError } from '../../api/httpClient';
import { assignMachineType, assignMachineTypeBulk, listOperations } from '../../api/operation.api';
import { Button } from '../../design-system/Button';
import { ConfirmDialog } from '../../design-system/ConfirmDialog';
import { Select } from '../../design-system/Select';
import { useToast } from '../../design-system/useToast';
import { useSessionStore } from '../../store/session.store';
import { THREAD_ROLE_COLOR_VAR } from '../../types/threadLineRole';
import { ChainShell } from './ChainShell';
import styles from './Chain.module.css';

interface PendingAssignment {
  operationIds: string[];
  machineTypeId: string;
}

export function MachineTypeAssignPage() {
  const { id: styleId } = useParams<{ id: string }>();
  const toast = useToast();
  const queryClient = useQueryClient();
  const permissions = useSessionStore((state) => state.permissions);
  const canEdit = permissions.includes('operation:write');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkMachineTypeId, setBulkMachineTypeId] = useState('');
  const [pending, setPending] = useState<PendingAssignment | null>(null);

  const opsQuery = useQuery({
    queryKey: ['operations', styleId],
    queryFn: () => listOperations(styleId!),
    enabled: Boolean(styleId),
  });
  const machineTypesQuery = useQuery({
    queryKey: ['machine-types', 'all-active'],
    queryFn: () => listMachineTypes({ limit: 200, isActive: true }),
  });

  const machineTypeById = new Map((machineTypesQuery.data?.data ?? []).map((m) => [m.id, m]));

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ['operations', styleId] });
    void queryClient.invalidateQueries({ queryKey: ['chain-check', styleId] });
    void queryClient.invalidateQueries({ queryKey: ['thread-assignments', styleId] });
  }

  const assignOne = useMutation({
    mutationFn: ({
      operationId,
      machineTypeId,
      confirm,
    }: {
      operationId: string;
      machineTypeId: string;
      confirm: boolean;
    }) => assignMachineType(operationId, machineTypeId, confirm),
    onSuccess: () => {
      invalidate();
      setPending(null);
    },
    onError: (err) => {
      const apiErr = toApiError(err);
      if (
        (apiErr.details as { requiresConfirmation?: boolean } | undefined)?.requiresConfirmation
      ) {
        return; // handled by the caller via a confirm dialog
      }
      toast.show(apiErr.message, 'danger');
      setPending(null);
    },
  });

  const assignBulk = useMutation({
    mutationFn: ({
      operationIds,
      machineTypeId,
      confirm,
    }: {
      operationIds: string[];
      machineTypeId: string;
      confirm: boolean;
    }) => assignMachineTypeBulk(operationIds, machineTypeId, confirm),
    onSuccess: () => {
      invalidate();
      setPending(null);
      setSelected(new Set());
      toast.show('Machine type applied.', 'success');
    },
    onError: (err, variables) => {
      const apiErr = toApiError(err);
      if (
        (apiErr.details as { requiresConfirmation?: boolean } | undefined)?.requiresConfirmation
      ) {
        setPending({
          operationIds: variables.operationIds,
          machineTypeId: variables.machineTypeId,
        });
        return;
      }
      toast.show(apiErr.message, 'danger');
      setPending(null);
    },
  });

  if (!styleId) return null;
  const rows = opsQuery.data?.data ?? [];

  async function tryAssignOne(operationId: string, machineTypeId: string) {
    try {
      await assignMachineType(operationId, machineTypeId, false);
      invalidate();
    } catch (err) {
      const apiErr = toApiError(err);
      if (
        (apiErr.details as { requiresConfirmation?: boolean } | undefined)?.requiresConfirmation
      ) {
        setPending({ operationIds: [operationId], machineTypeId });
      } else {
        toast.show(apiErr.message, 'danger');
      }
    }
  }

  function applyBulk() {
    if (!bulkMachineTypeId || selected.size === 0) return;
    assignBulk.mutate({
      operationIds: Array.from(selected),
      machineTypeId: bulkMachineTypeId,
      confirm: false,
    });
  }

  return (
    <ChainShell styleId={styleId} active="machine-types">
      {canEdit && (
        <div className={styles.card}>
          <div className={styles.toolbar}>
            <Select
              label="Apply machine type to selected"
              wrapperClassName={styles.toolbarField}
              placeholder="Select a machine type"
              options={(machineTypesQuery.data?.data ?? []).map((m) => ({
                value: m.id,
                label: `${m.code} — ${m.name}`,
              }))}
              value={bulkMachineTypeId}
              onChange={(e) => setBulkMachineTypeId(e.target.value)}
            />
            <Button
              variant="primary"
              onClick={applyBulk}
              disabled={selected.size === 0 || !bulkMachineTypeId}
              loading={assignBulk.isPending}
            >
              Apply to {selected.size || ''} selected
            </Button>
          </div>
        </div>
      )}

      {opsQuery.isSuccess && rows.length === 0 && (
        <div className={styles.emptyState}>
          <p>No operations yet — add operations first, on the Operations tab.</p>
        </div>
      )}

      {opsQuery.isSuccess && rows.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {canEdit && <th></th>}
                <th>#</th>
                <th>Operation</th>
                <th>Machine type</th>
                <th>Stitch class</th>
                <th>Thread lines</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((op) => {
                const machine: MachineType | undefined = op.machineTypeId
                  ? machineTypeById.get(op.machineTypeId)
                  : undefined;
                const includedLines = op.threadLines.filter((l) => l.included);
                return (
                  <tr key={op.id}>
                    {canEdit && (
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Select ${op.name}`}
                          checked={selected.has(op.id)}
                          onChange={(e) => {
                            const next = new Set(selected);
                            if (e.target.checked) next.add(op.id);
                            else next.delete(op.id);
                            setSelected(next);
                          }}
                        />
                      </td>
                    )}
                    <td className="tcms-numeric">{op.sequence}</td>
                    <td>{op.name}</td>
                    <td>
                      <select
                        className={styles.cellSelect}
                        disabled={!canEdit}
                        value={op.machineTypeId ?? ''}
                        aria-label={`Machine type for ${op.name}`}
                        onChange={(e) => e.target.value && tryAssignOne(op.id, e.target.value)}
                      >
                        <option value="">Select a machine type</option>
                        {(machineTypesQuery.data?.data ?? []).map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.code} — {m.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{machine?.stitchClass ?? '—'}</td>
                    <td>
                      <div className={styles.roleChips}>
                        {includedLines.length === 0 && '—'}
                        {includedLines.map((l) => (
                          <span key={l.role} className={styles.roleChip}>
                            <span
                              className={styles.roleDot}
                              style={{ background: THREAD_ROLE_COLOR_VAR[l.role] }}
                              aria-hidden="true"
                            />
                            {l.role}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={pending !== null}
        title="Replace thread line overrides?"
        message="This operation has manually edited thread line counts or factors (FR-MT-04). Changing its machine type replaces them with the new template's defaults — the overrides will be lost."
        confirmLabel="Change machine type"
        danger
        loading={assignOne.isPending || assignBulk.isPending}
        onConfirm={() => {
          if (!pending) return;
          if (pending.operationIds.length === 1) {
            assignOne.mutate({
              operationId: pending.operationIds[0],
              machineTypeId: pending.machineTypeId,
              confirm: true,
            });
          } else {
            assignBulk.mutate({
              operationIds: pending.operationIds,
              machineTypeId: pending.machineTypeId,
              confirm: true,
            });
          }
        }}
        onCancel={() => setPending(null)}
      />
    </ChainShell>
  );
}
