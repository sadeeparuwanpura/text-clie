import { z } from 'zod';

/** Mirrors server/src/validators/threadAssignment.schema.ts. */

const shadeByColourwaySchema = z.object({
  colourwayId: z.string(),
  shadeCode: z.string().trim().min(1, 'Shade code is required.'),
});

export const assignmentFormSchema = z.object({
  varietyId: z.string().min(1, 'Select a thread variety.'),
  ticket: z.coerce.number().int().positive('Ticket must be a positive whole number.'),
  coneLengthM: z.coerce.number().positive('Cone length must be greater than zero.'),
  unitPrice: z.coerce.number().min(0),
  currency: z.string().trim().length(3).optional(),
  shadeByColourway: z.array(shadeByColourwaySchema),
});
export type AssignmentFormValues = z.infer<typeof assignmentFormSchema>;
