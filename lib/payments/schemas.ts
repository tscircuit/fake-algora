import { paymentSchema } from "lib/db/schema"
import { z } from "zod"

export const sendPaymentBodySchema = z.object({
  recipient: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(1).default("USD"),
  bounty_id: z.string().min(1).optional(),
  issue_number: z.number().int().positive().optional(),
  repository: z.string().min(1).optional(),
  idempotency_key: z.string().min(1).optional(),
  note: z.string().optional(),
})

export const paymentResponseSchema = z.object({
  payment: paymentSchema,
})

export const sendPaymentResponseSchema = paymentResponseSchema.extend({
  idempotent_replay: z.boolean(),
})

export const nullablePaymentResponseSchema = z.object({
  payment: paymentSchema.nullable(),
})

export const listPaymentsResponseSchema = z.object({
  payments: z.array(paymentSchema),
})

export const transitionPaymentBodySchema = z.object({
  payment_id: z.string().min(1),
})
