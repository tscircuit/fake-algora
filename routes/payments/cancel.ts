import { withRouteSpec } from "lib/middleware/with-winter-spec"
import {
  paymentResponseOrErrorSchema,
  paymentStatusTransitionRequestSchema,
} from "lib/payments/schemas"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: paymentStatusTransitionRequestSchema,
  jsonResponse: paymentResponseOrErrorSchema,
})(async (req, ctx) => {
  const { payment_id } = paymentStatusTransitionRequestSchema.parse(
    await req.json(),
  )
  const payment = ctx.db.updatePaymentStatus(payment_id, "cancelled")

  if (!payment) {
    return ctx.json(
      { ok: false, error: `Payment "${payment_id}" was not found` },
      { status: 404 },
    )
  }

  return ctx.json({ ok: true, payment })
})
