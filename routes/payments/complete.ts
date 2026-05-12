import { withRouteSpec } from "lib/middleware/with-winter-spec"
import {
  paymentErrorResponseSchema,
  paymentIdRequestSchema,
  paymentResponseSchema,
} from "lib/payments/route-schemas"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: paymentIdRequestSchema,
  jsonResponse: paymentResponseSchema.or(paymentErrorResponseSchema),
})(async (req, ctx) => {
  const { payment_id } = await req.json()
  const { payment, error } = ctx.db.transitionPayment(payment_id, "completed")

  if (error === "not_found") {
    return ctx.json({ error: "Payment not found" }, { status: 404 })
  }
  if (error === "terminal") {
    return ctx.json({ error: "Payment is already terminal" }, { status: 409 })
  }
  if (!payment) {
    return ctx.json({ error: "Payment transition failed" }, { status: 500 })
  }

  return ctx.json({ payment })
})
