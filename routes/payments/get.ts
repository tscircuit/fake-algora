import { withRouteSpec } from "lib/middleware/with-winter-spec"
import {
  paymentIdQuerySchema,
  paymentLookupResponseSchema,
} from "lib/payments/route-schemas"

export default withRouteSpec({
  methods: ["GET"],
  queryParams: paymentIdQuerySchema,
  jsonResponse: paymentLookupResponseSchema,
})((req, ctx) => {
  const payment = ctx.db.getPayment(req.query.payment_id)
  if (!payment) {
    return ctx.json({ ok: false, error: "payment_not_found" }).status(404)
  }
  return ctx.json({ ok: true, payment })
})
