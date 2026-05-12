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
  const payment = ctx.db.findPayment(payment_id)

  if (!payment) return ctx.json({ error: "Payment not found" }, { status: 404 })

  return ctx.json({ payment })
})
