import { z } from 'zod';
import { THREAD_LINE_ROLES } from '../types/threadLineRole';

/** Mirrors server/src/validators/threadVariety.schema.ts (no shared package — see server README). */
export const threadVarietyFormSchema = z.object({
  code: z.string().trim().min(1, 'Code is required.'),
  name: z.string().trim().min(1, 'Name is required.'),
  construction: z.string().trim().min(1, 'Construction is required.'),
  fibre: z.string().trim().min(1, 'Fibre is required.'),
  recommendedRoles: z.array(z.enum(THREAD_LINE_ROLES)),
});

export type ThreadVarietyFormValues = z.infer<typeof threadVarietyFormSchema>;
