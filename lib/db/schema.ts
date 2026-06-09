import { z } from "zod"

  // When defining your database schema, try to use snake case for column names.

  export const thingSchema = z.object({
    thing_id: z.string(),
    name: z.string(),
    description: z.string(),
  })
  export type Thing = z.infer<typeof thingSchema>

  export const bountySchema = z.object({
    bounty_id: z.string(),
    issue_url: z.string(),
    amount_usd: z.number(),
    status: z.enum(["open", "in_progress", "paid"]).default("open"),
    created_at: z.string(),
  })
  export type Bounty = z.infer<typeof bountySchema>

  export const paymentSchema = z.object({
    payment_id: z.string(),
    bounty_id: z.string(),
    recipient_username: z.string(),
    amount_usd: z.number(),
    paid_at: z.string(),
  })
  export type Payment = z.infer<typeof paymentSchema>

  export const databaseSchema = z.object({
    idCounter: z.number().default(0),
    things: z.array(thingSchema).default([]),
    bounties: z.array(bountySchema).default([]),
    payments: z.array(paymentSchema).default([]),
  })
  export type DatabaseSchema = z.infer<typeof databaseSchema>
  