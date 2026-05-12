import { withRouteSpec } from "lib/middleware/with-winter-spec"
import {
  paymentIdBodySchema,
  paymentResponseSchema,
} from "lib/payments/schemas"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: paymentIdBodySchema,
  jsonResponse: paymentResponseSchema,
})(async (req, ctx) => {
  const { payment_id } = paymentIdBodySchema.parse(await req.json())
  const payment = ctx.db.payments.find(
    (candidate) => candidate.payment_id === payment_id,
  )

  if (!payment) {
    return ctx.json({ ok: false, error: "payment_not_found" })
  }

  if (payment.status !== "pending") {
    return ctx.json({ ok: false, error: "payment_not_pending" })
  }

  return ctx.json({
    ok: true,
    payment: ctx.db.updatePaymentStatus(payment_id, "cancelled"),
  })
})
