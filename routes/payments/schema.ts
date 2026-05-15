import { paymentSchema, paymentStatusSchema } from "lib/db/schema"
import { z } from "zod"

export const paymentResponseSchema = z.object({
  payment: paymentSchema,
})

export const paymentListResponseSchema = z.object({
  payments: z.array(paymentSchema),
})

export const paymentStatusBodySchema = z.object({
  payment_id: z.string(),
})

export const paymentStatusResponseSchema = z.object({
  payment: paymentSchema.optional(),
  ok: z.boolean(),
  error: z.string().optional(),
})

export { paymentStatusSchema }
