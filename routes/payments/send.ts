import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const paymentResponse = z.object({
  payment_id: z.string(),
  recipient: z.string(),
  amount: z.number(),
  currency: z.string(),
  bounty_issue: z.number().optional(),
  status: z.enum(["pending", "sent"]),
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: z.object({
    recipient: z.string(),
    amount: z.number().positive(),
    currency: z.string().default("USD"),
    bounty_issue: z.number().optional(),
  }),
  jsonResponse: paymentResponse,
})(async (req, ctx) => {
  const body = await req.json()
  const payment_id = ctx.db.sendPayment(body)
  const payment = ctx.db.payments.find((p) => p.payment_id === payment_id)!
  return ctx.json(payment)
})
