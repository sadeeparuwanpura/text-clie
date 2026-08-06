import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../design-system/Button';
import { Field } from '../../design-system/Field';
import {
  duplicateStyleFormSchema,
  type DuplicateStyleFormValues,
} from '../../validation/style.schema';
import styles from './DuplicateStyleDialog.module.css';

export interface DuplicateStyleDialogProps {
  open: boolean;
  sourceStyleNo: string;
  loading: boolean;
  onConfirm: (styleNo: string) => void;
  onCancel: () => void;
}

/** FR-ST-03: duplicating a style asks only for the one thing that must differ — a new style number. */
export function DuplicateStyleDialog({
  open,
  sourceStyleNo,
  loading,
  onConfirm,
  onCancel,
}: DuplicateStyleDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DuplicateStyleFormValues>({ resolver: zodResolver(duplicateStyleFormSchema) });

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      reset({ styleNo: '' });
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
      aria-labelledby="duplicate-style-title"
    >
      <form onSubmit={handleSubmit((values) => onConfirm(values.styleNo))} noValidate>
        <div className={styles.body}>
          <h2 id="duplicate-style-title" className={styles.title}>
            Duplicate style
          </h2>
          <p className={styles.subtitle}>
            Copies the header, colourways and fabric mappings of "{sourceStyleNo}" into a new Draft
            style.
          </p>
          <Field
            label="New style number"
            required
            autoFocus
            error={errors.styleNo?.message}
            {...register('styleNo')}
          />
        </div>
        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Duplicate
          </Button>
        </div>
      </form>
    </dialog>
  );
}
