import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { login } from '../../api/auth.api';
import { toApiError } from '../../api/httpClient';
import { Button } from '../../design-system/Button';
import { Field } from '../../design-system/Field';
import { useSessionStore } from '../../store/session.store';
import { loginSchema, type LoginFormValues } from '../../validation/auth.schema';
import { AuthLayout } from './AuthLayout';
import styles from './AuthLayout.module.css';

export function LoginPage() {
  const status = useSessionStore((state) => state.status);
  const setSession = useSessionStore((state) => state.setSession);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  if (status === 'authenticated' || status === 'mustChangePassword') {
    return <Navigate to={searchParams.get('redirect') ?? '/'} replace />;
  }

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    try {
      const result = await login(values.email, values.password);
      setSession({
        accessToken: result.accessToken,
        user: result.user,
        permissions: result.permissions,
      });
      navigate(searchParams.get('redirect') ?? '/', { replace: true });
    } catch (err) {
      setFormError(toApiError(err).message);
    }
  }

  return (
    <AuthLayout title="Sign in" subtitle="Thread Consumption Management System">
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
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" variant="primary" className={styles.submit} loading={isSubmitting}>
          Sign in
        </Button>
      </form>
      <div className={styles.footer}>
        <Link to="/forgot-password">Forgot your password?</Link>
      </div>
    </AuthLayout>
  );
}
