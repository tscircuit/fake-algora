import { paymentSchema, paymentStatusSchema } from "lib/db/schema"
import { z } from "zod"

export const sendPaymentBodySchema = z.object({
  recipient: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(1).default("USD"),
  bounty_id: z.string().min(1).optional(),
  issue_number: z.number().int().positive().optional(),
  repository: z.string().min(1).optional(),
  idempotency_key: z.string().min(1).optional(),
})

export const paymentResponseSchema = z.object({
  ok: z.boolean(),
  payment: paymentSchema.optional(),
  error: z.string().optional(),
})

export const paymentListResponseSchema = z.object({
  ok: z.boolean(),
  payments: z.array(paymentSchema),
  error: z.string().optional(),
})

export const paymentQuerySchema = z.object({
  status: paymentStatusSchema.optional(),
  recipient: z.string().min(1).optional(),
  repository: z.string().min(1).optional(),
})

export const paymentIdBodySchema = z.object({
  payment_id: z.string().min(1),
})
