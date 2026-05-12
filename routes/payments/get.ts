import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["GET"],
  jsonResponse: z.union([
    z.object({
      payment: paymentSchema,
    }),
    z.object({
      error: z.string(),
    }),
  ]),
})((req, ctx) => {
  const url = new URL(req.url)
  const paymentId = url.searchParams.get("payment_id")
  const payment = paymentId ? ctx.db.getPayment(paymentId) : undefined

  if (!payment) {
    return ctx.json({ error: "Payment not found" }, { status: 404 })
  }

  return ctx.json({ payment })
})
