import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { paymentSchema } from "lib/db/schema"
import { z } from "zod"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: z.object({
    recipient: z.string().min(1),
    amount_cents: z.number().int().positive(),
    currency: z.string().min(1).default("USD"),
    memo: z.string().optional(),
  }),
  jsonResponse: z.object({
    ok: z.boolean(),
    payment: paymentSchema,
  }),
})(async (req, ctx) => {
  const { recipient, amount_cents, currency = "USD", memo } = await req.json()

  const payment = ctx.db.addPayment({
    recipient,
    amount_cents,
    currency,
    memo,
    status: "sent",
  })

  return ctx.json({ ok: true, payment })
})
