import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import styles from './Field.module.css';

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  /** Class applied to the outer label+input+error wrapper — `className` itself styles the <input>. */
  wrapperClassName?: string;
}

/**
 * Label + input + hint + error, wired for react-hook-form's register() spread. Errors are
 * associated with the field via aria-describedby and the input is marked aria-invalid, so
 * assistive technology announces them (FR-AC-06) — "invalid input" alone is never enough,
 * the message itself must say what's wrong and what's acceptable (that's supplied by the
 * calling form's validation schema, this component just renders it).
 */
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, hint, required, id, className, wrapperClassName, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ');

  return (
    <div className={[styles.group, wrapperClassName].filter(Boolean).join(' ')}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        )}
      </label>
      <input
        ref={ref}
        id={inputId}
        className={[styles.input, className].filter(Boolean).join(' ')}
        data-invalid={Boolean(error)}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy || undefined}
        aria-required={required || undefined}
        required={required}
        {...rest}
      />
      {hint && !error && (
        <span id={hintId} className={styles.hint}>
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
});
