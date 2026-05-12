import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const paymentTransitionBodySchema = z.object({
  payment_id: z.string().min(1),
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: paymentTransitionBodySchema,
  jsonResponse: z.object({
    payment: paymentSchema.optional(),
  }),
})(async (req, ctx) => {
  const { payment_id } = paymentTransitionBodySchema.parse(await req.json())
  const payment = ctx.db.updatePaymentStatus(payment_id, "cancelled")

  return ctx.json({ payment })
})
