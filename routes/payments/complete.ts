import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: z.object({
    payment_id: z.string().min(1),
  }),
  jsonResponse: z.object({
    payment: paymentSchema.optional(),
    ok: z.boolean(),
    error: z.string().optional(),
  }),
})(async (req, ctx) => {
  const { payment_id } = await req.json()
  const payment = ctx.db.updatePaymentStatus(payment_id, "completed")

  if (!payment) {
    return ctx
      .json({
        ok: false,
        error: "Payment not found",
      })
      .status(404)
  }

  return ctx.json({ ok: true, payment })
})
