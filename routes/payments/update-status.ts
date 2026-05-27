import { paymentSchema, paymentStatusSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const updateStatusRequestSchema = z.object({
  payment_id: z.string().min(1),
  status: paymentStatusSchema,
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: updateStatusRequestSchema,
  jsonResponse: z.object({
    ok: z.boolean(),
    payment: paymentSchema.nullable(),
  }),
})(async (req, ctx) => {
  const { payment_id, status } = updateStatusRequestSchema.parse(
    await req.json(),
  )
  const payment = ctx.db.updatePaymentStatus(payment_id, status) ?? null

  return ctx.json({ ok: Boolean(payment), payment })
})
