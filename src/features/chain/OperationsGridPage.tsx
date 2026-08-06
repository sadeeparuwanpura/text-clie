import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  addBlankOperations,
  createOperation,
  deleteOperation,
  listOperations,
  reorderOperations,
  seedOperationsFromLibrary,
  updateOperation,
  type OperationLineInput,
} from '../../api/operation.api';
import { toApiError } from '../../api/httpClient';
import { Button } from '../../design-system/Button';
import { ConfirmDialog } from '../../design-system/ConfirmDialog';
import { Field } from '../../design-system/Field';
import { useToast } from '../../design-system/useToast';
import { useSessionStore } from '../../store/session.store';
import { operationFormSchema } from '../../validation/operation.schema';
import { ChainShell } from './ChainShell';
import { OperationRow } from './OperationRow';
import styles from './Chain.module.css';

export function OperationsGridPage() {
  const { id: styleId } = useParams<{ id: string }>();
  const toast = useToast();
  const queryClient = useQueryClient();
  const permissions = useSessionStore((state) => state.permissions);
  const canEdit = permissions.includes('operation:write');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newSeam, setNewSeam] = useState('');
  const [newReps, setNewReps] = useState('1');
  const [newSpi, setNewSpi] = useState('10');
  const [addError, setAddError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['operations', styleId],
    queryFn: () => listOperations(styleId!),
    enabled: Boolean(styleId),
  });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ['operations', styleId] });
    void queryClient.invalidateQueries({ queryKey: ['chain-check', styleId] });
    void queryClient.invalidateQueries({ queryKey: ['thread-assignments', styleId] });
  }

  const createMutation = useMutation({
    mutationFn: (input: OperationLineInput) => createOperation(styleId!, input),
    onSuccess: () => {
      invalidate();
      setNewName('');
      setNewSeam('');
      setNewReps('1');
      setNewSpi('10');
    },
    onError: (err) => toast.show(toApiError(err).message, 'danger'),
  });

  const addBlankMutation = useMutation({
    mutationFn: (count: number) => addBlankOperations(styleId!, count),
    onSuccess: invalidate,
    onError: (err) => toast.show(toApiError(err).message, 'danger'),
  });

  const seedMutation = useMutation({
    mutationFn: () => seedOperationsFromLibrary(styleId!),
    onSuccess: () => {
      invalidate();
      toast.show('Standard operations loaded.', 'success');
    },
    onError: (err) => toast.show(toApiError(err).message, 'danger'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<OperationLineInput> }) =>
      updateOperation(id, input),
    onSuccess: invalidate,
    onError: (err) => toast.show(toApiError(err).message, 'danger'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteOperation(id),
    onSuccess: () => {
      invalidate();
      setPendingDelete(null);
    },
    onError: (err) => {
      toast.show(toApiError(err).message, 'danger');
      setPendingDelete(null);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedOperationIds: string[]) => reorderOperations(styleId!, orderedOperationIds),
    onSuccess: invalidate,
    onError: (err) => toast.show(toApiError(err).message, 'danger'),
  });

  if (!styleId) return null;

  const rows = query.data?.data ?? [];

  function handleAdd() {
    setAddError(null);
    const parsed = operationFormSchema.safeParse({
      name: newName,
      seamLengthCm: newSeam,
      reps: newReps,
      spi: newSpi,
    });
    if (!parsed.success) {
      setAddError(parsed.error.issues[0]?.message ?? 'Invalid input.');
      return;
    }
    createMutation.mutate(parsed.data);
  }

  function move(index: number, direction: -1 | 1) {
    const ids = rows.map((r) => r.id);
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorderMutation.mutate(ids);
  }

  return (
    <ChainShell styleId={styleId} active="operations">
      <div className={styles.card}>
        <div className={styles.toolbar}>
          {canEdit && (
            <>
              <Button variant="secondary" onClick={() => addBlankMutation.mutate(5)}>
                Add 5 blank lines
              </Button>
              <Button
                variant="secondary"
                onClick={() => seedMutation.mutate()}
                loading={seedMutation.isPending}
              >
                Load standard operations
              </Button>
            </>
          )}
          <span className={styles.summaryBar}>
            <span>
              Operations: <span className={styles.summaryValue}>{rows.length}</span>
            </span>
            <span>
              Total seam:{' '}
              <span className={styles.summaryValue}>
                {(query.data?.totalSeamM ?? 0).toFixed(4)} m
              </span>
            </span>
          </span>
        </div>
      </div>

      {query.isLoading && <p>Loading operations…</p>}
      {query.isError && <p role="alert">{toApiError(query.error).message}</p>}

      {query.isSuccess && rows.length === 0 && (
        <div className={styles.emptyState}>
          <p>
            No operations yet. Add a line, add several blank lines, or load the standard breakdown.
          </p>
        </div>
      )}

      {query.isSuccess && rows.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Operation</th>
                <th>Seam (cm)</th>
                <th>Reps</th>
                <th>SPI</th>
                <th>Seam (m)</th>
                <th>Note</th>
                {canEdit && <th></th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((op, index) => (
                <OperationRow
                  key={op.id}
                  operation={op}
                  canEdit={canEdit}
                  isFirst={index === 0}
                  isLast={index === rows.length - 1}
                  saving={updateMutation.isPending || deleteMutation.isPending}
                  onSave={(input) => updateMutation.mutate({ id: op.id, input })}
                  onDelete={() => setPendingDelete(op.id)}
                  onMoveUp={() => move(index, -1)}
                  onMoveDown={() => move(index, 1)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canEdit && (
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Add a line</h2>
          {addError && (
            <p role="alert" className={styles.issuesPanel}>
              {addError}
            </p>
          )}
          <div className={styles.toolbar}>
            <Field
              label="Operation name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Field
              label="Seam (cm)"
              type="number"
              step="0.1"
              value={newSeam}
              onChange={(e) => setNewSeam(e.target.value)}
            />
            <Field
              label="Reps"
              type="number"
              value={newReps}
              onChange={(e) => setNewReps(e.target.value)}
            />
            <Field
              label="SPI"
              type="number"
              value={newSpi}
              onChange={(e) => setNewSpi(e.target.value)}
            />
            <Button variant="primary" onClick={handleAdd} loading={createMutation.isPending}>
              Add line
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete operation"
        message="Delete this operation? Its thread lines and any draft consumption lines go with it."
        confirmLabel="Delete"
        danger
        loading={deleteMutation.isPending}
        onConfirm={() => pendingDelete && deleteMutation.mutate(pendingDelete)}
        onCancel={() => setPendingDelete(null)}
      />
    </ChainShell>
  );
}
