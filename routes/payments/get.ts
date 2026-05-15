import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"
import { paymentResponseSchema } from "./schema"

export default withRouteSpec({
  methods: ["GET"],
  jsonResponse: paymentResponseSchema.extend({
    payment: paymentResponseSchema.shape.payment.optional(),
    ok: z.boolean(),
    error: z.string().optional(),
  }),
})((req, ctx) => {
  const url = new URL(req.url)
  const paymentId = url.searchParams.get("payment_id")
  const payment = ctx.db.payments.find(
    (candidate) => candidate.payment_id === paymentId,
  )

  if (!payment) {
    return ctx.json({ ok: false, error: "Payment not found" })
  }

  return ctx.json({ ok: true, payment })
})
