import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const paymentResponseSchema = z.object({
  payment_id: z.string(),
  recipient: z.string(),
  amount_usd: z.number(),
  memo: z.string().optional(),
  idempotency_key: z.string().optional(),
  status: z.enum(["sent", "failed"]),
  created_at: z.string(),
  sent_at: z.string().optional(),
  failure_reason: z.string().optional(),
})

export default withRouteSpec({
  methods: ["GET"],
  jsonResponse: z.object({
    payments: z.array(paymentResponseSchema),
  }),
})((req, ctx) => {
  const url = new URL(req.url)
  const recipient = url.searchParams.get("recipient")

  const payments = recipient
    ? ctx.db.payments.filter((payment) => payment.recipient === recipient)
    : ctx.db.payments

  return ctx.json({ payments })
})
