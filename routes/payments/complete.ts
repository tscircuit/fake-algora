import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const bodySchema = z.object({
  payment_id: z.string(),
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: bodySchema,
  jsonResponse: z.union([
    z.object({
      payment: paymentSchema,
    }),
    z.object({
      error: z.string(),
    }),
  ]),
})(async (req, ctx) => {
  const { payment_id } = bodySchema.parse(await req.json())
  const payment = ctx.db.updatePaymentStatus(payment_id, "completed")

  if (!payment) {
    return ctx.json({ error: "Payment not found" }, { status: 404 })
  }

  return ctx.json({ payment })
})
