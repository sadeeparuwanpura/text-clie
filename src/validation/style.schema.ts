import { z } from 'zod';

/** Mirrors server/src/validators/style.schema.ts (no shared package — see server README). */

export function parseSizeRange(text: string): string[] {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export const styleFormSchema = z
  .object({
    styleNo: z.string().trim().min(1, 'Style number is required.'),
    name: z.string().trim().min(1, 'Name is required.'),
    buyerId: z.string().min(1, 'Buyer is required.'),
    seasonId: z.string().min(1, 'Season is required.'),
    styleTypeId: z.string().min(1, 'Style type is required.'),
    orderQty: z.coerce.number().int().positive('Order quantity must be a positive whole number.'),
    sizeRangeText: z
      .string()
      .trim()
      .min(1, 'Enter at least one size, comma-separated (e.g. S, M, L, XL).'),
    midSize: z.string().trim().min(1, 'Mid size is required.'),
    targetDeliveryDate: z.string().optional(),
  })
  .refine((data) => parseSizeRange(data.sizeRangeText).includes(data.midSize.trim()), {
    message: 'Mid size must be one of the sizes in the size range.',
    path: ['midSize'],
  });

export type StyleFormValues = z.infer<typeof styleFormSchema>;

export const colourwayFormSchema = z.object({
  name: z.string().trim().min(1, 'Colourway name is required.'),
  shadeCode: z.string().trim().min(1, 'Shade code is required.'),
});
export type ColourwayFormValues = z.infer<typeof colourwayFormSchema>;

export const fabricMappingFormSchema = z.object({
  fabricId: z.string().min(1, 'Select a fabric.'),
  placement: z
    .string()
    .trim()
    .min(1, 'Placement is required (e.g. body, rib, pocket bag, lining).'),
});
export type FabricMappingFormValues = z.infer<typeof fabricMappingFormSchema>;

export const duplicateStyleFormSchema = z.object({
  styleNo: z.string().trim().min(1, 'New style number is required.'),
});
export type DuplicateStyleFormValues = z.infer<typeof duplicateStyleFormSchema>;
