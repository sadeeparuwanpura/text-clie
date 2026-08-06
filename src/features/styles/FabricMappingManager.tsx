import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { listFabrics } from '../../api/fabric.api';
import { toApiError } from '../../api/httpClient';
import { addFabricMapping, removeFabricMapping, type FabricMapping } from '../../api/style.api';
import { Button } from '../../design-system/Button';
import { ConfirmDialog } from '../../design-system/ConfirmDialog';
import { Field } from '../../design-system/Field';
import { Select } from '../../design-system/Select';
import { useToast } from '../../design-system/useToast';
import { useSessionStore } from '../../store/session.store';
import {
  fabricMappingFormSchema,
  type FabricMappingFormValues,
} from '../../validation/style.schema';
import styles from './StyleEditPage.module.css';

/** FR-FB-03: one or more fabrics mapped to a style, each with a placement (body, rib, pocket bag, lining, ...). */
export function FabricMappingManager({
  styleId,
  fabrics,
  canEdit,
}: {
  styleId: string;
  fabrics: FabricMapping[];
  canEdit: boolean;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [pendingRemove, setPendingRemove] = useState<FabricMapping | null>(null);
  // A read-only viewer of a style (e.g. PROD) may hold style:read without fabric:read —
  // fetching the lookup list for them would just 403. Fall back to showing the raw id.
  const canReadFabrics = useSessionStore((state) => state.permissions.includes('fabric:read'));

  const fabricsQuery = useQuery({
    queryKey: ['fabrics', 'all-active'],
    queryFn: () => listFabrics({ limit: 200, isActive: true }),
    enabled: canReadFabrics,
  });
  const fabricName = (id: string) => {
    const fabric = fabricsQuery.data?.data.find((f) => f.id === id);
    return fabric ? `${fabric.code} — ${fabric.description}` : id;
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FabricMappingFormValues>({ resolver: zodResolver(fabricMappingFormSchema) });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['style', styleId] });

  const addMutation = useMutation({
    mutationFn: (values: FabricMappingFormValues) => addFabricMapping(styleId, values),
    onSuccess: () => {
      invalidate();
      reset({ fabricId: '', placement: '' });
    },
    onError: (err) => toast.show(toApiError(err).message, 'danger'),
  });

  const removeMutation = useMutation({
    mutationFn: (mappingId: string) => removeFabricMapping(styleId, mappingId),
    onSuccess: () => {
      invalidate();
      setPendingRemove(null);
    },
    onError: (err) => toast.show(toApiError(err).message, 'danger'),
  });

  return (
    <div>
      <h2 className={styles.sectionTitle}>Fabrics</h2>
      {fabrics.length === 0 && <p className={styles.emptyHint}>No fabrics mapped yet.</p>}
      <div className={styles.itemList}>
        {fabrics.map((mapping) => (
          <div key={mapping.id} className={styles.item}>
            <span className={styles.itemLabel}>
              {fabricName(mapping.fabricId)}{' '}
              <span className={styles.itemMeta}>{mapping.placement}</span>
            </span>
            {canEdit && (
              <Button variant="danger" onClick={() => setPendingRemove(mapping)}>
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
          <Select
            label="Fabric"
            wrapperClassName={styles.addRowField}
            placeholder="Select a fabric"
            options={(fabricsQuery.data?.data ?? []).map((f) => ({
              value: f.id,
              label: `${f.code} — ${f.description}`,
            }))}
            error={errors.fabricId?.message}
            {...register('fabricId')}
          />
          <Field
            label="Placement"
            placeholder="e.g. Body, Rib, Pocket bag, Lining"
            wrapperClassName={styles.addRowField}
            error={errors.placement?.message}
            {...register('placement')}
          />
          <Button type="submit" variant="secondary" loading={isSubmitting}>
            Add
          </Button>
        </form>
      )}

      <ConfirmDialog
        open={pendingRemove !== null}
        title="Remove fabric mapping"
        message={
          pendingRemove
            ? `Remove "${fabricName(pendingRemove.fabricId)}" (${pendingRemove.placement}) from this style?`
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
