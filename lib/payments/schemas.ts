import { paymentSchema, paymentStatusSchema } from "lib/db/schema"
import { z } from "zod"

export const sendPaymentRequestSchema = z
  .object({
    recipient_email: z.string().email(),
    amount_cents: z.number().int().positive().optional(),
    amount_usd: z.number().positive().optional(),
    currency: z.string().min(1).default("usd"),
    bounty_issue_url: z.string().url().optional(),
    note: z.string().optional(),
    idempotency_key: z.string().min(1).optional(),
  })
  .refine(
    (body) => body.amount_cents !== undefined || body.amount_usd !== undefined,
    "amount_cents or amount_usd is required",
  )

export const paymentResponseSchema = z.object({
  payment: paymentSchema,
})

export const errorResponseSchema = z.object({
  error: z.unknown(),
})

export const paymentRouteResponseSchema = z.union([
  paymentResponseSchema,
  errorResponseSchema,
])

export const paymentListResponseSchema = z.object({
  payments: z.array(paymentSchema),
})

export const paymentListRouteResponseSchema = z.union([
  paymentListResponseSchema,
  errorResponseSchema,
])

export const getPaymentRequestSchema = z.object({
  payment_id: z.string().min(1),
})

export const updatePaymentStatusRequestSchema = z.object({
  payment_id: z.string().min(1),
})

export const updatePaymentStatusResponseSchema = z.object({
  payment: paymentSchema,
})

export const updatePaymentStatusRouteResponseSchema = z.union([
  updatePaymentStatusResponseSchema,
  errorResponseSchema,
])

export type SendPaymentRequest = z.infer<typeof sendPaymentRequestSchema>
export type PaymentStatus = z.infer<typeof paymentStatusSchema>

export function toAmountCents(body: SendPaymentRequest): number {
  if (body.amount_cents !== undefined) return body.amount_cents
  return Math.round(body.amount_usd! * 100)
}

export { paymentStatusSchema }
