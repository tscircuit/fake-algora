import { withRouteSpec } from "lib/middleware/with-winter-spec"
import {
  paymentResponseSchema,
  sendPaymentRequestSchema,
} from "lib/payments/schemas"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: sendPaymentRequestSchema,
  jsonResponse: paymentResponseSchema,
})(async (req, ctx) => {
  const paymentInput = sendPaymentRequestSchema.parse(await req.json())
  const payment = ctx.db.createPayment(paymentInput)

  return ctx.json({ ok: true, payment }, { status: 201 })
})
