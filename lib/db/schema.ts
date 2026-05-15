import { z } from "zod"

// When defining your database schema, try to use snake case for column names.

export const thingSchema = z.object({
  thing_id: z.string(),
  name: z.string(),
  description: z.string(),
})
export type Thing = z.infer<typeof thingSchema>

export const paymentStatusEnum = z.enum([
  "pending",
  "completed",
  "canceled",
  "failed",
])
export type PaymentStatus = z.infer<typeof paymentStatusEnum>

export const paymentSchema = z.object({
  payment_id: z.string(),
  recipient: z.string(),
  amount: z.number(),
  currency: z.string().default("USD"),
  status: paymentStatusEnum.default("pending"),
  bounty_id: z.string().nullable().default(null),
  issue_number: z.number().nullable().default(null),
  repository: z.string().nullable().default(null),
  idempotency_key: z.string().nullable().default(null),
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
