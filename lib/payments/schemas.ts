import { paymentSchema } from "lib/db/schema"
import { z } from "zod"

export const paymentResponseSchema = paymentSchema

export const paymentErrorResponseSchema = z.object({
  error: z.string(),
})

export const paymentOrErrorResponseSchema = z.union([
  z.object({
    payment: paymentResponseSchema,
  }),
  paymentErrorResponseSchema,
])

export const paymentListResponseSchema = z.object({
  payments: z.array(paymentResponseSchema),
})

export const paymentSendBodySchema = z.object({
  recipient: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(1).default("USD"),
  bounty_id: z.string().min(1).optional(),
  issue_number: z.number().int().positive().optional(),
  repository: z.string().min(1).optional(),
  idempotency_key: z.string().min(1).optional(),
})

export const paymentIdBodySchema = z.object({
  payment_id: z.string().min(1),
})

export const sendPaymentResponseSchema = z.object({
  idempotent: z.boolean(),
  payment: paymentResponseSchema,
})
