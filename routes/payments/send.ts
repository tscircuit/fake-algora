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
  const body = sendPaymentBodySchema.parse(await req.json())
  const result = ctx.db.createPayment(body)

  return ctx.json(result)
})
