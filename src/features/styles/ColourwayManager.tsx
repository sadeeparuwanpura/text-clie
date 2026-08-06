import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { addColourway, removeColourway, type Colourway } from '../../api/style.api';
import { toApiError } from '../../api/httpClient';
import { Button } from '../../design-system/Button';
import { ConfirmDialog } from '../../design-system/ConfirmDialog';
import { Field } from '../../design-system/Field';
import { useToast } from '../../design-system/useToast';
import { colourwayFormSchema, type ColourwayFormValues } from '../../validation/style.schema';
import styles from './StyleEditPage.module.css';

/** FR-ST-07: each colourway carries a real shade name and code — cones are counted per shade. */
export function ColourwayManager({
  styleId,
  colourways,
  canEdit,
}: {
  styleId: string;
  colourways: Colourway[];
  canEdit: boolean;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [pendingRemove, setPendingRemove] = useState<Colourway | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ColourwayFormValues>({ resolver: zodResolver(colourwayFormSchema) });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['style', styleId] });

  const addMutation = useMutation({
    mutationFn: (values: ColourwayFormValues) => addColourway(styleId, values),
    onSuccess: () => {
      invalidate();
      reset({ name: '', shadeCode: '' });
    },
    onError: (err) => toast.show(toApiError(err).message, 'danger'),
  });

  const removeMutation = useMutation({
    mutationFn: (colourwayId: string) => removeColourway(styleId, colourwayId),
    onSuccess: () => {
      invalidate();
      setPendingRemove(null);
    },
    onError: (err) => toast.show(toApiError(err).message, 'danger'),
  });

  return (
    <div>
      <h2 className={styles.sectionTitle}>Colourways</h2>
      {colourways.length === 0 && <p className={styles.emptyHint}>No colourways added yet.</p>}
      <div className={styles.itemList}>
        {colourways.map((colourway) => (
          <div key={colourway.id} className={styles.item}>
            <span className={styles.itemLabel}>
              {colourway.name} <span className={styles.itemMeta}>{colourway.shadeCode}</span>
            </span>
            {canEdit && (
              <Button variant="danger" onClick={() => setPendingRemove(colourway)}>
                Remove
              </Button>
            )}
          </div>
        ))}
      </div>

      {canEdit && (
        <form
          className={styles.addRow}
          onSubmit={handleSubmit((values) => addMutation.mutate(values))}
          noValidate
        >
          <Field
            label="Colourway name"
            wrapperClassName={styles.addRowField}
            error={errors.name?.message}
            {...register('name')}
          />
          <Field
            label="Shade code"
            wrapperClassName={styles.addRowField}
            error={errors.shadeCode?.message}
            {...register('shadeCode')}
          />
          <Button type="submit" variant="secondary" loading={isSubmitting}>
            Add
          </Button>
        </form>
      )}

      <ConfirmDialog
        open={pendingRemove !== null}
        title="Remove colourway"
        message={
          pendingRemove
            ? `Remove colourway "${pendingRemove.name} (${pendingRemove.shadeCode})" from this style?`
            : ''
        }
        confirmLabel="Remove"
        danger
        loading={removeMutation.isPending}
        onConfirm={() => pendingRemove && removeMutation.mutate(pendingRemove.id)}
        onCancel={() => setPendingRemove(null)}
      />
    </div>
  );
}
