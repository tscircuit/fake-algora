import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { paymentOrErrorResponseSchema } from "lib/payments/schemas"

export default withRouteSpec({
  methods: ["GET"],
  jsonResponse: paymentOrErrorResponseSchema,
})((req, ctx) => {
  const url = new URL(req.url)
  const paymentId = url.searchParams.get("payment_id")

  if (!paymentId) {
    return Response.json({ error: "payment_id_required" }, { status: 400 })
  }

  const payment = ctx.db.getPayment(paymentId)

  if (!payment) {
    return Response.json({ error: "payment_not_found" }, { status: 404 })
  }

  return ctx.json({ payment })
})
