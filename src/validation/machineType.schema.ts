import { z } from 'zod';
import { THREAD_LINE_ROLES } from '../types/threadLineRole';

/** Mirrors server/src/validators/machineType.schema.ts (no shared package — see server README). */

export const threadLineTemplateEntrySchema = z.object({
  role: z.enum(THREAD_LINE_ROLES),
  included: z.boolean(),
  defaultCount: z.coerce.number().int().min(1, 'Count must be at least 1 when a role is included.'),
  defaultFactor: z.coerce
    .number()
    .positive('Factor must be a positive number.')
    .multipleOf(0.01, 'Factor accepts up to two decimal places.'),
});

export const machineTypeFormSchema = z
  .object({
    code: z.string().trim().min(1, 'Code is required.'),
    name: z.string().trim().min(1, 'Name is required.'),
    stitchClass: z.string().trim().min(1, 'Stitch class is required.'),
    family: z.string().trim().min(1, 'Family is required.'),
    threadLineTemplate: z.array(threadLineTemplateEntrySchema),
  })
  // FR-LK-02, enforced client-side too so the error surfaces before a round trip.
  .refine((data) => data.threadLineTemplate.some((line) => line.included), {
    message:
      'At least one thread line role must be included — a machine with no included role would consume no thread.',
    path: ['threadLineTemplate'],
  });

export type MachineTypeFormValues = z.infer<typeof machineTypeFormSchema>;
