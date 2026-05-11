import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["GET"],
  jsonResponse: z.object({
    payment: paymentSchema.nullable(),
  }),
})((req, ctx) => {
  const payment_id = new URL(req.url).searchParams.get("payment_id")
  const payment =
    ctx.db.payments.find((item) => item.payment_id === payment_id) ?? null

  return ctx.json({ payment })
})
