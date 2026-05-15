import { z } from "zod"

// When defining your database schema, try to use snake case for column names.

export const thingSchema = z.object({
  thing_id: z.string(),
  name: z.string(),
  description: z.string(),
})
export type Thing = z.infer<typeof thingSchema>

export const paymentSchema = z.object({
  payment_id: z.string(),
  recipient_email: z.string().email(),
  amount_usd: z.number().positive(),
  note: z.string().optional(),
  status: z.enum(["pending", "sent", "failed"]).default("pending"),
  created_at: z.string(),
  sent_at: z.string().optional(),
})
export type Payment = z.infer<typeof paymentSchema>

export const databaseSchema = z.object({
  idCounter: z.number().default(0),
  things: z.array(thingSchema).default([]),
  payments: z.array(paymentSchema).default([]),
})
export type DatabaseSchema = z.infer<typeof databaseSchema>
