import type { FieldErrors, UseFormRegister, UseFormWatch } from 'react-hook-form';
import { THREAD_LINE_ROLES, THREAD_ROLE_COLOR_VAR } from '../../../types/threadLineRole';
import type { MachineTypeFormValues } from '../../../validation/machineType.schema';
import styles from './ThreadLineTemplateEditor.module.css';

interface ThreadLineTemplateEditorProps {
  register: UseFormRegister<MachineTypeFormValues>;
  watch: UseFormWatch<MachineTypeFormValues>;
  errors: FieldErrors<MachineTypeFormValues>;
}

/**
 * One row per thread-line role, always all 6 (SRS 4.4.1: "a checkbox per thread line role
 * with a line count and an editable consumption factor"). Unchecking a role disables its
 * count/factor inputs rather than removing the row — the array index always matches
 * THREAD_LINE_ROLES order, which is what keeps this a fixed-length form instead of a
 * dynamic list.
 */
export function ThreadLineTemplateEditor({
  register,
  watch,
  errors,
}: ThreadLineTemplateEditorProps) {
  const templateError =
    errors.threadLineTemplate?.root?.message ?? errors.threadLineTemplate?.message;

  return (
    <div>
      <div className={styles.header}>
        <span aria-hidden="true"></span>
        <span>Role</span>
        <span>Count</span>
        <span>Factor (m/m seam @ 10 SPI)</span>
      </div>
      <div className={styles.wrap}>
        {THREAD_LINE_ROLES.map((role, index) => {
          const included = watch(`threadLineTemplate.${index}.included`);
          return (
            <div key={role} className={styles.row}>
              <input
                type="checkbox"
                aria-label={`Include ${role}`}
                {...register(`threadLineTemplate.${index}.included`)}
              />
              <span className={styles.roleLabel}>
                <span
                  className={styles.roleDot}
                  style={{ background: THREAD_ROLE_COLOR_VAR[role] }}
                  aria-hidden="true"
                />
                {role}
              </span>
              <input
                type="number"
                min={1}
                step={1}
                className={styles.numberInput}
                disabled={!included}
                aria-label={`${role} count`}
                {...register(`threadLineTemplate.${index}.defaultCount`, { valueAsNumber: true })}
              />
              <input
                type="number"
                min={0.01}
                step={0.01}
                className={styles.numberInput}
                disabled={!included}
                aria-label={`${role} factor`}
                {...register(`threadLineTemplate.${index}.defaultFactor`, { valueAsNumber: true })}
              />
            </div>
          );
        })}
      </div>
      {templateError && (
        <p className={styles.error} role="alert">
          {templateError}
        </p>
      )}
    </div>
  );
}
