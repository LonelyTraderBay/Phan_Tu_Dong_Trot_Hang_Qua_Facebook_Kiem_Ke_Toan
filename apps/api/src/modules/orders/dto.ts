import { z } from 'zod';

const JsonObjectSchema = z.record(z.unknown());
const PaymentMethodSchema = z.enum(['cod', 'bank_transfer', 'other']);
export const OrderStatusSchema = z.enum([
  'draft',
  'confirmed',
  'shipped',
  'done',
  'cancelled',
  'returned',
]);
const PhoneE164Schema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{1,14}$/, 'Expected an E.164 phone number');

export const CreateDraftOrderBodySchema = z.object({
  conversationId: z.string().uuid().nullable().optional(),
  contactId: z.string().uuid().nullable().optional(),
  paymentMethod: PaymentMethodSchema.default('cod'),
  customerName: z.string().trim().min(1).max(256).nullable().optional(),
  phoneE164: PhoneE164Schema.nullable().optional(),
  addressText: z.string().trim().min(1).max(2_000).nullable().optional(),
  addressJson: JsonObjectSchema.default({}),
  items: z
    .array(
      z.object({
        variantId: z.string().uuid(),
        qty: z.number().int().min(1).max(999),
      }),
    )
    .min(1)
    .max(50),
});

export const ListOrdersQuerySchema = z.object({
  status: OrderStatusSchema.optional(),
});

export type CreateDraftOrderBody = z.output<typeof CreateDraftOrderBodySchema>;
export type ListOrdersQuery = z.output<typeof ListOrdersQuerySchema>;
export type OrderStatus = z.output<typeof OrderStatusSchema>;
