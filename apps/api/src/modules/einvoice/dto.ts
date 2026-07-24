import { z } from 'zod';

export const EinvoiceProviderSchema = z.enum(['stub']);
export const EinvoiceJobStatusSchema = z.enum([
  'pending',
  'sent',
  'failed',
  'dead',
]);

export const IssueEinvoiceBodySchema = z.object({
  orderId: z.string().uuid(),
  provider: EinvoiceProviderSchema.optional().default('stub'),
});

export type EinvoiceProviderCode = z.output<typeof EinvoiceProviderSchema>;
export type EinvoiceJobStatus = z.output<typeof EinvoiceJobStatusSchema>;
export type IssueEinvoiceBody = z.output<typeof IssueEinvoiceBodySchema>;
