import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createThreadVariety,
  getThreadVariety,
  updateThreadVariety,
} from '../../../api/threadVariety.api';
import { toApiError } from '../../../api/httpClient';
import { SplashScreen } from '../../../app/SplashScreen';
import { Button } from '../../../design-system/Button';
import { Field } from '../../../design-system/Field';
import { useToast } from '../../../design-system/useToast';
import { THREAD_LINE_ROLES, THREAD_ROLE_COLOR_VAR } from '../../../types/threadLineRole';
import {
  threadVarietyFormSchema,
  type ThreadVarietyFormValues,
} from '../../../validation/threadVariety.schema';
import styles from './ThreadVarietyEditPage.module.css';

const EMPTY_DEFAULTS: ThreadVarietyFormValues = {
  code: '',
  name: '',
  construction: '',
  fibre: '',
  recommendedRoles: [],
};

export function ThreadVarietyEditPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const existingQuery = useQuery({
    queryKey: ['thread-variety', id],
    queryFn: () => getThreadVariety(id!),
    enabled: mode === 'edit' && Boolean(id),
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ThreadVarietyFormValues>({
    resolver: zodResolver(threadVarietyFormSchema),
    defaultValues: EMPTY_DEFAULTS,
  });

  useEffect(() => {
    if (mode === 'edit' && existingQuery.data) {
      reset({
        code: existingQuery.data.code,
        name: existingQuery.data.name,
        construction: existingQuery.data.construction,
        fibre: existingQuery.data.fibre,
        recommendedRoles: existingQuery.data.recommendedRoles,
      });
    }
  }, [mode, existingQuery.data, reset]);

  const mutation = useMutation({
    mutationFn: (values: ThreadVarietyFormValues) =>
      mode === 'create' ? createThreadVariety(values) : updateThreadVariety(id!, values),
    onSuccess: (result) => {
      toast.show(`${result.code} — ${result.name} saved.`, 'success');
      void queryClient.invalidateQueries({ queryKey: ['thread-varieties'] });
      navigate('/masters/thread-varieties');
    },
  });

  const selectedRoles = watch('recommendedRoles') ?? [];

  if (mode === 'edit' && existingQuery.isLoading) return <SplashScreen />;
  if (mode === 'edit' && existingQuery.isError) {
    return <p role="alert">{toApiError(existingQuery.error).message}</p>;
  }

  return (
    <div className={styles.page}>
      <h1>{mode === 'create' ? 'New thread variety' : `Edit ${existingQuery.data?.code ?? ''}`}</h1>

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
          <Field label="Name" required error={errors.name?.message} {...register('name')} />
          <Field
            label="Construction"
            required
            hint="e.g. spun, corespun, texturised, filament, bonded"
            error={errors.construction?.message}
            {...register('construction')}
          />
          <Field label="Fibre" required error={errors.fibre?.message} {...register('fibre')} />
        </div>

        <h2 className={styles.sectionTitle}>Recommended roles</h2>
        <div className={styles.roleGrid}>
          {THREAD_LINE_ROLES.map((role) => (
            <label key={role} className={styles.roleOption}>
              <input type="checkbox" value={role} {...register('recommendedRoles')} />
              <span
                className={styles.roleDot}
                style={{ background: THREAD_ROLE_COLOR_VAR[role] }}
                aria-hidden="true"
              />
              {role}
            </label>
          ))}
        </div>
        {selectedRoles.length === 0 && (
          <p className={styles.sectionTitle} role="status">
            Guidance only — a variety with no recommended roles can still be assigned anywhere.
          </p>
        )}

        <div className={styles.actions}>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            Save
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/masters/thread-varieties')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
