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
  }),
})(async (req, ctx) => {
  const { payment_id } = await req.json()
  const payment = ctx.db.updatePaymentStatus(payment_id, "completed")

  return ctx.json({
    ok: Boolean(payment),
    payment,
  })
})
