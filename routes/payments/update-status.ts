import { paymentSchema, paymentStatusSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: z.object({
    payment_id: z.string(),
    status: paymentStatusSchema,
  }),
  jsonResponse: z.object({
    payment: paymentSchema.nullable(),
  }),
})(async (req, ctx) => {
  const { payment_id, status } = await req.json()
  return ctx.json({
    payment: ctx.db.updatePaymentStatus(payment_id, status) ?? null,
  })
})
