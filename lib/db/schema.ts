import { z } from "zod"

// When defining your database schema, try to use snake case for column names.

export const thingSchema = z.object({
  thing_id: z.string(),
  name: z.string(),
  description: z.string(),
})
export type Thing = z.infer<typeof thingSchema>

export const paymentStatusSchema = z.enum(["sent", "failed"])

export const paymentSchema = z.object({
  payment_id: z.string(),
  recipient: z.string(),
  amount_usd: z.number().positive(),
  memo: z.string().optional(),
  idempotency_key: z.string().optional(),
  status: paymentStatusSchema,
  created_at: z.string(),
  sent_at: z.string().optional(),
  failure_reason: z.string().optional(),
})
export type Payment = z.infer<typeof paymentSchema>
export type PaymentStatus = z.infer<typeof paymentStatusSchema>

export const databaseSchema = z.object({
  idCounter: z.number().default(0),
  things: z.array(thingSchema).default([]),
  paymentIdCounter: z.number().default(0),
  payments: z.array(paymentSchema).default([]),
})
export type DatabaseSchema = z.infer<typeof databaseSchema>
