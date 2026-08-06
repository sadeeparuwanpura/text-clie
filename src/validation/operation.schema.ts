import { z } from 'zod';
import { THREAD_LINE_ROLES } from '../types/threadLineRole';

/** Mirrors server/src/validators/operation.schema.ts (no shared package — see server README). */

export const operationFormSchema = z.object({
  name: z.string().trim().min(1, 'Operation name is required.'),
  section: z.string().trim().optional(),
  seamLengthCm: z.coerce.number().positive('Seam length must be greater than zero.'),
  reps: z.coerce.number().int().positive('Repetitions must be a positive whole number.'),
  spi: z.coerce
    .number()
    .min(4, 'Stitch density must be between 4 and 30.')
    .max(30, 'Stitch density must be between 4 and 30.'),
  note: z.string().trim().optional(),
  fabricId: z.string().optional(),
});
export type OperationFormValues = z.infer<typeof operationFormSchema>;

const threadLineFormSchema = z.object({
  role: z.enum(THREAD_LINE_ROLES),
  included: z.boolean(),
  count: z.coerce.number().int().min(0),
  factor: z.coerce.number().min(0),
});

export const threadLinesFormSchema = z.object({
  threadLines: z.array(threadLineFormSchema),
});
export type ThreadLinesFormValues = z.infer<typeof threadLinesFormSchema>;
