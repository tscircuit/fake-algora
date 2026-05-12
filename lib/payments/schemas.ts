import { paymentSchema, paymentStatusSchema } from "lib/db/schema"
import { z } from "zod"

export const sendPaymentRequestSchema = z.object({
  recipient: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(3).max(12).default("USD"),
  bounty_id: z.string().min(1).optional(),
  issue_number: z.number().int().positive().optional(),
  repository: z.string().min(1).optional(),
  idempotency_key: z.string().min(1).optional(),
})

export const paymentResponseSchema = z.object({
  ok: z.literal(true),
  payment: paymentSchema,
})

export const paymentListResponseSchema = z.object({
  payments: z.array(paymentSchema),
})

export const paymentErrorResponseSchema = z.object({
  ok: z.literal(false),
  error: z.string(),
})

export const paymentResponseOrErrorSchema = z.union([
  paymentResponseSchema,
  paymentErrorResponseSchema,
])

export const paymentStatusTransitionRequestSchema = z.object({
  payment_id: z.string().min(1),
})

export const failPaymentRequestSchema =
  paymentStatusTransitionRequestSchema.extend({
    reason: z.string().min(1).optional(),
  })

export const paymentListQuerySchema = z.object({
  recipient: z.string().optional(),
  status: paymentStatusSchema.optional(),
  repository: z.string().optional(),
  bounty_id: z.string().optional(),
})
