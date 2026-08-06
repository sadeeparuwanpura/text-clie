import { z } from 'zod';

/** Mirrors server/src/validators/fabric.schema.ts (no shared package — see server README). */
export const fabricFormSchema = z.object({
  code: z.string().trim().min(1, 'Code is required.'),
  description: z.string().trim().min(1, 'Description is required.'),
  family: z.string().trim().min(1, 'Family is required.'),
  construction: z.string().trim().min(1, 'Construction is required.'),
  composition: z.string().trim().min(1, 'Composition is required.'),
  gsm: z.coerce.number().positive('Weight (GSM) must be a positive number.'),
  thicknessMm: z.coerce.number().positive('Thickness must be a positive number.'),
  finish: z.string().trim().default(''),
  shrinkagePct: z.coerce.number().min(0, 'Shrinkage cannot be negative.'),
});

export type FabricFormValues = z.infer<typeof fabricFormSchema>;
