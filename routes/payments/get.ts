import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["GET"],
  jsonResponse: z.object({
    payment: paymentSchema.nullable(),
  }),
})((req, ctx) => {
  const url = new URL(req.url)
  const paymentId = url.searchParams.get("payment_id")
  const payment =
    ctx.db.payments.find((record) => record.payment_id === paymentId) ?? null

  return ctx.json({ payment })
})
