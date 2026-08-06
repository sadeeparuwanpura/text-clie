import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toApiError } from '../../api/httpClient';
import { listOperations } from '../../api/operation.api';
import {
  listSewOffsForStyle,
  promoteSewOff,
  recordSewOff,
  type RecordSewOffInput,
} from '../../api/sewOff.api';
import { getStyle } from '../../api/style.api';
import { Button } from '../../design-system/Button';
import { Field } from '../../design-system/Field';
import { Select } from '../../design-system/Select';
import { useToast } from '../../design-system/useToast';
import { useSessionStore } from '../../store/session.store';
import type { ThreadLineRole } from '../../types/threadLineRole';
import styles from './SewOff.module.css';

export function SewOffPage() {
  const { id: styleId } = useParams<{ id: string }>();
  const toast = useToast();
  const queryClient = useQueryClient();
  const permissions = useSessionStore((state) => state.permissions);
  const canRecord = permissions.includes('sewoff:write');
  const canPromote = permissions.includes('machinetype:write');

  const [operationId, setOperationId] = useState('');
  const [role, setRole] = useState<ThreadLineRole | ''>('');
  const [measuredMetres, setMeasuredMetres] = useState('');
  const [garmentsSewn, setGarmentsSewn] = useState('');
  const [notes, setNotes] = useState('');

  const styleQuery = useQuery({ queryKey: ['style', styleId], queryFn: () => getStyle(styleId!) });
  const opsQuery = useQuery({
    queryKey: ['operations', styleId],
    queryFn: () => listOperations(styleId!),
    enabled: Boolean(styleId),
  });
  const sewOffsQuery = useQuery({
    queryKey: ['sew-offs', styleId],
    queryFn: () => listSewOffsForStyle(styleId!),
    enabled: Boolean(styleId),
  });

  const operations = opsQuery.data?.data ?? [];
  const selectedOperation = operations.find((op) => op.id === operationId);
  const availableRoles = selectedOperation?.threadLines.filter((l) => l.included) ?? [];
  const operationById = new Map(operations.map((op) => [op.id, op]));

  const recordMutation = useMutation({
    mutationFn: (input: RecordSewOffInput) => recordSewOff(styleId!, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sew-offs', styleId] });
      toast.show('Sew-off recorded.', 'success');
      setMeasuredMetres('');
      setGarmentsSewn('');
      setNotes('');
    },
    onError: (err) => toast.show(toApiError(err).message, 'danger'),
  });

  const promoteMutation = useMutation({
    mutationFn: (id: string) => promoteSewOff(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sew-offs', styleId] });
      toast.show('Factor promoted to the machine type template.', 'success');
    },
    onError: (err) => toast.show(toApiError(err).message, 'danger'),
  });

  if (!styleId) return null;

  function handleRecord() {
    if (!operationId || !role) return;
    const measured = Number(measuredMetres);
    const garments = Number(garmentsSewn);
    if (Number.isNaN(measured) || Number.isNaN(garments)) return;
    recordMutation.mutate({
      operationId,
      role: role as ThreadLineRole,
      measuredMetres: measured,
      garmentsSewn: garments,
      notes: notes || undefined,
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <Link to={`/styles/${styleId}`} className={styles.backLink}>
            ← {styleQuery.data?.styleNo ?? 'Style'}
          </Link>
          <h1 className={styles.title}>Sew-off &amp; variance (M-14)</h1>
        </div>
      </div>

      {canRecord && (
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Record a sew-off</h2>
          <div className={styles.toolbar}>
            <Select
              label="Operation"
              wrapperClassName={styles.toolbarField}
              placeholder="Select an operation"
              options={operations
                .filter((op) => op.machineTypeId)
                .map((op) => ({ value: op.id, label: `${op.sequence}. ${op.name}` }))}
              value={operationId}
              onChange={(e) => {
                setOperationId(e.target.value);
                setRole('');
              }}
            />
            <Select
              label="Role"
              wrapperClassName={styles.toolbarField}
              placeholder="Select a role"
              options={availableRoles.map((l) => ({ value: l.role, label: l.role }))}
              value={role}
              onChange={(e) => setRole(e.target.value as ThreadLineRole)}
              disabled={!operationId}
            />
            <Field
              label="Measured length (m)"
              type="number"
              step="0.01"
              wrapperClassName={styles.toolbarField}
              value={measuredMetres}
              onChange={(e) => setMeasuredMetres(e.target.value)}
            />
            <Field
              label="Garments sewn"
              type="number"
              wrapperClassName={styles.toolbarField}
              value={garmentsSewn}
              onChange={(e) => setGarmentsSewn(e.target.value)}
            />
            <Field
              label="Notes"
              wrapperClassName={styles.toolbarField}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Button
              variant="primary"
              onClick={handleRecord}
              loading={recordMutation.isPending}
              disabled={!operationId || !role || !measuredMetres || !garmentsSewn}
            >
              Record
            </Button>
          </div>
        </div>
      )}

      {sewOffsQuery.isSuccess && sewOffsQuery.data.length === 0 && (
        <div className={styles.emptyState}>
          <p>No sew-off measurements recorded yet for this style.</p>
        </div>
      )}

      {sewOffsQuery.isSuccess && sewOffsQuery.data.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Operation</th>
                <th>Role</th>
                <th>Measured (m)</th>
                <th>Garments</th>
                <th>Implied factor</th>
                <th>Estimate factor</th>
                <th>Variance</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sewOffsQuery.data.map((s) => (
                <tr key={s.id}>
                  <td>{operationById.get(s.operationId)?.name ?? s.operationId}</td>
                  <td>{s.role}</td>
                  <td className="tcms-numeric">{s.measuredMetres}</td>
                  <td className="tcms-numeric">{s.garmentsSewn}</td>
                  <td className="tcms-numeric">{s.impliedFactor.toFixed(4)}</td>
                  <td className="tcms-numeric">{s.estimateFactor.toFixed(4)}</td>
                  <td className={s.exceedsThreshold ? styles.varianceExceeds : styles.varianceOk}>
                    {s.variancePct.toFixed(1)}%
                    {s.exceedsThreshold && <span> ⚠ exceeds threshold</span>}
                  </td>
                  <td>
                    {s.promotedAt ? (
                      <span className={styles.promotedChip}>Promoted</span>
                    ) : (
                      canPromote && (
                        <Button
                          variant="secondary"
                          onClick={() => promoteMutation.mutate(s.id)}
                          loading={promoteMutation.isPending}
                        >
                          Promote
                        </Button>
                      )
                    )}
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
