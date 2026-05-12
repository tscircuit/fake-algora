import { paymentSchema, paymentStatusSchema } from "lib/db/schema"
import { z } from "zod"

export const sendPaymentRequestSchema = z.object({
  recipient: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(1).default("USD"),
  repository: z.string().min(1).optional(),
  issue_number: z.number().int().positive().optional(),
  bounty_id: z.string().min(1).optional(),
  idempotency_key: z.string().min(1).optional(),
})

export const paymentResponseSchema = z.object({
  payment: paymentSchema,
})

export const listPaymentsQuerySchema = z.object({
  status: paymentStatusSchema.optional(),
  recipient: z.string().optional(),
  repository: z.string().optional(),
})

export const listPaymentsResponseSchema = z.object({
  payments: z.array(paymentSchema),
})

export const paymentIdRequestSchema = z.object({
  payment_id: z.string().min(1),
})

export const paymentErrorResponseSchema = z.object({
  error: z.string(),
})
