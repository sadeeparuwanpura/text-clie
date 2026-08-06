import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toApiError } from '../../api/httpClient';
import {
  listOperations,
  resetThreadLines,
  updateThreadLines,
  type Operation,
  type ThreadLineInput,
} from '../../api/operation.api';
import { Button } from '../../design-system/Button';
import { useToast } from '../../design-system/useToast';
import { useSessionStore } from '../../store/session.store';
import { THREAD_LINE_ROLES, THREAD_ROLE_COLOR_VAR } from '../../types/threadLineRole';
import { ChainShell } from './ChainShell';
import styles from './Chain.module.css';

function toEditableLines(op: Operation): ThreadLineInput[] {
  const byRole = new Map(op.threadLines.map((l) => [l.role, l]));
  return THREAD_LINE_ROLES.map((role) => {
    const existing = byRole.get(role);
    return {
      role,
      included: existing?.included ?? false,
      count: existing?.count ?? 0,
      factor: existing?.factor ?? 0,
    };
  });
}

export function MachineIncludePage() {
  const { id: styleId } = useParams<{ id: string }>();
  const toast = useToast();
  const queryClient = useQueryClient();
  const permissions = useSessionStore((state) => state.permissions);
  const canEdit = permissions.includes('threadline:write');
  const [selectedOpId, setSelectedOpId] = useState<string | null>(null);
  const [lines, setLines] = useState<ThreadLineInput[]>([]);

  const opsQuery = useQuery({
    queryKey: ['operations', styleId],
    queryFn: () => listOperations(styleId!),
    enabled: Boolean(styleId),
  });

  const rows = opsQuery.data?.data ?? [];
  const assignable = rows.filter((op) => op.machineTypeId);
  const selectedOp = rows.find((op) => op.id === selectedOpId) ?? null;

  useEffect(() => {
    if (selectedOp) setLines(toEditableLines(selectedOp));
  }, [selectedOp]);

  useEffect(() => {
    if (!selectedOpId && assignable.length > 0) setSelectedOpId(assignable[0].id);
  }, [assignable, selectedOpId]);

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ['operations', styleId] });
    void queryClient.invalidateQueries({ queryKey: ['chain-check', styleId] });
    void queryClient.invalidateQueries({ queryKey: ['thread-assignments', styleId] });
  }

  const saveMutation = useMutation({
    mutationFn: () => updateThreadLines(selectedOpId!, lines),
    onSuccess: () => {
      invalidate();
      toast.show('Thread lines saved.', 'success');
    },
    onError: (err) => toast.show(toApiError(err).message, 'danger'),
  });

  const resetMutation = useMutation({
    mutationFn: () => resetThreadLines(selectedOpId!),
    onSuccess: () => {
      invalidate();
      toast.show('Reset to the machine type template.', 'success');
    },
    onError: (err) => toast.show(toApiError(err).message, 'danger'),
  });

  if (!styleId) return null;

  function updateLine(role: string, patch: Partial<ThreadLineInput>) {
    setLines((prev) => prev.map((l) => (l.role === role ? { ...l, ...patch } : l)));
  }

  return (
    <ChainShell styleId={styleId} active="thread-lines">
      {assignable.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No operations have a machine type yet — assign one first, on the Machine Types tab.</p>
        </div>
      ) : (
        <div
          style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 'var(--tcms-space-5)' }}
        >
          <div className={styles.tableWrap}>
            <table className={styles.table} style={{ minWidth: 0 }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Operation</th>
                </tr>
              </thead>
              <tbody>
                {assignable.map((op) => (
                  <tr
                    key={op.id}
                    onClick={() => setSelectedOpId(op.id)}
                    style={{
                      cursor: 'pointer',
                      background: op.id === selectedOpId ? 'var(--tcms-workspace)' : undefined,
                    }}
                  >
                    <td className="tcms-numeric">{op.sequence}</td>
                    <td>{op.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedOp && (
            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>
                {selectedOp.name} — thread lines (FR-MI-01 to 07)
              </h2>
              <div className={styles.tableWrap}>
                <table className={styles.table} style={{ minWidth: 0 }}>
                  <thead>
                    <tr>
                      <th></th>
                      <th>Role</th>
                      <th>Count</th>
                      <th>Factor (m/m seam @ 10 SPI)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line) => (
                      <tr key={line.role}>
                        <td>
                          <input
                            type="checkbox"
                            aria-label={`Include ${line.role}`}
                            checked={line.included}
                            disabled={!canEdit}
                            onChange={(e) => updateLine(line.role, { included: e.target.checked })}
                          />
                        </td>
                        <td>
                          <span className={styles.roleChip}>
                            <span
                              className={styles.roleDot}
                              style={{ background: THREAD_ROLE_COLOR_VAR[line.role] }}
                              aria-hidden="true"
                            />
                            {line.role}
                          </span>
                        </td>
                        <td>
                          <input
                            className={styles.cellInput}
                            type="number"
                            min={0}
                            step={1}
                            disabled={!canEdit || !line.included}
                            value={line.count}
                            aria-label={`${line.role} count`}
                            onChange={(e) =>
                              updateLine(line.role, { count: Number(e.target.value) })
                            }
                          />
                        </td>
                        <td>
                          <input
                            className={styles.cellInput}
                            type="number"
                            min={0}
                            step={0.01}
                            disabled={!canEdit || !line.included}
                            value={line.factor}
                            aria-label={`${line.role} factor`}
                            onChange={(e) =>
                              updateLine(line.role, { factor: Number(e.target.value) })
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {canEdit && (
                <div className={styles.actions} style={{ marginTop: 'var(--tcms-space-4)' }}>
                  <Button
                    variant="primary"
                    onClick={() => saveMutation.mutate()}
                    loading={saveMutation.isPending}
                  >
                    Save
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => resetMutation.mutate()}
                    loading={resetMutation.isPending}
                  >
                    Reset to template
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </ChainShell>
  );
}
