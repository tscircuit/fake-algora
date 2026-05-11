import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const completePaymentBodySchema = z.object({
  payment_id: z.string().min(1),
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: completePaymentBodySchema,
  jsonResponse: z.object({
    payment: paymentSchema.nullable(),
  }),
})(async (req, ctx) => {
  const { payment_id } = completePaymentBodySchema.parse(await req.json())
  const payment = ctx.db.completePayment(payment_id)

  return ctx.json({ payment: payment ?? null })
})
