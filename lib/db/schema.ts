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
  recipient: z.string(),
  amount: z.number().positive(),
  currency: z.string().default("USD"),
  status: z.enum(["pending", "completed", "failed"]).default("pending"),
  bounty_id: z.string().optional(),
  issue_number: z.number().optional(),
  repository: z.string().optional(),
  created_at: z.string(),
  completed_at: z.string().optional(),
})
export type Payment = z.infer<typeof paymentSchema>

export const databaseSchema = z.object({
  idCounter: z.number().default(0),
  things: z.array(thingSchema).default([]),
  payments: z.array(paymentSchema).default([]),
})
export type DatabaseSchema = z.infer<typeof databaseSchema>