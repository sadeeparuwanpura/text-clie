import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../../api/auth.api';
import { toApiError } from '../../api/httpClient';
import { Button } from '../../design-system/Button';
import { Field } from '../../design-system/Field';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../../validation/auth.schema';
import { AuthLayout } from './AuthLayout';
import styles from './AuthLayout.module.css';

export function ForgotPasswordPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setFormError(null);
    try {
      const result = await forgotPassword(values.email);
      // Deliberately the same message regardless of whether the address is registered
      // (FR-AU-03) — the backend already enforces this, this just displays what it sent.
      setMessage(result.message);
    } catch (err) {
      setFormError(toApiError(err).message);
    }
  }

  return (
    <AuthLayout title="Reset your password" subtitle="We'll email you a link to set a new one.">
      {message ? (
        <div className={styles.formSuccess} role="status">
          {message}
        </div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          {formError && (
            <div className={styles.formError} role="alert">
              {formError}
            </div>
          )}
          <Field
            label="Email"
            type="email"
            autoComplete="username"
            error={errors.email?.message}
            {...register('email')}
          />
          <Button type="submit" variant="primary" className={styles.submit} loading={isSubmitting}>
            Send reset link
          </Button>
        </form>
      )}
      <div className={styles.footer}>
        <Link to="/login">Back to sign in</Link>
      </div>
    </AuthLayout>
  );
}
