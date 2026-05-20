import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { paymentRouteResponseSchema } from "lib/payments/schemas"

export default withRouteSpec({
  methods: ["GET"],
  jsonResponse: paymentRouteResponseSchema,
})((req, ctx) => {
  const url = new URL(req.url)
  const payment = ctx.db.getPayment(url.searchParams.get("payment_id") ?? "")

  if (!payment) {
    return ctx.json({ error: "Payment not found" }, { status: 404 })
  }

  return ctx.json({ payment })
})
