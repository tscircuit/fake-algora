import { withRouteSpec } from "lib/middleware/with-winter-spec"
import {
  paymentIdBodySchema,
  paymentLookupResponseSchema,
} from "lib/payments/route-schemas"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: paymentIdBodySchema,
  jsonResponse: paymentLookupResponseSchema,
})((req, ctx) => {
  const { payment, error } = ctx.db.updatePaymentStatus(
    req.jsonBody.payment_id,
    "completed",
  )
  if (error === "not_found") {
    return ctx.json({ ok: false, error: "payment_not_found" }).status(404)
  }
  if (error === "terminal_status") {
    return ctx.json({ ok: false, error: "payment_is_not_pending" }).status(409)
  }
  return ctx.json({ ok: true, payment: payment! })
})
