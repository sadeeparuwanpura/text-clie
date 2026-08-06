import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { createFabric, getFabric, updateFabric } from '../../../api/fabric.api';
import { toApiError } from '../../../api/httpClient';
import { SplashScreen } from '../../../app/SplashScreen';
import { Button } from '../../../design-system/Button';
import { Field } from '../../../design-system/Field';
import { useToast } from '../../../design-system/useToast';
import { fabricFormSchema, type FabricFormValues } from '../../../validation/fabric.schema';
import styles from './FabricEditPage.module.css';

const EMPTY_DEFAULTS: FabricFormValues = {
  code: '',
  description: '',
  family: '',
  construction: '',
  composition: '',
  gsm: 0,
  thicknessMm: 0,
  finish: '',
  shrinkagePct: 0,
};

export function FabricEditPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const existingQuery = useQuery({
    queryKey: ['fabric', id],
    queryFn: () => getFabric(id!),
    enabled: mode === 'edit' && Boolean(id),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FabricFormValues>({
    resolver: zodResolver(fabricFormSchema),
    defaultValues: EMPTY_DEFAULTS,
  });

  useEffect(() => {
    if (mode === 'edit' && existingQuery.data) {
      const {
        code,
        description,
        family,
        construction,
        composition,
        gsm,
        thicknessMm,
        finish,
        shrinkagePct,
      } = existingQuery.data;
      reset({
        code,
        description,
        family,
        construction,
        composition,
        gsm,
        thicknessMm,
        finish,
        shrinkagePct,
      });
    }
  }, [mode, existingQuery.data, reset]);

  const mutation = useMutation({
    mutationFn: (values: FabricFormValues) =>
      mode === 'create' ? createFabric(values) : updateFabric(id!, values),
    onSuccess: (result) => {
      toast.show(`${result.code} — ${result.description} saved.`, 'success');
      void queryClient.invalidateQueries({ queryKey: ['fabrics'] });
      navigate('/masters/fabrics');
    },
  });

  if (mode === 'edit' && existingQuery.isLoading) return <SplashScreen />;
  if (mode === 'edit' && existingQuery.isError) {
    return <p role="alert">{toApiError(existingQuery.error).message}</p>;
  }

  return (
    <div className={styles.page}>
      <h1>{mode === 'create' ? 'New fabric' : `Edit ${existingQuery.data?.code ?? ''}`}</h1>

      <form
        className={styles.card}
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        noValidate
      >
        {mutation.isError && (
          <div className={styles.formError} role="alert">
            {toApiError(mutation.error).message}
          </div>
        )}

        <div className={styles.grid}>
          <Field label="Code" required error={errors.code?.message} {...register('code')} />
          <Field
            label="Description"
            required
            error={errors.description?.message}
            {...register('description')}
          />
          <Field label="Family" required error={errors.family?.message} {...register('family')} />
          <Field
            label="Construction"
            required
            error={errors.construction?.message}
            {...register('construction')}
          />
          <Field
            label="Composition"
            required
            error={errors.composition?.message}
            {...register('composition')}
          />
          <Field label="Finish" error={errors.finish?.message} {...register('finish')} />
          <Field
            label="Weight (GSM)"
            type="number"
            step="0.01"
            required
            error={errors.gsm?.message}
            {...register('gsm', { valueAsNumber: true })}
          />
          <Field
            label="Thickness (mm)"
            type="number"
            step="0.01"
            required
            error={errors.thicknessMm?.message}
            {...register('thicknessMm', { valueAsNumber: true })}
          />
          <Field
            label="Shrinkage (%)"
            type="number"
            step="0.01"
            required
            error={errors.shrinkagePct?.message}
            {...register('shrinkagePct', { valueAsNumber: true })}
          />
        </div>

        <div className={styles.actions}>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            Save
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/masters/fabrics')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
