import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: z.object({
    payment_id: z.string().min(1),
  }),
  jsonResponse: z.union([
    z.object({
      payment: paymentSchema,
    }),
    z.object({
      error: z.string(),
    }),
  ]),
})(async (req, ctx) => {
  const { payment_id } = await req.json()
  const payment = ctx.db.updatePaymentStatus(payment_id, "cancelled")

  if (!payment) {
    return ctx.json({ error: "payment not found" }, { status: 404 })
  }

  return ctx.json({ payment })
})
