import { z } from 'zod';

/** Mirrors server/src/validators/purchaseRequisition.schema.ts. */

export const generateRequisitionFormSchema = z.object({
  requiredBy: z.string().trim().min(1, 'Required-by date is required.'),
  overrideReason: z.string().trim().optional(),
});
export type GenerateRequisitionFormValues = z.infer<typeof generateRequisitionFormSchema>;

export const markRaisedFormSchema = z.object({
  erpDocNo: z.string().trim().min(1, 'ERP document number is required.'),
});
export type MarkRaisedFormValues = z.infer<typeof markRaisedFormSchema>;
