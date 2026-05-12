import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const getPaymentResponseSchema = z.union([
  z.object({
    ok: z.literal(true),
    payment: paymentSchema,
  }),
  z.object({
    ok: z.literal(false),
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
    return ctx.json({
      ok: false,
      error: "payment_id query parameter is required",
    })
  }

  const payment = ctx.db.findPaymentById(paymentId)
  if (!payment) {
    return ctx.json({ ok: false, error: "payment not found" })
  }

  return ctx.json({ ok: true, payment })
})
