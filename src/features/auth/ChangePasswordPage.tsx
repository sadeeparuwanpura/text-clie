import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { changePassword, me } from '../../api/auth.api';
import { toApiError } from '../../api/httpClient';
import { Button } from '../../design-system/Button';
import { Field } from '../../design-system/Field';
import { useToast } from '../../design-system/useToast';
import { useSessionStore } from '../../store/session.store';
import { changePasswordSchema, type ChangePasswordFormValues } from '../../validation/auth.schema';
import { AuthLayout } from './AuthLayout';
import styles from './AuthLayout.module.css';

export function ChangePasswordPage() {
  const status = useSessionStore((state) => state.status);
  const accessToken = useSessionStore((state) => state.accessToken);
  const setSession = useSessionStore((state) => state.setSession);
  const navigate = useNavigate();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({ resolver: zodResolver(changePasswordSchema) });

  const forced = status === 'mustChangePassword';

  async function onSubmit(values: ChangePasswordFormValues) {
    setFormError(null);
    try {
      await changePassword(values.currentPassword, values.newPassword);
      // Refresh the profile so mustChangePassword flips to false in the store — this is
      // what lets RouteGuard stop redirecting here on the next navigation.
      if (accessToken) {
        const profile = await me();
        setSession({ accessToken, user: profile, permissions: profile.permissions });
      }
      toast.show('Password changed.', 'success');
      navigate('/', { replace: true });
    } catch (err) {
      setFormError(toApiError(err).message);
    }
  }

  return (
    <AuthLayout
      title="Set a new password"
      subtitle={
        forced ? 'Your administrator requires a password change before you continue.' : undefined
      }
    >
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && (
          <div className={styles.formError} role="alert">
            {formError}
          </div>
        )}
        <Field
          label="Current password"
          type="password"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />
        <Field
          label="New password"
          type="password"
          autoComplete="new-password"
          hint="At least 10 characters. Avoid common or guessable passwords."
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <Field
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" variant="primary" className={styles.submit} loading={isSubmitting}>
          Change password
        </Button>
      </form>
      {!forced && (
        <div className={styles.footer}>
          <Link to="/">Cancel</Link>
        </div>
      )}
    </AuthLayout>
  );
}
