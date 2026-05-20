import { z } from "zod"

// When defining your database schema, try to use snake case for column names.

export const thingSchema = z.object({
  thing_id: z.string(),
  name: z.string(),
  description: z.string(),
})
export type Thing = z.infer<typeof thingSchema>

export const paymentStatusSchema = z.enum([
  "sent",
  "completed",
  "canceled",
  "failed",
])
export type PaymentStatus = z.infer<typeof paymentStatusSchema>

export const paymentSchema = z.object({
  payment_id: z.string(),
  recipient_email: z.string(),
  amount_cents: z.number().int(),
  currency: z.string(),
  status: paymentStatusSchema,
  bounty_issue_url: z.string().optional(),
  note: z.string().optional(),
  idempotency_key: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  sent_at: z.string(),
  completed_at: z.string().optional(),
  canceled_at: z.string().optional(),
  failed_at: z.string().optional(),
})
export type Payment = z.infer<typeof paymentSchema>

export const databaseSchema = z.object({
  idCounter: z.number().default(0),
  paymentIdCounter: z.number().default(0),
  things: z.array(thingSchema).default([]),
  payments: z.array(paymentSchema).default([]),
})
export type DatabaseSchema = z.infer<typeof databaseSchema>
