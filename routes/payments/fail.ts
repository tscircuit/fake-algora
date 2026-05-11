import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const failPaymentBodySchema = z.object({
  payment_id: z.string().min(1),
  failure_reason: z.string().min(1).optional(),
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: failPaymentBodySchema,
  jsonResponse: z.object({
    payment: paymentSchema.nullable(),
  }),
})(async (req, ctx) => {
  const { payment_id, failure_reason } = failPaymentBodySchema.parse(
    await req.json(),
  )
  const payment = ctx.db.failPayment(payment_id, failure_reason)

  return ctx.json({ payment: payment ?? null })
})
