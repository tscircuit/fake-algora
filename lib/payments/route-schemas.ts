import { paymentSchema, paymentStatusSchema } from "lib/db/schema"
import { z } from "zod"

export const sendPaymentBodySchema = z.object({
  recipient_email: z.string().email(),
  amount_cents: z.number().int().positive(),
  currency: z.string().length(3).default("usd"),
  bounty_id: z.string().min(1).optional(),
  issue_number: z.number().int().positive().optional(),
  repository: z.string().min(1).optional(),
  idempotency_key: z.string().min(1).optional(),
})

export const listPaymentsQuerySchema = z.object({
  status: paymentStatusSchema.optional(),
  recipient_email: z.string().email().optional(),
  repository: z.string().min(1).optional(),
})

export const paymentIdBodySchema = z.object({
  payment_id: z.string().min(1),
})

export const paymentIdQuerySchema = paymentIdBodySchema

export const paymentSuccessResponseSchema = z.object({
  ok: z.literal(true),
  payment: paymentSchema,
})

export const paymentErrorResponseSchema = z.object({
  ok: z.literal(false),
  error: z.string(),
})

export const paymentLookupResponseSchema = z.union([
  paymentSuccessResponseSchema,
  paymentErrorResponseSchema,
])

export const sendPaymentResponseSchema = z.object({
  ok: z.literal(true),
  payment: paymentSchema,
  idempotent_replay: z.boolean(),
})

export const listPaymentsResponseSchema = z.object({
  ok: z.literal(true),
  payments: z.array(paymentSchema),
})
