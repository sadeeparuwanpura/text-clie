import { z } from 'zod';

/** Mirrors server/src/validators/estimate.schema.ts. */

export const rejectEstimateFormSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(20, 'A rejection reason of at least twenty characters is required.'),
});
export type RejectEstimateFormValues = z.infer<typeof rejectEstimateFormSchema>;

export const wastageFormSchema = z.object({
  wastagePct: z.coerce.number().min(0).max(100).optional(),
});
export type WastageFormValues = z.infer<typeof wastageFormSchema>;
