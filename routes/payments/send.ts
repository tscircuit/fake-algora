import { withRouteSpec } from "lib/middleware/with-winter-spec"
import {
  paymentSendBodySchema,
  sendPaymentResponseSchema,
} from "lib/payments/schemas"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: paymentSendBodySchema,
  jsonResponse: sendPaymentResponseSchema,
})(async (req, ctx) => {
  const body = paymentSendBodySchema.parse(await req.json())
  const { payment, idempotent } = ctx.db.createPayment(body)

  return ctx.json({
    idempotent,
    payment,
  })
})
