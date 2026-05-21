import { z } from "zod"

// When defining your database schema, try to use snake case for column names.

export const thingSchema = z.object({
  thing_id: z.string(),
  name: z.string(),
  description: z.string(),
})
export type Thing = z.infer<typeof thingSchema>

export const paymentStatusSchema = z.enum([
  "pending",
  "completed",
  "canceled",
  "failed",
])
export type PaymentStatus = z.infer<typeof paymentStatusSchema>

export const paymentSchema = z.object({
  payment_id: z.string(),
  recipient: z.string(),
  amount: z.number().positive(),
  currency: z.string(),
  status: paymentStatusSchema,
  bounty_id: z.string().optional(),
  issue_number: z.number().int().positive().optional(),
  repository: z.string().optional(),
  idempotency_key: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type Payment = z.infer<typeof paymentSchema>

export const databaseSchema = z.object({
  idCounter: z.number().default(0),
  things: z.array(thingSchema).default([]),
  paymentIdCounter: z.number().default(0),
  payments: z.array(paymentSchema).default([]),
})
export type DatabaseSchema = z.infer<typeof databaseSchema>
