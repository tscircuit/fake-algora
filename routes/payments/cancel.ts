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
    error: z.string().optional(),
    payment: paymentSchema.optional(),
  }),
})(async (req, ctx) => {
  const { payment_id } = await req.json()
  const payment = ctx.db.payments.find(
    (existing) => existing.payment_id === payment_id,
  )

  if (!payment) {
    return ctx.json({ ok: false, error: "Payment not found" })
  }

  if (payment.status !== "pending") {
    return ctx.json({ ok: false, error: "Only pending payments can cancel" })
  }

  const updatedPayment = ctx.db.updatePaymentStatus(payment_id, "canceled")

  return ctx.json({ ok: true, payment: updatedPayment })
})
