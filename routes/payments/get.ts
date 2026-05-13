import { z } from "zod"
import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"

export default withRouteSpec({
  methods: ["GET"],
  queryParams: z.object({
    payment_id: z.string(),
  }),
  jsonResponse: z.object({
    payment: paymentSchema.nullable(),
  }),
})((req, ctx) => {
  const url = new URL(req.url)
  const paymentId = url.searchParams.get("payment_id")
  const payment =
    ctx.db.payments.find((p) => p.payment_id === paymentId) ?? null

  return ctx.json({ payment })
})
