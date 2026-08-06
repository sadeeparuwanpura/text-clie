import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toApiError } from '../../api/httpClient';
import {
  downloadRequisitionExport,
  getRequisition,
  markRequisitionRaised,
} from '../../api/purchaseRequisition.api';
import { Button } from '../../design-system/Button';
import { Field } from '../../design-system/Field';
import { useToast } from '../../design-system/useToast';
import { useSessionStore } from '../../store/session.store';
import styles from './Requisition.module.css';

export function RequisitionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const queryClient = useQueryClient();
  const permissions = useSessionStore((state) => state.permissions);
  const canWrite = permissions.includes('requisition:write');
  const [erpDocNo, setErpDocNo] = useState('');
  const [exporting, setExporting] = useState<'xlsx' | 'pdf' | null>(null);

  const query = useQuery({
    queryKey: ['requisition', id],
    queryFn: () => getRequisition(id!),
    enabled: Boolean(id),
  });

  const markRaisedMutation = useMutation({
    mutationFn: (doc: string) => markRequisitionRaised(id!, doc),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['requisition', id] });
      toast.show('Requisition marked as raised.', 'success');
      setErpDocNo('');
    },
    onError: (err) => toast.show(toApiError(err).message, 'danger'),
  });

  async function handleExport(format: 'xlsx' | 'pdf') {
    if (!id || !query.data) return;
    setExporting(format);
    try {
      await downloadRequisitionExport(id, format, `requisition-${query.data.reqNo}.${format}`);
    } catch (err) {
      toast.show(toApiError(err).message, 'danger');
    } finally {
      setExporting(null);
    }
  }

  if (!id) return null;
  if (query.isLoading) return <p>Loading requisition…</p>;
  if (query.isError) return <p role="alert">{toApiError(query.error).message}</p>;
  const req = query.data!;

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <Link to="/requisitions" className={styles.backLink}>
            ← Requisitions
          </Link>
          <h1>{req.reqNo}</h1>
        </div>
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

      <div className={styles.card}>
        <p>
          Status: <strong>{req.status}</strong>
          {req.erpDocNo && <> — ERP doc {req.erpDocNo}</>}
        </p>
        <p>Required by: {new Date(req.requiredBy).toLocaleDateString()}</p>
        <p>Covers {req.estimateIds.length} estimate(s).</p>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Variety</th>
              <th>Ticket</th>
              <th>Shade</th>
              <th className="tcms-numeric">Cone length (m)</th>
              <th className="tcms-numeric">Cones</th>
              <th className="tcms-numeric">Unit price</th>
              <th className="tcms-numeric">Value</th>
            </tr>
          </thead>
          <tbody>
            {req.lines.map((line, idx) => (
              <tr key={idx}>
                <td>
                  {line.varietyCode} — {line.varietyName}
                </td>
                <td className="tcms-numeric">{line.ticket}</td>
                <td>{line.shadeCode}</td>
                <td className="tcms-numeric">{line.coneLengthM}</td>
                <td className="tcms-numeric">{line.cones}</td>
                <td className="tcms-numeric">{line.unitPrice.toFixed(2)}</td>
                <td className="tcms-numeric">{line.value.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={6}>Total</td>
              <td className="tcms-numeric">{req.totalValue.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {canWrite && req.status === 'Open' && (
        <div className={styles.card}>
          <h2>Mark as raised in the ERP</h2>
          <div className={styles.toolbar}>
            <Field
              label="ERP document number"
              wrapperClassName={styles.toolbarField}
              value={erpDocNo}
              onChange={(e) => setErpDocNo(e.target.value)}
            />
            <Button
              variant="primary"
              onClick={() => erpDocNo && markRaisedMutation.mutate(erpDocNo)}
              loading={markRaisedMutation.isPending}
              disabled={!erpDocNo}
            >
              Mark raised
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
