import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { nullablePaymentResponseSchema } from "lib/payments/schemas"

export default withRouteSpec({
  methods: ["GET"],
  jsonResponse: nullablePaymentResponseSchema,
})((req, ctx) => {
  const paymentId = new URL(req.url).searchParams.get("payment_id")
  const payment = paymentId ? ctx.db.getPayment(paymentId) : undefined

  return ctx.json({ payment: payment ?? null })
})
