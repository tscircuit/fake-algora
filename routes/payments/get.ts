import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const getPaymentResponseSchema = z.union([
  z.object({
    payment: paymentSchema,
  }),
  z.object({
    error: z.string(),
  }),
])

export default withRouteSpec({
  methods: ["GET"],
  jsonResponse: getPaymentResponseSchema,
})((req, ctx) => {
  const url = new URL(req.url)
  const paymentId = url.searchParams.get("payment_id")

  if (!paymentId) {
    return ctx.json({ error: "payment_id is required" }, { status: 400 })
  }

  const payment = ctx.db.getPaymentById(paymentId)

  if (!payment) {
    return ctx.json({ error: "payment not found" }, { status: 404 })
  }

  return ctx.json({ payment })
})
