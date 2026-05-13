import { paymentSchema, paymentStatusSchema } from "lib/db/schema"
import { z } from "zod"

export const sendPaymentBodySchema = z.object({
  recipient: z.string().min(1),
  amount_usd: z.number().positive(),
  bounty_id: z.string().min(1).optional(),
  repository: z.string().min(1).optional(),
  issue_number: z.number().int().positive().optional(),
  idempotency_key: z.string().min(1).optional(),
})

export const paymentResponseSchema = z.object({
  payment: paymentSchema,
})

export const paymentOrErrorResponseSchema = z.union([
  paymentResponseSchema,
  z.object({ error: z.string() }),
])

export const sendPaymentResponseSchema = paymentResponseSchema.extend({
  idempotent_replay: z.boolean(),
})

export const paymentListResponseSchema = z.object({
  payments: z.array(paymentSchema),
})

export const paymentStatusBodySchema = z.object({
  payment_id: z.string().min(1),
})

export const paymentStatusQuerySchema = z.object({
  status: paymentStatusSchema.optional(),
  recipient: z.string().optional(),
  repository: z.string().optional(),
})

export const paymentGetQuerySchema = z.object({
  payment_id: z.string().min(1),
})
