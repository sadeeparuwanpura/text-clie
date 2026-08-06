import { z } from 'zod';
import { THREAD_LINE_ROLES } from '../types/threadLineRole';

/** Mirrors server/src/validators/sewOff.schema.ts. */

export const recordSewOffFormSchema = z.object({
  operationId: z.string().min(1, 'Select an operation.'),
  role: z.enum(THREAD_LINE_ROLES),
  measuredMetres: z.coerce.number().positive('Measured length must be greater than zero.'),
  garmentsSewn: z.coerce.number().int().positive('Garments sewn must be a positive whole number.'),
  notes: z.string().trim().optional(),
});
export type RecordSewOffFormValues = z.infer<typeof recordSewOffFormSchema>;
