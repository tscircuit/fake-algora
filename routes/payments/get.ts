import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["GET"],
  queryParams: z.object({
    payment_id: z.string().min(1),
  }),
  jsonResponse: z.object({
    payment: paymentSchema.optional(),
    ok: z.boolean(),
    error: z.string().optional(),
  }),
})((req, ctx) => {
  const payment = ctx.db.getPayment(req.query.payment_id)

  if (!payment) {
    return ctx
      .json({
        ok: false,
        error: "Payment not found",
      })
      .status(404)
  }

  return ctx.json({
    ok: true,
    payment,
  })
})
