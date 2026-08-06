/** Mirrors server/src/types/threadLineRole.ts — the 6 thread line roles (SRS FR-MI-02). */
export const THREAD_LINE_ROLES = [
  'Needle',
  'Bobbin',
  'Upper looper',
  'Lower looper',
  'Looper',
  'Spreader',
] as const;

export type ThreadLineRole = (typeof THREAD_LINE_ROLES)[number];

/** CSS custom property per role — the single source of truth for the fixed role colour (FR-UI-07). */
export const THREAD_ROLE_COLOR_VAR: Record<ThreadLineRole, string> = {
  Needle: 'var(--tcms-role-needle)',
  Bobbin: 'var(--tcms-role-bobbin)',
  'Upper looper': 'var(--tcms-role-upper-looper)',
  'Lower looper': 'var(--tcms-role-lower-looper)',
  Looper: 'var(--tcms-role-looper)',
  Spreader: 'var(--tcms-role-spreader)',
};
