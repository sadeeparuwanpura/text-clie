import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import styles from './Field.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
  hint?: string;
  placeholder?: string;
  /** Class applied to the outer label+select+error wrapper — `className` itself styles the <select>. */
  wrapperClassName?: string;
}

/** Native <select> — free keyboard search/typeahead and screen-reader support come for free. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, error, hint, required, id, placeholder, className, wrapperClassName, ...rest },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const errorId = `${selectId}-error`;
  const hintId = `${selectId}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ');

  return (
    <div className={[styles.group, wrapperClassName].filter(Boolean).join(' ')}>
      <label className={styles.label} htmlFor={selectId}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        )}
      </label>
      <select
        ref={ref}
        id={selectId}
        className={[styles.input, className].filter(Boolean).join(' ')}
        data-invalid={Boolean(error)}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy || undefined}
        required={required}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
