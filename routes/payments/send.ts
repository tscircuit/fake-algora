import { withRouteSpec } from "lib/middleware/with-winter-spec"
import {
  sendPaymentBodySchema,
  sendPaymentResponseSchema,
} from "lib/payments/route-schemas"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: sendPaymentBodySchema,
  jsonResponse: sendPaymentResponseSchema,
})(async (req, ctx) => {
  const { payment, idempotent_replay } = ctx.db.createPayment(req.jsonBody)
  return ctx.json({ ok: true, payment, idempotent_replay })
})
