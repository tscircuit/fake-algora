import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { paymentSchema } from "lib/db/schema"
import { z } from "zod"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: z.object({
    recipient: z.string().min(1),
    amount_cents: z.number().int().positive(),
    currency: z.string().length(3).default("USD"),
    memo: z.string().optional(),
    idempotency_key: z.string().optional(),
  }),
  jsonResponse: z.object({
    payment: paymentSchema,
  }),
})(async (req, ctx) => {
  const paymentRequest = await req.json()
  const payment = ctx.db.sendPayment(paymentRequest)

  return ctx.json({ payment })
})
