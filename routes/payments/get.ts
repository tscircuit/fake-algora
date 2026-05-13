import { withRouteSpec } from "lib/middleware/with-winter-spec"
import {
  paymentGetQuerySchema,
  paymentOrErrorResponseSchema,
} from "lib/payments/schemas"

export default withRouteSpec({
  methods: ["GET"],
  queryParams: paymentGetQuerySchema,
  jsonResponse: paymentOrErrorResponseSchema,
})((req, ctx) => {
  const payment = ctx.db.payments.find(
    (currentPayment) => currentPayment.payment_id === req.query.payment_id,
  )

  if (!payment) {
    return ctx.json({ error: "Payment not found" }).status(404)
  }

  return ctx.json({ payment })
})
