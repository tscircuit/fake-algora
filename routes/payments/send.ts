import { withRouteSpec } from "lib/middleware/with-winter-spec"
import {
  sendPaymentBodySchema,
  sendPaymentResponseSchema,
} from "lib/payments/schemas"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: sendPaymentBodySchema,
  jsonResponse: sendPaymentResponseSchema,
})(async (req, ctx) => {
  const paymentRequest = await req.json()
  const idempotencyHeader = req.headers.get("idempotency-key") ?? undefined
  const result = ctx.db.createPayment({
    ...paymentRequest,
    idempotency_key: paymentRequest.idempotency_key ?? idempotencyHeader,
  })

  return ctx.json(result)
})
