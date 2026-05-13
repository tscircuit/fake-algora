import { withRouteSpec } from "lib/middleware/with-winter-spec"
import {
  paymentOrErrorResponseSchema,
  paymentStatusBodySchema,
} from "lib/payments/schemas"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: paymentStatusBodySchema,
  jsonResponse: paymentOrErrorResponseSchema,
})(async (req, ctx) => {
  const { payment_id } = await req.json()
  const payment = ctx.db.updatePaymentStatus(payment_id, "completed")

  if (!payment) {
    return ctx.json({ error: "Payment not found" }).status(404)
  }

  return ctx.json({ payment })
})
