import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const transitionPaymentBodySchema = z.object({
  payment_id: z.string().min(1),
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: transitionPaymentBodySchema,
  jsonResponse: z.object({
    ok: z.boolean(),
    payment: paymentSchema.optional(),
    error: z.string().optional(),
  }),
})(async (req, ctx) => {
  const body = transitionPaymentBodySchema.parse(await req.json())
  const result = ctx.db.transitionPayment(body.payment_id, "completed")

  return ctx.json(result)
})
