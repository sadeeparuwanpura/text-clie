import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../../api/auth.api';
import { toApiError } from '../../api/httpClient';
import { Button } from '../../design-system/Button';
import { Field } from '../../design-system/Field';
import { resetPasswordSchema, type ResetPasswordFormValues } from '../../validation/auth.schema';
import { AuthLayout } from './AuthLayout';
import styles from './AuthLayout.module.css';

/**
 * Handles both flows the backend's single reset-password endpoint serves: a forgotten
 * password reset, and a brand-new account's first-login "set your password" link — the
 * server doesn't distinguish them, so neither does this page.
 */
export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit(values: ResetPasswordFormValues) {
    setFormError(null);
    try {
      const result = await resetPassword(token, values.newPassword);
      setMessage(result.message);
    } catch (err) {
      setFormError(toApiError(err).message);
    }
  }

  if (!token) {
    return (
      <AuthLayout title="Set your password">
        <div className={styles.formError} role="alert">
          This link is missing its reset token. Request a new one from the sign-in page.
        </div>
        <div className={styles.footer}>
          <Link to="/forgot-password">Request a new link</Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set your password">
      {message ? (
        <>
          <div className={styles.formSuccess} role="status">
            {message}
          </div>
          <div className={styles.footer}>
            <Link to="/login">Continue to sign in</Link>
          </div>
        </>
      ) : (
        <>
          <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
            {formError && (
              <div className={styles.formError} role="alert">
                {formError}
              </div>
            )}
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
            <Button
              type="submit"
              variant="primary"
              className={styles.submit}
              loading={isSubmitting}
            >
              Set password
            </Button>
          </form>
          <div className={styles.footer}>
            <Link to="/login">Back to sign in</Link>
          </div>
        </>
      )}
    </AuthLayout>
  );
}
