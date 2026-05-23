import { paymentSchema } from "lib/db/schema"
import { z } from "zod"

export const paymentResponseSchema = z.object({
  payment: paymentSchema,
})

export const paymentsResponseSchema = z.object({
  payments: z.array(paymentSchema),
})

export const paymentErrorResponseSchema = z.object({
  error: z.string(),
})
