import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["GET"],
  queryParams: z.object({
    payment_id: z.string().min(1),
  }),
  jsonResponse: z.object({
    payment: paymentSchema.nullable(),
  }),
})((req, ctx) => {
  return ctx.json({
    payment: ctx.db.findPaymentById(req.query.payment_id) ?? null,
  })
})
