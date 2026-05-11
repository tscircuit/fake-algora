import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const updatePaymentBodySchema = z.object({
  payment_id: z.string().min(1),
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: updatePaymentBodySchema,
  jsonResponse: z.object({
    payment: paymentSchema.nullable(),
  }),
})(async (req, ctx) => {
  const { payment_id } = updatePaymentBodySchema.parse(await req.json())
  const payment = ctx.db.updatePaymentStatus({
    payment_id,
    status: "failed",
  })

  return ctx.json({ payment: payment ?? null })
})
