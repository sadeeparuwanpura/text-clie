import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { toApiError } from '../../api/httpClient';
import { getStyle } from '../../api/style.api';
import {
  fillRecommendedAssignments,
  listThreadAssignments,
  upsertThreadAssignment,
  type AssignmentUpsertInput,
} from '../../api/threadAssignment.api';
import { listThreadVarieties } from '../../api/threadVariety.api';
import { Button } from '../../design-system/Button';
import { useToast } from '../../design-system/useToast';
import { useSessionStore } from '../../store/session.store';
import { THREAD_ROLE_COLOR_VAR, type ThreadLineRole } from '../../types/threadLineRole';
import { AssignmentRow } from './AssignmentRow';
import { ChainShell } from './ChainShell';
import styles from './Chain.module.css';

export function ThreadVarietyAssignPage() {
  const { id: styleId } = useParams<{ id: string }>();
  const toast = useToast();
  const queryClient = useQueryClient();
  const permissions = useSessionStore((state) => state.permissions);
  const canEdit = permissions.includes('threadassignment:write');

  const styleQuery = useQuery({
    queryKey: ['style', styleId],
    queryFn: () => getStyle(styleId!),
    enabled: Boolean(styleId),
  });
  const assignmentsQuery = useQuery({
    queryKey: ['thread-assignments', styleId],
    queryFn: () => listThreadAssignments(styleId!),
    enabled: Boolean(styleId),
  });
  const varietiesQuery = useQuery({
    queryKey: ['thread-varieties', 'all-active'],
    queryFn: () => listThreadVarieties({ limit: 200, isActive: true }),
  });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ['thread-assignments', styleId] });
    void queryClient.invalidateQueries({ queryKey: ['chain-check', styleId] });
  }

  const upsertMutation = useMutation({
    mutationFn: ({ role, input }: { role: ThreadLineRole; input: AssignmentUpsertInput }) =>
      upsertThreadAssignment(styleId!, role, input),
    onSuccess: () => {
      invalidate();
      toast.show('Thread assignment saved.', 'success');
    },
    onError: (err) => toast.show(toApiError(err).message, 'danger'),
  });

  const fillMutation = useMutation({
    mutationFn: () => fillRecommendedAssignments(styleId!),
    onSuccess: (results) => {
      invalidate();
      toast.show(
        `Filled ${results.length} role${results.length === 1 ? '' : 's'} with recommended varieties.`,
        'success',
      );
    },
    onError: (err) => toast.show(toApiError(err).message, 'danger'),
  });

  if (!styleId) return null;

  const colourways = styleQuery.data?.colourways ?? [];
  const varieties = varietiesQuery.data?.data ?? [];
  const inUse = assignmentsQuery.data?.inUse ?? [];
  const orphaned = assignmentsQuery.data?.orphaned ?? [];
  const unassignedCount = inUse.filter((r) => !r.assignment).length;

  return (
    <ChainShell styleId={styleId} active="thread-varieties">
      {canEdit && unassignedCount > 0 && (
        <div className={styles.card}>
          <div className={styles.toolbar}>
            <span>
              {unassignedCount} role{unassignedCount === 1 ? '' : 's'} unassigned.
            </span>
            <Button
              variant="secondary"
              onClick={() => fillMutation.mutate()}
              loading={fillMutation.isPending}
            >
              Fill recommended
            </Button>
          </div>
        </div>
      )}

      {inUse.length === 0 ? (
        <div className={styles.emptyState}>
          <p>
            No thread line roles are in use yet — include a role on the Machine Include tab first.
          </p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Role</th>
                <th>Variety</th>
                <th>Ticket</th>
                <th>Cone length (m)</th>
                <th>Unit price</th>
                <th>Shade per colourway</th>
                {canEdit && <th></th>}
              </tr>
            </thead>
            <tbody>
              {inUse.map((row) => (
                <AssignmentRow
                  key={row.role}
                  role={row.role}
                  assignment={row.assignment}
                  colourways={colourways}
                  varieties={varieties}
                  canEdit={canEdit}
                  saving={upsertMutation.isPending}
                  onSave={(input) => upsertMutation.mutate({ role: row.role, input })}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {orphaned.length > 0 && (
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Orphaned assignments (FR-LK-06)</h2>
          <p style={{ color: 'var(--tcms-text-muted)', fontSize: 'var(--tcms-font-size-sm)' }}>
            These roles are no longer used by any operation, but their assignment is kept in case a
            machine type change is reverted.
          </p>
          <div className={styles.roleChips}>
            {orphaned.map((a) => (
              <span key={a.id} className={styles.roleChip}>
                <span
                  className={styles.roleDot}
                  style={{ background: THREAD_ROLE_COLOR_VAR[a.role] }}
                  aria-hidden="true"
                />
                {a.role}
              </span>
            ))}
          </div>
        </div>
      )}
    </ChainShell>
  );
}
