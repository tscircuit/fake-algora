import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { paymentStatusBodySchema, paymentStatusResponseSchema } from "./schema"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: paymentStatusBodySchema,
  jsonResponse: paymentStatusResponseSchema,
})(async (req, ctx) => {
  const { payment_id } = await req.json()
  const payment = ctx.db.updatePaymentStatus(payment_id, "failed")

  if (!payment) {
    return ctx.json({ ok: false, error: "Payment not found" })
  }

  return ctx.json({ ok: true, payment })
})
