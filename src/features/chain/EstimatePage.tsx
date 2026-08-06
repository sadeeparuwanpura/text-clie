import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  approveEstimate,
  calculatePreview,
  downloadExport,
  getConsumptionSheet,
  listEstimatesForStyle,
  recallEstimate,
  rejectEstimate,
  reviseEstimate,
  saveDraftEstimate,
  submitEstimate,
  type CalcResult,
} from '../../api/estimate.api';
import { toApiError } from '../../api/httpClient';
import { Button } from '../../design-system/Button';
import { Field } from '../../design-system/Field';
import { useToast } from '../../design-system/useToast';
import { useSessionStore } from '../../store/session.store';
import { THREAD_ROLE_COLOR_VAR } from '../../types/threadLineRole';
import { ChainShell } from './ChainShell';
import { RejectEstimateDialog } from './RejectEstimateDialog';
import { useChainCheck } from './useChainCheck';
import styles from './Chain.module.css';

export function EstimatePage() {
  const { id: styleId } = useParams<{ id: string }>();
  const toast = useToast();
  const queryClient = useQueryClient();
  const permissions = useSessionStore((state) => state.permissions);
  const [wastagePct, setWastagePct] = useState('5');
  const [preview, setPreview] = useState<CalcResult | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const chainCheck = useChainCheck(styleId ?? '');
  const historyQuery = useQuery({
    queryKey: ['estimates', styleId],
    queryFn: () => listEstimatesForStyle(styleId!),
    enabled: Boolean(styleId),
  });

  const history = historyQuery.data ?? [];
  const current = history[0] ?? null;
  const sheetId = viewingId ?? current?.id ?? null;

  const sheetQuery = useQuery({
    queryKey: ['consumption-sheet', sheetId],
    queryFn: () => getConsumptionSheet(sheetId!),
    enabled: Boolean(sheetId),
  });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ['estimates', styleId] });
    void queryClient.invalidateQueries({ queryKey: ['consumption-sheet'] });
    void queryClient.invalidateQueries({ queryKey: ['style', styleId] });
  }

  const calcMutation = useMutation({
    mutationFn: () => calculatePreview(styleId!, wastagePct ? Number(wastagePct) : undefined),
    onSuccess: setPreview,
    onError: (err) => toast.show(toApiError(err).message, 'danger'),
  });

  const saveMutation = useMutation({
    mutationFn: () => saveDraftEstimate(styleId!, wastagePct ? Number(wastagePct) : undefined),
    onSuccess: () => {
      invalidate();
      setPreview(null);
      toast.show('Draft estimate saved.', 'success');
    },
    onError: (err) => toast.show(toApiError(err).message, 'danger'),
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => submitEstimate(id),
    onSuccess: () => {
      invalidate();
      toast.show('Estimate submitted for approval.', 'success');
    },
    onError: (err) => toast.show(toApiError(err).message, 'danger'),
  });

  const recallMutation = useMutation({
    mutationFn: (id: string) => recallEstimate(id),
    onSuccess: () => {
      invalidate();
      toast.show('Estimate recalled to draft.', 'success');
    },
    onError: (err) => toast.show(toApiError(err).message, 'danger'),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveEstimate(id),
    onSuccess: () => {
      invalidate();
      toast.show('Estimate approved.', 'success');
    },
    onError: (err) => toast.show(toApiError(err).message, 'danger'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectEstimate(id, reason),
    onSuccess: () => {
      invalidate();
      setRejectOpen(false);
      toast.show('Estimate rejected.', 'success');
    },
    onError: (err) => toast.show(toApiError(err).message, 'danger'),
  });

  const reviseMutation = useMutation({
    mutationFn: (id: string) => reviseEstimate(id),
    onSuccess: () => {
      invalidate();
      toast.show('A new draft version is open for editing.', 'success');
    },
    onError: (err) => toast.show(toApiError(err).message, 'danger'),
  });

  const [exporting, setExporting] = useState<'xlsx' | 'pdf' | null>(null);
  async function handleExport(format: 'xlsx' | 'pdf') {
    if (!sheetId || !sheetQuery.data) return;
    setExporting(format);
    try {
      await downloadExport(
        sheetId,
        format,
        `consumption-sheet-${sheetQuery.data.styleNo}-v${sheetQuery.data.version}.${format}`,
      );
    } catch (err) {
      toast.show(toApiError(err).message, 'danger');
    } finally {
      setExporting(null);
    }
  }

  if (!styleId) return null;

  const canWrite = permissions.includes('estimate:write');
  const canSubmit = permissions.includes('estimate:submit');
  const canApprove = permissions.includes('estimate:approve');

  return (
    <ChainShell styleId={styleId} active="estimate">
      <div className={styles.card}>
        <div className={styles.toolbar}>
          <Field
            label="Wastage %"
            type="number"
            step="0.1"
            wrapperClassName={styles.toolbarField}
            value={wastagePct}
            onChange={(e) => setWastagePct(e.target.value)}
          />
          <Button
            variant="secondary"
            onClick={() => calcMutation.mutate()}
            loading={calcMutation.isPending}
          >
            Calculate (preview)
          </Button>
          {canWrite && (
            <Button
              variant="primary"
              onClick={() => saveMutation.mutate()}
              loading={saveMutation.isPending}
            >
              Save draft
            </Button>
          )}
          {chainCheck.data && !chainCheck.data.ok && (
            <span style={{ color: 'var(--tcms-danger)', fontSize: 'var(--tcms-font-size-sm)' }}>
              The chain has {chainCheck.data.issues.length} unresolved issue(s) — see the badge
              above.
            </span>
          )}
        </div>
      </div>

      {preview && (
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Uncommitted preview</h2>
          <RoleTotalsTable roleTotals={preview.roleTotals} totals={preview.totals} />
          {preview.unassignedRoles.length > 0 && (
            <p style={{ color: 'var(--tcms-danger)', fontSize: 'var(--tcms-font-size-sm)' }}>
              Unassigned roles excluded from totals: {preview.unassignedRoles.join(', ')}
            </p>
          )}
        </div>
      )}

      {current && (
        <div className={styles.card}>
          <div className={styles.headerRow}>
            <div>
              <span className={styles.statusChip}>{current.status}</span>
              <span
                style={{ marginLeft: 'var(--tcms-space-3)', fontFamily: 'var(--tcms-font-mono)' }}
              >
                Version {current.version}
              </span>
            </div>
            <div className={styles.actions}>
              {current.status === 'Draft' && canSubmit && (
                <Button
                  variant="primary"
                  onClick={() => submitMutation.mutate(current.id)}
                  loading={submitMutation.isPending}
                >
                  Submit for approval
                </Button>
              )}
              {current.status === 'Submitted' && canSubmit && (
                <Button
                  variant="secondary"
                  onClick={() => recallMutation.mutate(current.id)}
                  loading={recallMutation.isPending}
                >
                  Recall to draft
                </Button>
              )}
              {current.status === 'Submitted' && canApprove && (
                <>
                  <Button
                    variant="primary"
                    onClick={() => approveMutation.mutate(current.id)}
                    loading={approveMutation.isPending}
                  >
                    Approve
                  </Button>
                  <Button variant="danger" onClick={() => setRejectOpen(true)}>
                    Reject
                  </Button>
                </>
              )}
              {current.status === 'Approved' && canWrite && (
                <Button
                  variant="secondary"
                  onClick={() => reviseMutation.mutate(current.id)}
                  loading={reviseMutation.isPending}
                >
                  Revise (open new draft)
                </Button>
              )}
            </div>
          </div>
          {current.status === 'Rejected' && current.rejectionReason && (
            <p style={{ color: 'var(--tcms-danger)' }}>
              Rejection reason: {current.rejectionReason}
            </p>
          )}
        </div>
      )}

      {sheetQuery.data && (
        <div className={styles.card}>
          <div className={styles.headerRow}>
            <h2 className={styles.sectionTitle}>
              Consumption sheet {sheetQuery.data.isDraft && '— DRAFT, not for procurement'}
            </h2>
            <div className={styles.actions}>
              <Button
                variant="secondary"
                onClick={() => handleExport('xlsx')}
                loading={exporting === 'xlsx'}
              >
                Export Excel
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleExport('pdf')}
                loading={exporting === 'pdf'}
              >
                Export PDF
              </Button>
            </div>
          </div>
          <RoleTotalsTable
            roleTotals={sheetQuery.data.roleSummary}
            totals={sheetQuery.data.totals}
            showPct
          />
        </div>
      )}

      {history.length > 1 && (
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Version history (FR-WF-07)</h2>
          <div className={styles.historyList}>
            {history.map((h) => (
              <div key={h.id} className={styles.historyItem}>
                <span>
                  v{h.version} — {h.status}
                </span>
                <span>{h.totals ? `${h.totals.cones} cones` : 'not calculated'}</span>
                <Button variant="secondary" onClick={() => setViewingId(h.id)}>
                  View sheet
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <RejectEstimateDialog
        open={rejectOpen}
        loading={rejectMutation.isPending}
        onConfirm={(reason) => current && rejectMutation.mutate({ id: current.id, reason })}
        onCancel={() => setRejectOpen(false)}
      />
    </ChainShell>
  );
}

function RoleTotalsTable({
  roleTotals,
  totals,
  showPct,
}: {
  roleTotals: Array<{
    role: string;
    metresPerGarment: number;
    orderMetres: number;
    cones: number;
    cost: number;
    pctOfTotalMetres?: number;
  }>;
  totals: {
    perGarmentM: number;
    orderM: number;
    cones: number;
    cost: number;
    costPerGarment: number;
  };
  showPct?: boolean;
}) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Role</th>
            <th>M/Garment</th>
            <th>Order M</th>
            <th>Cones</th>
            <th>Cost</th>
            {showPct && <th>% of total</th>}
          </tr>
        </thead>
        <tbody>
          {roleTotals.map((r) => (
            <tr key={r.role}>
              <td>
                <span className={styles.roleChip}>
                  <span
                    className={styles.roleDot}
                    style={{
                      background:
                        THREAD_ROLE_COLOR_VAR[r.role as keyof typeof THREAD_ROLE_COLOR_VAR],
                    }}
                    aria-hidden="true"
                  />
                  {r.role}
                </span>
              </td>
              <td className="tcms-numeric">{r.metresPerGarment.toFixed(4)}</td>
              <td className="tcms-numeric">{r.orderMetres.toFixed(2)}</td>
              <td className="tcms-numeric">{r.cones}</td>
              <td className="tcms-numeric">{r.cost.toFixed(2)}</td>
              {showPct && <td className="tcms-numeric">{(r.pctOfTotalMetres ?? 0).toFixed(1)}%</td>}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>Grand total</td>
            <td className="tcms-numeric">{totals.perGarmentM.toFixed(4)}</td>
            <td className="tcms-numeric">{totals.orderM.toFixed(2)}</td>
            <td className="tcms-numeric">{totals.cones}</td>
            <td className="tcms-numeric">{totals.cost.toFixed(2)}</td>
            {showPct && <td></td>}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
