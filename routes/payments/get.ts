import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { paymentResponseSchema } from "lib/payments/schemas"

export default withRouteSpec({
  methods: ["GET"],
  jsonResponse: paymentResponseSchema,
})((req, ctx) => {
  const url = new URL(req.url)
  const payment_id = url.searchParams.get("payment_id")
  const payment = ctx.db.payments.find(
    (candidate) => candidate.payment_id === payment_id,
  )

  if (!payment) {
    return ctx.json({ ok: false, error: "payment_not_found" })
  }

  return ctx.json({ ok: true, payment })
})
