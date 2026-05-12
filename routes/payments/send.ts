import { withRouteSpec } from "lib/middleware/with-winter-spec"
import {
  paymentResponseSchema,
  sendPaymentRequestSchema,
} from "lib/payments/route-schemas"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: sendPaymentRequestSchema,
  jsonResponse: paymentResponseSchema,
})(async (req, ctx) => {
  const paymentRequest = await req.json()
  const payment = ctx.db.sendPayment({
    ...paymentRequest,
    idempotency_key:
      paymentRequest.idempotency_key ??
      req.headers.get("Idempotency-Key") ??
      undefined,
  })

  return ctx.json({ payment })
})
