import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { paymentSchema } from "lib/db/schema"
import { z } from "zod"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: z.object({
    recipient: z.string().min(1),
    amount_usd: z.number().positive(),
    memo: z.string().optional(),
  }),
  jsonResponse: z.object({
    ok: z.boolean(),
    payment: paymentSchema,
  }),
})(async (req, ctx) => {
  const paymentRequest = await req.json()
  const payment = ctx.db.sendPayment(paymentRequest)

  return ctx.json({ ok: true, payment })
})
