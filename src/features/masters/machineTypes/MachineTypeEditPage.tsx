import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createMachineType,
  getMachineType,
  updateMachineType,
  type ThreadLineTemplateEntry,
} from '../../../api/machineType.api';
import { toApiError } from '../../../api/httpClient';
import { Button } from '../../../design-system/Button';
import { Field } from '../../../design-system/Field';
import { useToast } from '../../../design-system/useToast';
import { THREAD_LINE_ROLES } from '../../../types/threadLineRole';
import {
  machineTypeFormSchema,
  type MachineTypeFormValues,
} from '../../../validation/machineType.schema';
import { SplashScreen } from '../../../app/SplashScreen';
import styles from './MachineTypeEditPage.module.css';
import { ThreadLineTemplateEditor } from './ThreadLineTemplateEditor';

function buildTemplateDefaults(
  existing?: ThreadLineTemplateEntry[],
): MachineTypeFormValues['threadLineTemplate'] {
  return THREAD_LINE_ROLES.map((role) => {
    const match = existing?.find((line) => line.role === role);
    return match ?? { role, included: false, defaultCount: 1, defaultFactor: 1 };
  });
}

const EMPTY_DEFAULTS: MachineTypeFormValues = {
  code: '',
  name: '',
  stitchClass: '',
  family: '',
  threadLineTemplate: buildTemplateDefaults(),
};

export function MachineTypeEditPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const existingQuery = useQuery({
    queryKey: ['machine-type', id],
    queryFn: () => getMachineType(id!),
    enabled: mode === 'edit' && Boolean(id),
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MachineTypeFormValues>({
    resolver: zodResolver(machineTypeFormSchema),
    defaultValues: EMPTY_DEFAULTS,
  });

  useEffect(() => {
    if (mode === 'edit' && existingQuery.data) {
      reset({
        code: existingQuery.data.code,
        name: existingQuery.data.name,
        stitchClass: existingQuery.data.stitchClass,
        family: existingQuery.data.family,
        threadLineTemplate: buildTemplateDefaults(existingQuery.data.threadLineTemplate),
      });
    }
  }, [mode, existingQuery.data, reset]);

  const mutation = useMutation({
    mutationFn: (values: MachineTypeFormValues) => {
      const input = {
        ...values,
        threadLineTemplate: values.threadLineTemplate.filter((line) => line.included),
      };
      return mode === 'create' ? createMachineType(input) : updateMachineType(id!, input);
    },
    onSuccess: (result) => {
      toast.show(`${result.code} — ${result.name} saved.`, 'success');
      void queryClient.invalidateQueries({ queryKey: ['machine-types'] });
      navigate('/masters/machine-types');
    },
  });

  if (mode === 'edit' && existingQuery.isLoading) return <SplashScreen />;
  if (mode === 'edit' && existingQuery.isError) {
    return <p role="alert">{toApiError(existingQuery.error).message}</p>;
  }

  return (
    <div className={styles.page}>
      <h1>{mode === 'create' ? 'New machine type' : `Edit ${existingQuery.data?.code ?? ''}`}</h1>

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
            label="Stitch class (ISO 4915)"
            required
            hint="e.g. 301, 401, 504, 514, 516, 406, 407, 605"
            error={errors.stitchClass?.message}
            {...register('stitchClass')}
          />
          <Field label="Family" required error={errors.family?.message} {...register('family')} />
        </div>

        <h2 className={styles.sectionTitle}>Thread line template</h2>
        <ThreadLineTemplateEditor register={register} watch={watch} errors={errors} />

        <div className={styles.actions}>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            Save
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/masters/machine-types')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
