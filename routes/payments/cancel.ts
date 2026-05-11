import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const cancelPaymentBodySchema = z.object({
  payment_id: z.string().min(1),
  cancel_reason: z.string().min(1).optional(),
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: cancelPaymentBodySchema,
  jsonResponse: z.object({
    payment: paymentSchema.nullable(),
  }),
})(async (req, ctx) => {
  const { payment_id, cancel_reason } = cancelPaymentBodySchema.parse(
    await req.json(),
  )
  const payment = ctx.db.cancelPayment(payment_id, cancel_reason)

  return ctx.json({ payment: payment ?? null })
})
