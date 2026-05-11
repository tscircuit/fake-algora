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
  const payment = ctx.db.getPayment(url.searchParams.get("payment_id") ?? "")

  return ctx.json({ payment: payment ?? null })
})
