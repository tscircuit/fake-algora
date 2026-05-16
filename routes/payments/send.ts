import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: z.object({
    amount: z.number().positive(),
    currency: z.string().default("USD"),
    recipient: z.string(),
    description: z.string(),
  }),
  jsonResponse: z.object({
    ok: z.boolean(),
    payment_id: z.string(),
  }),
})(async (req, ctx) => {
  const { amount, currency, recipient, description } = await req.json()
  ctx.db.addPayment({
    amount,
    currency,
    recipient,
    description,
    status: "completed",
  })
  const payments = ctx.db.payments
  const payment = payments[payments.length - 1]
  return ctx.json({ ok: true, payment_id: payment.payment_id })
})
