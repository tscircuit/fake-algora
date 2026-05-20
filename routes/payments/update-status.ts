import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const updateStatusRequestSchema = z.object({
  payment_id: z.string().min(1),
  status: z.enum(["completed", "canceled", "failed"]),
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: updateStatusRequestSchema,
  jsonResponse: z.object({
    payment: paymentSchema.optional(),
  }),
})(async (req, ctx) => {
  const { payment_id, status } = updateStatusRequestSchema.parse(
    await req.json(),
  )
  const payment = ctx.db.updatePaymentStatus(payment_id, status)

  return ctx.json({ payment })
})
