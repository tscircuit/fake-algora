import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const transitionPaymentBodySchema = z.object({
  payment_id: z.string().min(1),
})

const transitionPaymentResponseSchema = z.union([
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
  methods: ["POST"],
  jsonBody: transitionPaymentBodySchema,
  jsonResponse: transitionPaymentResponseSchema,
})(async (req, ctx) => {
  const { payment_id } = transitionPaymentBodySchema.parse(await req.json())
  const payment = ctx.db.transitionPayment(payment_id, "completed")

  if (!payment) {
    return ctx.json({ ok: false, error: "payment not found" })
  }

  return ctx.json({ ok: true, payment })
})
