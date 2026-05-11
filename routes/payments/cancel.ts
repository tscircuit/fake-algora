import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: z.object({
    payment_id: z.string(),
    cancel_reason: z.string().optional(),
  }),
  jsonResponse: z.object({
    payment: paymentSchema.nullable(),
  }),
})(async (req, ctx) => {
  const { payment_id, cancel_reason } = await req.json()
  const payment = ctx.db.updatePaymentStatus(payment_id, "canceled", {
    cancel_reason,
  })

  return ctx.json({ payment: payment ?? null })
})
