import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const paymentResponseSchema = z.object({
  payment_id: z.string(),
  recipient_email: z.string(),
  amount_usd: z.number(),
  note: z.string().optional(),
  status: z.enum(["pending", "sent", "failed"]),
  created_at: z.string(),
  sent_at: z.string().optional(),
})

export default withRouteSpec({
  methods: ["GET"],
  queryParams: z.object({
    recipient_email: z.string().email().optional(),
    status: z.enum(["pending", "sent", "failed"]).optional(),
  }),
  jsonResponse: z.object({
    ok: z.boolean(),
    payments: z.array(paymentResponseSchema),
  }),
})(async (req, ctx) => {
  const url = new URL(req.url)
  const recipient_email = url.searchParams.get("recipient_email") ?? undefined
  const status = url.searchParams.get("status") as
    | "pending"
    | "sent"
    | "failed"
    | undefined

  let payments = ctx.db.getState().payments

  if (recipient_email) {
    payments = payments.filter((p) => p.recipient_email === recipient_email)
  }
  if (status) {
    payments = payments.filter((p) => p.status === status)
  }

  return ctx.json({ ok: true, payments })
})
