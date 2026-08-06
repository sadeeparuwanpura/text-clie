import { useEffect, useRef, useState } from 'react';
import { Button } from '../../design-system/Button';
import { Field } from '../../design-system/Field';
import styles from './Requisition.module.css';

export interface GenerateRequisitionDialogProps {
  open: boolean;
  loading: boolean;
  /** Set once a first attempt comes back needing FR-PR-04's override reason. */
  requiresOverrideReason: boolean;
  onConfirm: (requiredBy: string, overrideReason?: string) => void;
  onCancel: () => void;
}

/** FR-PR-01/04: asks for the required-by date, and — only if a requisition already exists for this estimate — a reason to override. */
export function GenerateRequisitionDialog({
  open,
  loading,
  requiresOverrideReason,
  onConfirm,
  onCancel,
}: GenerateRequisitionDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [requiredBy, setRequiredBy] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setRequiredBy('');
      setOverrideReason('');
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClose={onCancel}
      aria-labelledby="generate-requisition-title"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!requiredBy) return;
          onConfirm(requiredBy, overrideReason || undefined);
        }}
        noValidate
      >
        <div className={styles.dialogBody}>
          <h2 id="generate-requisition-title">Generate purchase requisition</h2>
          <Field
            label="Required by"
            type="date"
            required
            autoFocus
            value={requiredBy}
            onChange={(e) => setRequiredBy(e.target.value)}
          />
          {requiresOverrideReason && (
            <Field
              label="Override reason"
              hint="A requisition already exists for this estimate version — explain why another is needed."
              required
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
            />
          )}
        </div>
        <div className={styles.dialogActions}>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading} disabled={!requiredBy}>
            Generate
          </Button>
        </div>
      </form>
    </dialog>
  );
}
