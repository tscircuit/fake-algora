import { paymentSchema, paymentStatusSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const updateStatusBodySchema = z.object({
  payment_id: z.string().min(1),
  status: paymentStatusSchema.exclude(["pending"]),
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: updateStatusBodySchema,
  jsonResponse: z.object({
    payment: paymentSchema.optional(),
  }),
})(async (req, ctx) => {
  const body = updateStatusBodySchema.parse(await req.json())
  const payment = ctx.db.updatePaymentStatus(body.payment_id, body.status)

  return ctx.json({ payment })
})
