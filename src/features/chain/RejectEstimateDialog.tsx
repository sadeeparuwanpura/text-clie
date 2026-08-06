import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../design-system/Button';
import {
  rejectEstimateFormSchema,
  type RejectEstimateFormValues,
} from '../../validation/estimate.schema';
import styles from './RejectEstimateDialog.module.css';

export interface RejectEstimateDialogProps {
  open: boolean;
  loading: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

/** FR-WF-04: a rejection reason of at least twenty characters, stored and shown to the submitter. */
export function RejectEstimateDialog({
  open,
  loading,
  onConfirm,
  onCancel,
}: RejectEstimateDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectEstimateFormValues>({ resolver: zodResolver(rejectEstimateFormSchema) });

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      reset({ reason: '' });
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, reset]);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClose={onCancel}
      aria-labelledby="reject-estimate-title"
    >
      <form onSubmit={handleSubmit((values) => onConfirm(values.reason))} noValidate>
        <div className={styles.body}>
          <h2 id="reject-estimate-title" className={styles.title}>
            Reject estimate
          </h2>
          <label htmlFor="reject-reason">Reason (at least twenty characters)</label>
          <textarea
            id="reject-reason"
            className={styles.textarea}
            autoFocus
            {...register('reason')}
          />
          {errors.reason && <span className={styles.error}>{errors.reason.message}</span>}
        </div>
        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" loading={loading}>
            Reject
          </Button>
        </div>
      </form>
    </dialog>
  );
}
