import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["GET"],
  queryParams: z.object({
    payment_id: z.string(),
  }),
  jsonResponse: z.object({
    payment: paymentSchema.nullable(),
  }),
})((req, ctx) => {
  const payment_id = new URL(req.url).searchParams.get("payment_id") ?? ""

  return ctx.json({
    payment: ctx.db.getPayment(payment_id) ?? null,
  })
})
