import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const updatePaymentBodySchema = z.object({
  payment_id: z.string(),
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: updatePaymentBodySchema,
  jsonResponse: z.object({
    payment: paymentSchema.nullable(),
  }),
})(async (req, ctx) => {
  const { payment_id } = updatePaymentBodySchema.parse(await req.json())
  return ctx.json({
    payment: ctx.db.updatePaymentStatus(payment_id, "canceled") ?? null,
  })
})
