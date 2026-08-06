import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toApiError } from '../../api/httpClient';
import { listBuyers, listSeasons, listStyleTypes } from '../../api/lookup.api';
import { createStyle, duplicateStyle, getStyle, updateStyle } from '../../api/style.api';
import { SplashScreen } from '../../app/SplashScreen';
import { Button } from '../../design-system/Button';
import { Field } from '../../design-system/Field';
import { Select } from '../../design-system/Select';
import { useToast } from '../../design-system/useToast';
import { useSessionStore } from '../../store/session.store';
import {
  parseSizeRange,
  styleFormSchema,
  type StyleFormValues,
} from '../../validation/style.schema';
import { ColourwayManager } from './ColourwayManager';
import { DuplicateStyleDialog } from './DuplicateStyleDialog';
import { FabricMappingManager } from './FabricMappingManager';
import styles from './StyleEditPage.module.css';

const EMPTY_DEFAULTS: StyleFormValues = {
  styleNo: '',
  name: '',
  buyerId: '',
  seasonId: '',
  styleTypeId: '',
  orderQty: 0,
  sizeRangeText: '',
  midSize: '',
  targetDeliveryDate: '',
};

export function StyleEditPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const permissions = useSessionStore((state) => state.permissions);
  const canWrite = permissions.includes('style:write');
  const [duplicateOpen, setDuplicateOpen] = useState(false);

  const buyersQuery = useQuery({ queryKey: ['buyers', 'active'], queryFn: () => listBuyers(true) });
  const seasonsQuery = useQuery({
    queryKey: ['seasons', 'active'],
    queryFn: () => listSeasons(true),
  });
  const styleTypesQuery = useQuery({
    queryKey: ['style-types', 'active'],
    queryFn: () => listStyleTypes(true),
  });

  const existingQuery = useQuery({
    queryKey: ['style', id],
    queryFn: () => getStyle(id!),
    enabled: mode === 'edit' && Boolean(id),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StyleFormValues>({
    resolver: zodResolver(styleFormSchema),
    defaultValues: EMPTY_DEFAULTS,
  });

  useEffect(() => {
    if (mode === 'edit' && existingQuery.data) {
      const s = existingQuery.data;
      reset({
        styleNo: s.styleNo,
        name: s.name,
        buyerId: s.buyerId,
        seasonId: s.seasonId,
        styleTypeId: s.styleTypeId,
        orderQty: s.orderQty,
        sizeRangeText: s.sizeRange.join(', '),
        midSize: s.midSize,
        targetDeliveryDate: s.targetDeliveryDate ? s.targetDeliveryDate.slice(0, 10) : '',
      });
    }
  }, [mode, existingQuery.data, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: StyleFormValues) => {
      const payload = {
        styleNo: values.styleNo,
        name: values.name,
        buyerId: values.buyerId,
        seasonId: values.seasonId,
        styleTypeId: values.styleTypeId,
        orderQty: values.orderQty,
        sizeRange: parseSizeRange(values.sizeRangeText),
        midSize: values.midSize,
        targetDeliveryDate: values.targetDeliveryDate || undefined,
      };
      return mode === 'create' ? createStyle(payload) : updateStyle(id!, payload);
    },
    onSuccess: (result) => {
      toast.show(`${result.styleNo} — ${result.name} saved.`, 'success');
      void queryClient.invalidateQueries({ queryKey: ['styles'] });
      if (mode === 'create') {
        navigate(`/styles/${result.id}`, { replace: true });
      } else {
        void queryClient.invalidateQueries({ queryKey: ['style', id] });
      }
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (styleNo: string) => duplicateStyle(id!, { styleNo }),
    onSuccess: (result) => {
      toast.show(`Duplicated into ${result.styleNo}.`, 'success');
      void queryClient.invalidateQueries({ queryKey: ['styles'] });
      setDuplicateOpen(false);
      navigate(`/styles/${result.id}`);
    },
    onError: (err) => toast.show(toApiError(err).message, 'danger'),
  });

  if (mode === 'edit' && existingQuery.isLoading) return <SplashScreen />;
  if (mode === 'edit' && existingQuery.isError) {
    return <p role="alert">{toApiError(existingQuery.error).message}</p>;
  }

  const buyerOptions = (buyersQuery.data ?? []).map((b) => ({ value: b.id, label: b.name }));
  const seasonOptions = (seasonsQuery.data ?? []).map((s) => ({ value: s.id, label: s.name }));
  const styleTypeOptions = (styleTypesQuery.data ?? []).map((t) => ({
    value: t.id,
    label: t.name,
  }));

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h1>{mode === 'create' ? 'New style' : existingQuery.data?.styleNo}</h1>
        {mode === 'edit' && existingQuery.data && (
          <div className={styles.actions}>
            <span className={styles.statusChip}>{existingQuery.data.status}</span>
            <Button
              variant="primary"
              onClick={() => navigate(`/styles/${existingQuery.data!.id}/chain/operations`)}
            >
              Build the chain
            </Button>
            {canWrite && (
              <Button variant="secondary" onClick={() => setDuplicateOpen(true)}>
                Duplicate
              </Button>
            )}
          </div>
        )}
      </div>

      <form
        className={styles.card}
        onSubmit={handleSubmit((values) => saveMutation.mutate(values))}
        noValidate
      >
        {saveMutation.isError && (
          <div className={styles.formError} role="alert">
            {toApiError(saveMutation.error).message}
          </div>
        )}

        <fieldset disabled={!canWrite} className={styles.fieldset}>
          <div className={styles.grid}>
            <Field
              label="Style number"
              required
              error={errors.styleNo?.message}
              {...register('styleNo')}
            />
            <Field label="Name" required error={errors.name?.message} {...register('name')} />
            <Select
              label="Buyer"
              required
              placeholder="Select a buyer"
              options={buyerOptions}
              error={errors.buyerId?.message}
              {...register('buyerId')}
            />
            <Select
              label="Season"
              required
              placeholder="Select a season"
              options={seasonOptions}
              error={errors.seasonId?.message}
              {...register('seasonId')}
            />
            <Select
              label="Style type"
              required
              placeholder="Select a style type"
              options={styleTypeOptions}
              error={errors.styleTypeId?.message}
              {...register('styleTypeId')}
            />
            <Field
              label="Order quantity"
              type="number"
              required
              error={errors.orderQty?.message}
              {...register('orderQty', { valueAsNumber: true })}
            />
            <Field
              label="Size range"
              required
              hint="Comma-separated, e.g. S, M, L, XL"
              error={errors.sizeRangeText?.message}
              {...register('sizeRangeText')}
            />
            <Field
              label="Mid size"
              required
              error={errors.midSize?.message}
              {...register('midSize')}
            />
            <Field
              label="Target delivery date"
              type="date"
              error={errors.targetDeliveryDate?.message}
              {...register('targetDeliveryDate')}
            />
          </div>
        </fieldset>

        <div className={styles.actions}>
          {canWrite && (
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Save
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={() => navigate('/styles')}>
            {mode === 'create' ? 'Cancel' : 'Back to list'}
          </Button>
        </div>
      </form>

      {mode === 'edit' && existingQuery.data && (
        <>
          <div className={styles.card}>
            <ColourwayManager
              styleId={existingQuery.data.id}
              colourways={existingQuery.data.colourways}
              canEdit={canWrite}
            />
          </div>
          <div className={styles.card}>
            <FabricMappingManager
              styleId={existingQuery.data.id}
              fabrics={existingQuery.data.fabrics}
              canEdit={canWrite}
            />
          </div>
          <DuplicateStyleDialog
            open={duplicateOpen}
            sourceStyleNo={existingQuery.data.styleNo}
            loading={duplicateMutation.isPending}
            onConfirm={(styleNo) => duplicateMutation.mutate(styleNo)}
            onCancel={() => setDuplicateOpen(false)}
          />
        </>
      )}
    </div>
  );
}
