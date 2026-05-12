import { withRouteSpec } from "lib/middleware/with-winter-spec"
import {
  failPaymentRequestSchema,
  paymentResponseOrErrorSchema,
} from "lib/payments/schemas"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: failPaymentRequestSchema,
  jsonResponse: paymentResponseOrErrorSchema,
})(async (req, ctx) => {
  const { payment_id, reason } = failPaymentRequestSchema.parse(
    await req.json(),
  )
  const payment = ctx.db.updatePaymentStatus(payment_id, "failed", reason)

  if (!payment) {
    return ctx.json(
      { ok: false, error: `Payment "${payment_id}" was not found` },
      { status: 404 },
    )
  }

  return ctx.json({ ok: true, payment })
})
