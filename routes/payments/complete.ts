import { withRouteSpec } from "lib/middleware/with-winter-spec"
import {
  nullablePaymentResponseSchema,
  transitionPaymentBodySchema,
} from "lib/payments/schemas"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: transitionPaymentBodySchema,
  jsonResponse: nullablePaymentResponseSchema,
})(async (req, ctx) => {
  const { payment_id } = transitionPaymentBodySchema.parse(await req.json())
  const payment = ctx.db.updatePaymentStatus(payment_id, "completed")

  return ctx.json({ payment: payment ?? null })
})
