import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["GET"],
  jsonResponse: z.object({
    ok: z.boolean(),
    error: z.string().optional(),
    payment: paymentSchema.optional(),
  }),
})((req, ctx) => {
  const paymentId = new URL(req.url).searchParams.get("payment_id")
  const payment = ctx.db.payments.find(
    (existing) => existing.payment_id === paymentId,
  )

  if (!payment) {
    return ctx.json({ ok: false, error: "Payment not found" })
  }

  return ctx.json({ ok: true, payment })
})
