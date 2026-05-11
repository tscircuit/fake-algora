import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const paymentIdBodySchema = z.object({
  payment_id: z.string(),
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: paymentIdBodySchema,
  jsonResponse: z.object({
    payment: paymentSchema.nullable(),
  }),
})(async (req, ctx) => {
  const { payment_id } = await req.json()
  const payment = ctx.db.updatePaymentStatus(payment_id, "canceled") ?? null

  return ctx.json({ payment })
})
