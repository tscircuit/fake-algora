import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: z.object({
    payment_id: z.string().min(1),
  }),
  jsonResponse: z.object({
    ok: z.boolean(),
    payment: paymentSchema.nullable(),
    error: z.string().optional(),
  }),
})(async (req, ctx) => {
  const { payment_id } = await req.json()
  const payment = ctx.db.findPaymentById(payment_id)
  if (!payment) {
    return ctx.json({
      ok: false,
      payment: null,
      error: "Payment not found",
    })
  }

  if (payment.status !== "pending") {
    return ctx.json({
      ok: false,
      payment,
      error: `Cannot cancel a ${payment.status} payment`,
    })
  }

  return ctx.json({
    ok: true,
    payment: ctx.db.updatePaymentStatus(payment_id, "canceled"),
  })
})
